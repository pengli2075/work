import axiosForCommon from 'component/axiosForCommon';
import moment from 'moment';
import LbwJsUtilsH5 from 'component/LbwJsUtilsH5';

let socket = null; // 当前socket.io连接变量
let localRtcPeeCon = null;
let videoRoom = null; // 当前房间号
let localStream = null; // 本地视频流
let remoteStream = null; // 远程视频流
let iceServers = null; // 本地视频流
let is_front_camera = false; // 是否前置摄像头
let u = navigator.userAgent;
let isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1;

// 房间通信消息
export let sendMessage = (room, message) => {
    socket.emit('room message', room, message);
}

// web rtc 视频初始化
export let webRtcVideoInit = (remoteJoinVideoConfirm, remoteJoinVideoComplete, remoteRejectvideo, remoteVideoEnd, successCallback, errorCallback) => {
    axiosForCommon('getSocketioServiceBySwpaam', {}, result => {
        if (result.socketService && result.socketService.token && result.socketService.url) {
            if (result.socketService.supplementaryInfo && result.socketService.supplementaryInfo.iceServers) { // 设置ice配置
                iceServers = result.socketService.supplementaryInfo.iceServers;
            }
            let ioUrl = result.socketService.url;
            if (window._SOCKET_SERVICE_DOMAIN_) {
                ioUrl = ioUrl.replace(ioUrl.substring(ioUrl.indexOf('//') + 2, ioUrl.lastIndexOf(':')), window._SOCKET_SERVICE_DOMAIN_);
                if (iceServers) {
                    for (let iceServer of iceServers) {
                        iceServer.urls = iceServer.urls.replace(iceServer.urls.substring(iceServer.urls.indexOf(':') + 1, iceServer.urls.lastIndexOf(':')), window._SOCKET_SERVICE_DOMAIN_);
                    }
                }
            }

            // 发送消息至原生app，如果是原生app
            let sockerioInfo = {};
            sockerioInfo.token = result.socketService.token;
            sockerioInfo.partyId = result.socketService.partyId;
            sockerioInfo.detectVideoServer = result.socketService.supplementaryInfo.detectVideoServer;
            let msgData = {};
            msgData.action = 'sockerioInfo';
            msgData.data = sockerioInfo;
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msgData))

            socket = io(ioUrl, {
                extraHeaders: {Authorization: `Bearer ${result.socketService.token}`},
                rejectUnauthorized: false,
                reconnectionAttempts: 5
            })
            socket.on('connect_error', (error) => {
                if (error.data && error.data.type === 'UnauthorizedError') { // 身份验证失败
                    socket.close();
                    webRtcVideoInit(remoteJoinVideoConfirm, remoteJoinVideoComplete, remoteRejectvideo, remoteVideoEnd, successCallback, errorCallback);
                }
            })
            socket.on('error', (error) => {
                errorCallback(error.toString())
            });

            socket.on('join video confirm', function (message) { // 视频加入确认
                remoteJoinVideoConfirm(message);
            });
            socket.on('join video complete', function (message) { // 视频加入完成
                axiosForCommon('createOrUpdateWebrtcVideoRecord', {
                    webrtcVideoRecordId: message.webrtcVideoRecordId,
                    isAnswer: 'Y',
                }, result => {
                }, error => {
                    LbwJsUtilsH5.UtilToast('fail', '设置视频答复失败：' + error.toString());
                });
                remoteJoinVideoComplete(message);
            });
            socket.on('reject video', function (message) { // 视频拒绝
                axiosForCommon('createOrUpdateWebrtcVideoRecord', {
                    webrtcVideoRecordId: message.webrtcVideoRecordId,
                    isAnswer: 'N',
                }, result => {
                }, error => {
                    LbwJsUtilsH5.UtilToast('fail', '设置视频答复失败：' + error.toString());
                });
                remoteRejectvideo(message);
            });
            socket.on('video end', function (roomInfo) { // 视频结束
                remoteVideoEnd(roomInfo);
                webrtcVideoEndRecord(roomInfo);
            });

            socket.on('message', function (message) { // 房间消息
                if (message.type === 'offer') {
                    localRtcPeeCon.setRemoteDescription(new RTCSessionDescription(message));
                    localRtcPeeCon.createAnswer().then(
                        (sessionDescription) => {
                            localRtcPeeCon.setLocalDescription(sessionDescription).then(
                                () => {
                                    if (videoRoom) {
                                        sendMessage(videoRoom, sessionDescription);
                                    } else {
                                        errorCallback('房间参数丢失，无法继续通信！请稍后重试');
                                    }
                                },
                                (err) => {
                                    errorCallback('Error offer: ' + err.toString());
                                }
                            );
                        },
                        (err) => {
                            errorCallback('Error offer: ' + err.toString());
                        }
                    );
                } else if (message.type === 'answer') {
                    localRtcPeeCon.setRemoteDescription(new RTCSessionDescription(message));
                } else if (message.type === 'candidate') {
                    let candidate = new RTCIceCandidate({
                        sdpMLineIndex: message.sdpMLineIndex,
                        sdpMid: message.sdpMid,
                        candidate: message.candidate,
                    });
                    localRtcPeeCon.addIceCandidate(candidate);
                }
            });
            socket.on('connect', () => {
                // 避免脱机消息被发送
                socket.sendBuffer = [];
                socket.emit('register', {
                    partyId: result.socketService.partyId,
                    fullName: result.socketService.fullName
                });
                successCallback({
                    partyId: result.socketService.partyId,
                    fullName: result.socketService.fullName
                })
            });
        }
    }, error => {
        errorCallback(error._ERROR_MESSAGE_);
    });
}

