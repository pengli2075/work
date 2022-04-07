/**
 * @file:   登录页面
 * @author: wenruizhao
 */
import React, {useEffect, useState, useRef} from 'react';
import {Button, Form, Input} from 'antd';
import {UserOutlined, LockOutlined} from '@ant-design/icons';
import './index.css';
// import LbwJsUtilsH5 from 'component/LbwJsUtilsH5';
// import LbwJsUtils from 'component/LbwJsUtils.jsx';
// import {weComAuthorize} from 'component/commonFunctions';

export default function LoginH5() {
    const [form] = Form.useForm();
    const [isDisabled, setIsDisabled] = useState(false);
    const [versionName, setVersionName] = useState('');
    const [openId, setOpenId] = useState('');
    const jumpMap = useRef({}); //
    const ipt = useRef(null);

    // useEffect(() => {
    //     // 移动端记住密码功能
    //     mobileAppCheckUser();
    //     if (_APP_PLATFORM_ == 'Yzj') {
    //         qing.call('getPersonInfo', {
    //             success: function (res) {
    //                 if (!res.success) {
    //                     LbwJsUtilsH5.UtilToast('fail', '获取当前用户信息失败')
    //                 } else {
    //                     setOpenId(res.data.openId)
    //                 }
    //             }
    //         });
    //     } else if (_APP_PLATFORM_ == 'WeCom') {
    //         weComAuthorize().then(result => {
    //             if (result.hasUserLoginBind) {
    //                 //autoLoginWeCom();
    //                 if (result._H5_AUTO_LOGIN_ && result._H5_AUTO_LOGIN_ == 'Y') {
    //                     window.location.href = window.location.href;
    //                 }
    //             }
    //         })
    //     }
    //     let interval = setInterval(() => {
    //         if (ipt.current) {
    //             ipt.current.focus();
    //             clearInterval(interval);
    //         }
    //     }, 10);
    //     return () => clearInterval(interval);
    // }, []);

    // useEffect(() => {
    //     if (_APP_PLATFORM_ == 'Yzj' && openId != '') {
    //         autoLoginYzj();
    //     }
    // }, [openId]);

    function mobileAppCheckUser() {
        // 接收app 发送的消息 versionName: baxtercn百特
        window.receiveMessage = (msg) => {
            if (msg && msg === 'baxtercn') {
                setVersionName(msg);
            }
        }
        const userInfo = window.localStorage.getItem('ehsq_user_info');
        if (isNotEmpty(userInfo)) {
            setUserInfo(userInfo)
        } else {
            // 接收rn发送的数据
            /*window.addEventListener('message', function (e) {
                //注册事件 接收数据
                const message = e.data; //字符串类型
                setUserInfo(message)
            });*/
        }
        // 兼容iOS和Android
        document.addEventListener('message', (e)=> {
            //注册事件 接收数据
            let msgData = JSON.parse(e.data); //字符串类型
            if (msgData.action == 'userInfo') {
                if (msgData.data.USERNAME) {
                    setUserInfo(JSON.stringify(msgData.data));
                }
            } else if (msgData.action === 'appLogin') {
                form.setFieldsValue(msgData);
                // 点击提交按钮
                $('.btnJump')[0].click();
            }

            /*else if (msgData.action == 'deviceInfo') {
                registeredAppPushUserService(msgData.data, ()=> {
                    setTimeout(() => {
                        setIsDisabled(false);
                        window.location.href = jumpMap.current.jumpUrl;
                    }, 500)
                })
            }*/
        });
    }

    function setUserInfo(_userInfo) {
        const _message = JSON.parse(_userInfo);
        // 向form表单填充数据
        form.setFieldsValue(_message)
    }

    // 注册app推送用户信息
    function registeredAppPushUserService(deviceInfo, action) {
        /*if (!deviceInfo.registrationId) {
            action();
            return;
        }
        let parameter = {};
        parameter.userId = jumpMap.current.userName;
        parameter.appName = 'ehsq';
        parameter.registrationId = deviceInfo.registrationId;
        parameter.platform = deviceInfo.platform;
        parameter.deviceName = deviceInfo.deviceName;
        $.post('registeredAppPushUserService', parameter, (result) => {
            if (isJsonResponseError(result)) {
                LbwJsUtilsH5.UtilToast(result);
            } else {
                action();
            }
        });*/
    }

    function postToNativeGetDeviceInfo() {
        /*let msgData = {};
        msgData.action = 'getDeviceInfo';
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msgData))
        */
    }

    const onFinish = (values) => {
        setIsDisabled(true);
        let parameter = {};
        for (let key in values) {
            if (values[key]) {
                parameter[key] = values[key];
            }
        }
        parameter.JavaScriptEnabled = 'Y';
        if (_APP_PLATFORM_ == 'Yzj') {
            parameter.ticket = LbwJsUtils.getUrlParam('ticket');
            parameter.openId = openId;
        } else if (_APP_PLATFORM_ == 'WeCom') {
            parameter.hasWeComUserId = "Y";
        }
        let tempPathname = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        if (!tempPathname) {
            tempPathname = "/control";
        }
        $.post(tempPathname + '/appH5UserBindLogin', parameter, (result) => {
            if (isJsonResponseError(result)) {
                if (_APP_PLATFORM_ == 'WeCom' && result._H5_WECOM_AUTHORIZE_ERR_) {
                    LbwJsUtilsH5.UtilToast("授权失效，正在跳转页面，请稍后重试...");
                    setTimeout(() => {
                        let curUrl = window.location.href;
                        let newUrl = curUrl;
                        var urlparts = curUrl.split('?');   
                        if (urlparts.length >= 2) {
                            var prefix = encodeURIComponent('code') + '=';
                            var pars = urlparts[1].split(/[&;]/g);
                            for (var i = pars.length; i-- > 0;) {    
                                if (pars[i].lastIndexOf(prefix, 0) !== -1) {  
                                    pars.splice(i, 1);
                                }
                            }
                            newUrl = urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
                        }
                        window.location.href = newUrl;
                    }, 2000);
                } else {
                    ipt.current.focus();
                    LbwJsUtilsH5.UtilToast(result);
                    setIsDisabled(false);
                }
            } else {
                let hrefUrl = window.location.href;
                // 向native发送通知
                if (versionName !== 'baxtercn') { // 百特app访问不保留用户名、密码
                    postToNativePage(parameter);
                }
                if (result._H5_RESPONSE_NAME_ == 'requirePasswordChange') {
                    let tempPathname = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
                    if (!tempPathname) {
                        tempPathname = "/control";
                    }
                    hrefUrl = window.location.origin + tempPathname + '/requirePasswordChangeH5?USERNAME=' + encodeURIComponent(parameter.USERNAME);
                    if (hrefUrl.indexOf('envinfo') > -1) {
                        hrefUrl += '&webapp=envinfo';
                    }
                    if (parameter.ticket) {
                        hrefUrl += '&ticket=' + parameter.ticket;
                    }
                    if (parameter.openId) {
                        hrefUrl += '&openId=' + parameter.openId;
                    }
                }
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({action: 'loginSuccess'}))

                jumpMap.current={userName: parameter.USERNAME, jumpUrl: hrefUrl};
                /*if (window.ReactNativeWebView) {
                    postToNativeGetDeviceInfo();
                } else {
                }*/
                setTimeout(() => {
                    setIsDisabled(false);
                    window.location.href = hrefUrl;
                }, 500)
            }
        });
    };

    // 给rn发送message
    function postToNativePage(params) {
        let userInfo = {USERNAME: params.USERNAME, PASSWORD: params.PASSWORD};
        const userMapStr = JSON.stringify(userInfo);
        window.localStorage.setItem('ehsq_user_info', userMapStr);
        // let msgData = {};
        // msgData.action = 'saveUserInfo';
        // msgData.data = userInfo;
        // window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msgData))
    }

    function autoLoginYzj() {
        let ticket = LbwJsUtils.getUrlParam('ticket');
        if (ticket || openId) {
            let parameter = {};
            parameter.ticket = ticket;
            parameter.openId = openId;
            let tempPathname = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
            if (!tempPathname) {
                tempPathname = "/control";
            }
            $.post(tempPathname + '/checkAppH5UserBindAutoLogin', parameter, (result) => {
                if (isJsonResponseError(result)) {
                    LbwJsUtilsH5.UtilToast(result)
                } else {
                    if (result._H5_AUTO_LOGIN_ && result._H5_AUTO_LOGIN_ == 'Y') {
                        window.location.href = window.location.href;
                    }
                }
            });
        }
    }

    function autoLoginWeCom() {
        let parameter = {};
        LbwJsUtilsH5.UtilToast('正在尝试自动登录...');
        setIsDisabled(true);
        let tempPathname = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        if (!tempPathname) {
            tempPathname = "/control";
        }
        $.post(tempPathname + '/checkAppH5UserBindAutoLogin', parameter, (result) => {
            setIsDisabled(false);
            if (isJsonResponseError(result)) {
                LbwJsUtilsH5.UtilToast(result)
            } else {
                if (result._H5_AUTO_LOGIN_ && result._H5_AUTO_LOGIN_ == 'Y') {
                    window.location.href = window.location.href;
                }
            }
        });
    }

    return (
        <div className={'login_h5'}>
            <div className={'login_headerT'}>
                <div className={'login_header'}>
                    <img src={require('@/assets/login_logo.png')}/>
                </div>
                <div className={'login_main'}>
                    <div className={'login_mainTop'}>
                        <p className={'reg_usered'}>已注册用户</p>
                        <p>您好，欢迎使用欧萨环境、健康和安全管理工具套件云服务！</p>
                    </div>
                    <div className={'login_mainBot'}>
                    <Form
                            form={form}
                            name='basic'
                            onFinish={onFinish}
                        >

                            <Form.Item
                                className={'user_name'}
                                name='USERNAME'
                                rules={[
                                    {
                                        required: true,
                                        // message: i18n.CommonLoginUserNameError,
                                    },
                                ]}
                            >
                                <Input 
                                // placeholder={i18n.CommonUsername} 
                                ref={ipt} 
                                suffix={<UserOutlined/>} 
                                className='login_ipt'/>
                            </Form.Item>
                            <Form.Item
                                name='PASSWORD'
                                rules={[
                                    {
                                        required: true,
                                        // message: i18n.CommonLoginPasswordError,
                                    },
                                ]}
                            >
                                <Input type={'password'} 
                                // placeholder={i18n.CommonPassword}
                                 suffix={<LockOutlined/>} className='login_ipt'/>
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    disabled={isDisabled}
                                    loading={isDisabled}
                                    className={'btnJump'}
                                    type='primary'
                                    htmlType='submit'
                                >
                                    登录
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>
            <div className={'login_footer'} style={{background: `url(${require('@/assets/login_bg.png')}) no-repeat`, backgroundSize: '100% 100%'}}></div>
        </div>
    );
}
