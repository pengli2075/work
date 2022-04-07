/**
 * @file:   视频通话弹框
 * @author: pengli
 *
 */

import React, {useState, useEffect, useRef, forwardRef, useImperativeHandle} from 'react';
import {List, Modal} from 'antd-mobile';
import CommonEshIcon from 'component/commonEshIcon';
import './index.css';
import {
    webRtcVideoInit,
    sendVideo,
    sendJoinVideo,
    localVideoInit,
    setLocalRtcPeeCon,
    createOffer,
    getRemoteStream,
    closeStreams,
    toggleAudioMute,
    toggleCamera,
    sendRejectVideo
} from './webRtcVideoUtil';
import LbwJsUtilsH5 from 'component/LbwJsUtilsH5';

let u = navigator.userAgent;
const isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1;

const FaceTimeComponent = forwardRef((props, ref) => {
    // 当前页面所在状态【接听answer、拨打call、通话facetime、接听后receiveVideo】
    const [currentStatus, setCurrentStatus] = useState('');
    const [showCancelBtn, setShowCancelBtn] = useState(true);
    const [curVideoUser, setCurVideoUser] = useState({}); // 当前视频用户信息
    const [videoRoomInfo, setVideoRoomInfo] = useState({}); // 视频房间信息
    const [tempVideoRoomInfo, setTempVideoRoomInfo] = useState({}); // 临时视频房间信息
    const [isMute, setIsMute] = useState(false); // 是否静音
    const [isMainScreen, setIsMainScreen] = useState(true); // 是否在主屏显示（自己的摄像）
    const cancelRef = useRef();
    const localAudio = useRef(null);
    const remoteAudio = useRef(null);
    const [visible, setVisible] = useState(false);
    const approvalFormId = props.approvalFormId;
    const isRemoteRejected = useRef(false);
    const tip = useRef('');
    const isJoinVideo = useRef(false); // 对方是否加入视频通话

    useImperativeHandle(ref, () => ({
        handleCall: handleCall,
    }))

    useEffect(() => {
        if (!visible && tip.current) {
            LbwJsUtilsH5.UtilToast(tip.current);
        }
        if (tip.current) {
            tip.current = '';
        }
    }, [visible]);

    useEffect(() => {
        setCurrentStatus('webRtcVideoInit');
        webRtcVideoInit(joinVideoConfirm, joinVideoComplete, remoteRejectvideo, videoEnd, successCallback, errorCallback);
    }, []);

    useEffect(() => {
        if (tempVideoRoomInfo && tempVideoRoomInfo.partyIdFrom) {
            setCurrentStatus('call'); // 调用本地视频
        }
    }, [tempVideoRoomInfo]);

    useEffect(() => {
        // 本地拨打｜本地接听
        if (currentStatus == 'call' || currentStatus == 'receiveVideo') {
            localVideoInit(stream => {
                localAudio.current.srcObject = stream;
                localAudio.current.play();
                if (currentStatus === 'call') { // 确保获得本地视频流后，在发送视频信息给对方
                    sendVideo(tempVideoRoomInfo, roomInfo => {
                        setVideoRoomInfo(roomInfo);
                    }, error => {
                        LbwJsUtilsH5.UtilToast(error);
                    });
                }
                // 视频接听后
                if (currentStatus === 'receiveVideo') {
                    // 设置小屏播放流
                    setLocalRtcPeeCon(videoRoomInfo, () => {
                        remoteAudio.current.srcObject = getRemoteStream();
                        remoteAudio.current.play(); // 因为携带音频（声音属于后台），在浏览器中能自动播放，在android/ios webview默认是不允许自动播发，需要用户自动点击播发
                    }, error => {
                        LbwJsUtilsH5.UtilToast(error);
                    });
                    // 发送接收成功回调
                    sendJoinVideo(videoRoomInfo, msg => {
                        setVideoRoomInfo(msg);
                    })

                    // 点击一次大屏幕，让挂断｜静音｜摄像头切换按钮消失
                    handleClickVideo();
                }
            }, error => {
                LbwJsUtilsH5.UtilToast(error);
            });
        }
        // 对方接听后
        if (currentStatus == 'facetime') {
            if (remoteAudio.current) {
                remoteAudio.current.srcObject = getRemoteStream();
                remoteAudio.current.play(); // 因为携带音频（声音属于后台），在浏览器中能自动播放，在android/ios webview默认是不允许自动播发，需要用户自动点击播发
            }
            // 点击一次大屏幕，让挂断｜静音｜摄像头切换按钮消失
            handleClickVideo();
        }
    }, [currentStatus]);

    // 接收到视频
    function joinVideoConfirm(msg) {
        setVideoRoomInfo(msg);
        setVisible(true);
        setCurrentStatus('answer');
        // 发送原生app消息，如果是原生app
        let msgData = {};
        msgData.action = 'videoSoundStart';
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msgData));
    }

    // 对方接听视频后回调
    function joinVideoComplete(roomInfo, error) {
        if (error) {
            LbwJsUtilsH5.UtilToast(error);
        }
        setVideoRoomInfo(roomInfo);
        setLocalRtcPeeCon(roomInfo, () => {
            isJoinVideo.current = true;
            setCurrentStatus('facetime');
        }, error => {
            LbwJsUtilsH5.UtilToast(error);
        });
        createOffer(roomInfo);
    }

    // 拒绝
    function rejectvideo() {
        sendRejectVideo(videoRoomInfo);
        resetVideoResource(videoRoomInfo);
    }

    // 本地接听
    function receiveVideo() {
        // 发送原生app消息，如果是原生app
        let msgData = {};
        msgData.action = 'videoSoundEnd';
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msgData));

        setCurrentStatus('receiveVideo');
    }

    // 远程拒绝视频
    function remoteRejectvideo(msg) {
        // 提示对方已拒绝
        tip.current = '对方已拒绝';
        isRemoteRejected.current = true;
        resetVideoResource(msg);
    }

    /**
     *info: 是否来自远程结束视频
     */
    function videoEnd(info) {
        setTempVideoRoomInfo({});
        if (info && !isRemoteRejected.current) {
            tip.current = '对方已挂断';
        }
        if (isRemoteRejected.current) {
            isRemoteRejected.current = false;
        }
        resetVideoResource(info ? info : videoRoomInfo);
        setTimeout(() => {
            // 视频结束后返回上个页面（本地拨打并且已接听过）
            (props.callBack && isJoinVideo.current) && props.callBack();
            // 结束视频后将是否加入置为false
            isJoinVideo.current = false;
        }, 1000);
    }

    // 重新设置video stream
    function resetVideoResource(msg) {
        // 发送原生app消息，如果是原生app
        let msgData = {};
        msgData.action = 'videoSoundEnd';
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msgData));
        if (localAudio.current.srcObject && isAndroid) {
            localAudio.current.srcObject.getTracks().forEach(t => t.stop()); // 释放本地video资源
        }
        closeStreams(msg);
        // 发送原生app消息，如果是原生app
        msgData = {};
        msgData.action = 'videoEnd';
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msgData));
        setVideoRoomInfo({});
        setCurrentStatus('');
        setVisible(false);
    }

    // socket connect 成功
    function successCallback(videoUser) {
        setCurVideoUser(videoUser);
        setCurrentStatus('');
        setVisible(false);
    }

    // socket connect 失败
    function errorCallback(error) {
        LbwJsUtilsH5.UtilToast(error);
    }

    // 拨打
    function handleCall(selectedPersons) {
        setVisible(true);
        setTempVideoRoomInfo({
            partyIdFrom: curVideoUser.partyId,
            fullNameFrom: curVideoUser.fullName,
            partyIdTo: selectedPersons.personId,
            fullNameTo: selectedPersons.personName,
            workPermitId: approvalFormId
        });
    }

    // 挂断｜取消｜拒绝
    function handlePush(flag) {
        if (flag === 'reject') {
            rejectvideo();
        } else {
            videoEnd();
        }
    }

    // 点击大屏幕
    function handleClickVideo() {
        if (cancelRef.current) {
            if (showCancelBtn) {
                setShowCancelBtn(false);
                $(cancelRef.current).fadeOut();
            } else {
                setShowCancelBtn(true);
                $(cancelRef.current).fadeIn();
                setTimeout(() => {
                    setShowCancelBtn(false);
                    $(cancelRef.current).fadeOut();
                }, 2000);
            }
        }
    }

    // 主屏｜小屏位置切换
    function handleChangeVideo() {
        setIsMainScreen(!isMainScreen);
    }

    // 静音、切换摄像头
    function handleSwitchTo(key) {
        // key: mute | camera
        if (key == 'mute') {
            setIsMute(!isMute);
            toggleAudioMute();
        } else if (key == 'changeCamera') {
            toggleCamera(localAudio.current);
        }
    }

    return (
        <div>
            <FaceTimeModal
                visible={visible}
                cancelRef={cancelRef}
                localAudio={localAudio}
                remoteAudio={remoteAudio}
                currentStatus={currentStatus}
                videoRoomInfo={videoRoomInfo}
                isMainScreen={isMainScreen}
                isMute={isMute}
                handleSwitchTo={handleSwitchTo}
                handleClickVideo={handleClickVideo}
                handleChangeVideo={handleChangeVideo}
                handlePush={handlePush}
                receiveVideo={receiveVideo}/>
        </div>
    );
})
export default FaceTimeComponent;