export let sendVideo = (roomInfo, successCallback, errorCallback) => { // 发送视频
    if (socket.connected) {
        axiosForCommon('createOrUpdateWebrtcVideoRecord', {
            sender: roomInfo.partyIdFrom,
            receiver: roomInfo.partyIdTo,
            workPermitId: roomInfo.workPermitId,
        }, result => {
            roomInfo.webrtcVideoRecordId = result.webrtcVideoRecordId;
            successCallback(roomInfo)
            socket.emit('send video', roomInfo);
        }, error => {
            errorCallback(error._ERROR_MESSAGE_);
        });
    } else {
        errorCallback('发送视频失败，无法连接到服务器');
    }
}

export let sendRejectVideo = (videoUserMsg) => { // 发送拒绝视频
    socket.emit('reject video', videoUserMsg);
}

export let sendJoinVideo = (roomInfo, successCallback) => { // 发送加入视频
    roomInfo.videoStartTime = moment().valueOf(); // 视频开始时间
    socket.emit('join video', roomInfo);
    successCallback(roomInfo);
}

export let localVideoInit = (successCallback, errorCallback) => { // 本地视频初始化——包含摄像头和麦克风
    const constraints = {
        audio: {echoCancellation: true},
        video: {facingMode: 'environment'}
    };
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        localStream = stream;
        successCallback(stream);
    }).catch(function (error) {
        // 提示开启权限
        if (error.toString().includes('Permission')) {
            errorCallback('请开启摄像头和麦克风权限');
            return;
        }
        errorCallback(error.toString());
    });
}

export let setLocalRtcPeeCon = (roomInfo, successCallback, errorCallback) => { // 设置远程连接对象
    videoRoom = roomInfo.partyIdFrom;
    localRtcPeeCon = new RTCPeerConnection(iceServers ? {iceServers: iceServers} : null);
    localRtcPeeCon.onicecandidate = event => {
        try {
            if (event.candidate) {
                sendMessage(videoRoom, {
                    type: 'candidate',
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                });
            }
        } catch (err) {
            errorCallback('Error adding remotePC iceCandidate: ' + err.toString())
        }
    };
    localRtcPeeCon.onaddstream = event => {
        if (event.stream) {
            remoteStream = event.stream;
            successCallback()
        }
    };
    localRtcPeeCon.addStream(localStream);
}

export let createOffer = (roomInfo) => { // 远程连接对象——发送视频信息
    localRtcPeeCon.createOffer().then(
        sdp => {
            localRtcPeeCon.setLocalDescription(sdp).then(
                () => {
                    sendMessage(roomInfo.partyIdFrom, sdp);
                },
                (lderr) => {
                    sLbwJsUtilsH5.UtilToast('fail', 'Error createOffer(setLocalDescription): ' + lderr.toString());
                }
            );
        },
        (err) => {
            LbwJsUtilsH5.UtilToast('fail', 'Error createOffer: ' + err.toString());
        }
    );
}

export let closeStreams = (roomInfo) => { // 关闭视频释放资源
    if (localRtcPeeCon) {
        localRtcPeeCon.removeStream(localStream);
        localRtcPeeCon.close();
        localRtcPeeCon = null;
    }
    if (localStream && isAndroid) {
        localStream.getTracks().forEach(t => t.stop());
        localStream = null;
    }
    if (remoteStream && isAndroid) {
        remoteStream.getTracks().forEach(t => t.stop());
        remoteStream = null;
    }
    if (roomInfo && roomInfo.partyIdFrom) {
        webrtcVideoEndRecord(roomInfo);
        roomInfo.isVideoEndRecord = "Y"; // 视频结束记录标记-设置为已记录
        socket.emit('video end', roomInfo);
    }
    videoRoom = null;
    is_front_camera = false;
}

export let getRemoteStream = () => { // 获取远程视频流
    return remoteStream;
}

export let getLocalStream = () => { // 获取本地视频流
    return localStream;
}

export let toggleAudioMute = () => { // 切换本地音频
    let audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
        LbwJsUtilsH5.UtilToast('fail', '没有可用的本地音频。');
        return;
    }
    for (let i = 0; i < audioTracks.length; ++i) {
        audioTracks[i].enabled = !audioTracks[i].enabled;
    }
};

export let toggleCamera = (localAudio) => { // 切换前置/后置摄像头
    is_front_camera = !is_front_camera;
    let constraints = {
        video: {
            facingMode: is_front_camera ? 'user' : 'environment' // environment or user
        },
    };
    if (localAudio.srcObject && isAndroid) { // 防止设备占用，释放摄像头（安卓）
        localAudio.srcObject.getVideoTracks().forEach(t => t.stop());
    }
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            let videoTrack = stream.getVideoTracks()[0];
            let sender = localRtcPeeCon.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
            });
            sender.replaceTrack(videoTrack);
            localAudio.srcObject = stream;
            localAudio.play();
        })
        .catch(function (error) {
            LbwJsUtilsH5.UtilToast('fail', error);
        });
}

let webrtcVideoEndRecord = (roomInfo) => { // 视频结束记录
    if (roomInfo.isVideoEndRecord == "Y") { // 已记录视频结束，则直接结束
        return;
    }
    axiosForCommon('createOrUpdateWebrtcVideoRecord', {
        webrtcVideoRecordId: roomInfo.webrtcVideoRecordId,
        callTimeConsuming: roomInfo.videoStartTime ? moment().diff(moment(roomInfo.videoStartTime), 'seconds') : 0,
    }, result => {
    }, error => {
        LbwJsUtilsH5.UtilToast('fail', '设置视频通话时长失败：' + error.toString());
    });
}
