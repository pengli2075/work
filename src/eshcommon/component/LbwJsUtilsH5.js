/**
 * 公用组件
 * @author: pengli
 */

import React from 'react';
import {InputItem, Toast} from 'antd-mobile';

/**
 * content | type & content | content & callback | type & content & callback | type & content & callback & duration
 * @param  {...[type]} args [description]
 * @return {[type]}         [description]
 */
export const UtilToast = (...args) => {
    let length = args.length;
    let type = 'info';
    let content = '加载中...';
    let result = {};
    let duration = {
        infoDuration: 1.5, // 提示时长
        successDuration: 1.5, // 成功提示时长
        failDuration: 5, // 失败提示时长
        loadingDuration: 0 // 加载时长
    }
    switch (length) {
        case 1:
            result = getTipContent(args[0], type);
            Toast[result.type](result.content, duration[`${result.type}Duration`], result.isExpire ? redirectUrl : null);
            break;
        case 2:
            if (typeof args[1] === 'function') {
                result = getTipContent(args[0], type);
                Toast[result.type](result.content, duration[`${result.type}Duration`], result.isExpire ? redirectUrl : args[1]);
            } else {
                result = getTipContent(args[1], args[0]);
                Toast[result.type](result.content, duration[`${result.type}Duration`]);
            }
            break;
        case 3:
            type = args[0];
            result = getTipContent(args[1], type);
            Toast[result.type](result.content, duration[`${result.type}Duration`], result.isExpire ? redirectUrl : args[2]);
            break;
        case 4:
            type = args[0];
            result = getTipContent(args[1], type);
            Toast[result.type](result.content, args[3], result.isExpire ? redirectUrl : args[2]);
            break;
        default:
            Toast.loading(content, 0);
            break;
    }
}

const redirectUrl = () => {
    // 企业微信session失效后跳转首页自动登录
    if (_APP_PLATFORM_ === 'WeCom') {
        location.replace('weComHome');
    }
}

const getTipContent = (...args) => {
    let type = args[1];
    let content = '加载中...';
    let isExpire = false; // 会话是否丢失
    if (typeof args[0] === 'object') {
        let isErrorMsg = args[0]._ERROR_MESSAGE_LIST_ != undefined || args[0]._ERROR_MESSAGE_ != undefined;
        type = isErrorMsg ? 'fail' : 'success';
        content = args[0]._ERROR_MESSAGE_ || args[0]._ERROR_MESSAGE_LIST_ || args[0]._EVENT_MESSAGE_;
    } else {
        // 会话丢失
        isExpire = args[0].indexOf('<!-- Begin Screen component://common/widget/CommonScreens.xml#ajaxNotLoggedIn -->') !== -1;
        if (isExpire) {
            type = 'fail';
            content = i18n.CommonSessionTimeoutPleaseLogIn;
        } else {
            content = args[0];
        }
    }
    return {type, content, isExpire};
}

// 验证保留一位小数
function validateDecimal(value) {
    if (value || value === 0) {
        let reg = /^(([1-9]{1}\d*)|(0{1}))(\.\d{1})?$/;
        value = value.toString().trim();
        return reg.test(value);
    } else {
        return false;
    }
}

// 暂无数据
export const EmptyItem = (props) => (
    <div style={{
        textAlign: 'center',
        padding: 20,
        color: '#999', ...props.customStyles
    }}>{props.tip || i18n.EshCommonNoData}</div>
)

/**
 * lookup 点击显示弹框-带图标
 */
export function LookupFindInput(props) {
    return (
        <div className={'lookup-find-box'}>
            <InputItem value={props.value} editable={false} className='em-label-input' placeholder={props.placeholder || '请选择'} onClick={() => props.onClick(true)} />
            <a className={'icon'} onClick={() => props.onClick(true)}>
                {props.icon}
            </a>
        </div>
    );
}

export const CommonDivider = ({styles = {}}) => {
    return (
        <div style={{width: '100%', height: 1, background: '#edf0f4', ...styles}} />
    );
}

const LbwJsUtilsH5 = {
    UtilToast,
    validateDecimal
};

export default LbwJsUtilsH5;