function FaceTimeModal(props) {
    const [isClickPlay, setIsClickPlay] = useState(!isAndroid); // 是否点击了自动播放
    // 播放事件（设置自动播放属性为true时默认执行该事件）
    function handleOnPlay(e) {
        setIsClickPlay(true);
    }
    const videoObj = {};
    if (isClickPlay) {
        videoObj.autoPlay = true;
    } else {
        videoObj.controls = true;
    }
    return (
        <Modal
            visible={props.visible}
            transparent
            className='facetime-wrapper'
            animationType='slide-up'
            popup={true}
            onClose={() => showOrHideModal(false)}>
            <>
                {
                    props.currentStatus === 'answer' ?
                        <AnswerContent handlePush={props.handlePush} handlePull={props.receiveVideo}
                            videoRoomInfo={props.videoRoomInfo}/>
                        :
                        props.currentStatus === 'call' ?
                            <CallContent handlePush={props.handlePush} videoRoomInfo={props.videoRoomInfo}/>
                            :
                            null
                }

                <video
                    className={props.isMainScreen ? 'local-video' : 'mini-video'}
                    ref={props.localAudio}
                    muted
                    autoPlay
                    playsInline />
                {/*当小窗口时&在通话接听之后的状态才能将层级提高*/}
                <video
                    className={`${props.isMainScreen ? 'mini-video' : 'local-video'} ${(props.isMainScreen && (props.currentStatus === 'facetime' || props.currentStatus === 'receiveVideo')) ? 'level-101' : 'level-0'}`}
                    ref={props.remoteAudio}
                    {...videoObj}
                    onPlay={handleOnPlay}
                    playsInline />
                {
                    (props.currentStatus === 'facetime' || props.currentStatus === 'receiveVideo') &&
                    <>
                        {/*<CommonEshIcon onClick={() => handleSwitchTo('changeCamera')} type={'icon-ehs-camera-lens screen-icon'} style={{left: 'auto', right: 20}}/>*/}
                        <div className={'local-video back'} onClick={props.handleClickVideo} />
                        {
                            isClickPlay &&
                            <div className={`mini-video back level-101`}
                                onClick={props.handleChangeVideo} />
                        }
                        <div className={'call-opt-wrapper'} ref={props.cancelRef}>
                            <CallBtn onClick={() => props.handleSwitchTo('mute')} label={'静音'} icon={<CommonEshIcon
                                type={props.isMute ? 'icon-ehs-no-voice' : 'icon-ehs-voice'}/>}
                            styles={{background: 'rgba(0, 0, 0, .4)'}}/>
                            <CallBtn onClick={() => props.handlePush('hangup')} label={'挂断'}
                                icon={<CommonEshIcon type={'icon-ehs-hang-up'}/>} background={'#FF3F48'}/>
                            <CallBtn onClick={() => props.handleSwitchTo('changeCamera')} label={'摄像头'}
                                icon={<CommonEshIcon type={'icon-ehs-camera-lens'}/>}
                                styles={{background: 'rgba(0, 0, 0, .4)'}}/>
                        </div>
                    </>
                }
            </>
        </Modal>
    );
}

function AnswerContent(props) {
    return (
        <div>
            <CommonCenter videoRoomInfo={props.videoRoomInfo}/>
            <div className={'call-opt-wrapper'}>
                <CallBtn onClick={() => props.handlePush('reject')} label={'拒绝'}
                    icon={<CommonEshIcon type={'icon-ehs-hang-up'}/>} background={'#FF3F48'}/>
                <CallBtn onClick={props.handlePull} label={'接听'} icon={<CommonEshIcon type={'icon-ehs-answer'}/>}
                    background={'#00BC56'}/>
            </div>
        </div>
    );
}

function CommonCenter(props) {
    return (
        <div className={'header-wrapper'} style={{top: '25%'}}>
            <div style={{margin: '25px 10px', textAlign: 'center'}}>
                <CommonEshIcon type={'icon-ehs-avatar-circle'} style={{fontSize: 70, color: '#fff'}}/>
            </div>
            <div className={'label'}>{props.videoRoomInfo.fullNameFrom}</div>
            <div className={'des'}>邀请你视频通话</div>
        </div>
    );
}

function CallContent(props) {
    return (
        <div>
            <CommonHeader videoRoomInfo={props.videoRoomInfo}/>
            <div className={'call-opt-wrapper'}>
                <CallBtn onClick={() => props.handlePush('cancel')} label={'取消'} icon={<CommonEshIcon type={'icon-ehs-hang-up'}/>}
                    background={'#FF3F48'}/>
            </div>
        </div>
    );
}

function CommonHeader(props) {
    return (
        <div className={'header-wrapper'}>
            <List.Item
                thumb={<CommonEshIcon type={'icon-ehs-avatar-circle'}
                    style={{color: '#fff', fontSize: 45, lineHeight: '45px'}}/>}>
                {props.videoRoomInfo.fullNameTo}
                <List.Item.Brief>
                    正在等待对方接收邀请...
                </List.Item.Brief>
            </List.Item>
        </div>
    )
}

function CallBtn({label, icon, background, onClick, styles = {}}) {
    return (
        <div className={'call-wrapper'} onClick={onClick}>
            <div className={'call-icon-box'} style={{background: background, ...styles}}>{icon}</div>
            <span className={'call-label'}>{label}</span>
        </div>
    );
}
