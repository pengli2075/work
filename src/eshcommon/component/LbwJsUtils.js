import React, {useCallback} from 'react';
import {Icon as LegacyIcon} from '@ant-design/compatible';
import {notification, Table} from 'antd';
import moment from 'moment';
import axiosForCommon from 'component/axiosForCommon';

/**
 * content | type content | content callback duration[option] | type content callback duration[option]
 * content：提示内容 （string|object）
 * type: 提示类型
 * callback： 回调
 * *注：如果之传入一个参数则直接打印， 格式默认为Info，如果是service返回就自动判断
 * @Autor:Qiang.Chao
 */
const notificationTips = (...args) => {
    let type;    // 提示类型 info|success|error|warn
    let obj;        // 提示信息
    let iMduration = 1.5; // 默认显示时间为1.5秒;
    let eMduration = 10; // 错误默认显示时间为10秒;
    let callBack = null;
    let onClose = null; // 关闭的回调
    let onClick = null; // 信息框点击的回调
    let windowHeight = document.body.clientHeight || document.documentElement.clientHeight;
    switch (args.length) {
        case 1:
            // 如果只传入一个参数表示， 直接打印
            obj = args[0];
            break;
        case 2:
            // 传入两个参数，第一个是type|content,第二个是content|callback
            if (isNotificationType(args[0])) {
                type = args[0];
                obj = args[1];
            } else {
                obj = args[0];
                callBack = args[1];
                if (typeof (callBack) == 'object') {
                    onClose = callBack.onClose;
                    onClick = callBack.onClick;
                } else {
                    onClose = callBack;
                }
            }
            break;
        case 3:
            // 传入三个参数，第一个是type|content,第二个是content|callback,第三个是callback|duration
            if (isNotificationType(args[0])) {
                type = args[0];
                obj = args[1];
                callBack = args[2];
                if (typeof (callBack) == 'object') {
                    onClose = callBack.onClose;
                    onClick = callBack.onClick;
                } else {
                    onClose = callBack;
                }
            } else {
                obj = args[0];
                callBack = args[1];
                iMduration = args[2] || iMduration;
                eMduration = args[2] || eMduration;
                if (typeof (callBack) == 'object') {
                    onClose = callBack.onClose;
                    onClick = callBack.onClick;
                } else {
                    onClose = callBack;
                }
            }
            break;
        case 4:
            // type|content|callback|duration
            type = args[0];
            obj = args[1];
            callBack = args[2];
            iMduration = args[3] || iMduration;
            eMduration = args[3] || eMduration;
            if (typeof (callBack) == 'object') {
                onClose = callBack.onClose;
                onClick = callBack.onClick;
            } else {
                onClose = callBack;
            }
            break;
        default :
            console.error('Please Check your paramters !');
            return;
    }
    if (!obj) { // 如果没有打印对象， 直接返回
        return;
    }
    let messageStr;
    switch (getObjectType(obj)) {
        case 'string':
            // 会话丢失
            if (obj.indexOf('<!-- Begin Screen component://common/widget/CommonScreens.xml#ajaxNotLoggedIn -->') != -1) {
                type = 'error';
                messageStr = i18n.CommonSessionTimeoutPleaseLogIn;
            } else {
                messageStr = obj;
            }
            break;
        case 'object':
            // 判断传递的类型
            let isErrorMsg = obj._ERROR_MESSAGE_LIST_ != undefined || obj._ERROR_MESSAGE_ != undefined;
            type = type ? type : isErrorMsg ? 'error' : 'success';
            messageStr = obj._ERROR_MESSAGE_ || obj._EVENT_MESSAGE_ || obj._ERROR_MESSAGE_LIST_ || obj._EVENT_MESSAGE_LIST_;
            if (getObjectType(messageStr) == 'array') { // 如果是数组
                messageStr = formatArrayMsgToTable(messageStr)
            }
            break;
    }
    if (!messageStr) { // 如果打印内容为空
        return;
    }
    if (!type) { // 默认使用Info打印格式
        type = 'info';
    }
    // 清除以前的提示
    notification.destroy();
    let tips = ''; // 信息
    let duration = iMduration;
    let iconType = ''; // icon 类型
    let color;
    switch (type) {
        case 'error':
            tips = i18n.EshCommonErrorInformationPrompt;
            duration = eMduration;
            iconType = 'close-circle';
            color = '#f5222d';
            break;
        case 'warning':
            tips = i18n.EshCommonWarningInformationPrompt;
            color = '#faad14';
            iconType = 'info-circle';
            break;
        case 'info':
            tips = i18n.EshCommonInformationPrompt;
            color = '#1890ff';
            iconType = 'info-circle';
            break;
        case 'success':
            tips = i18n.EshCommonSuccessInformationPrompt;
            color = '#52c41a';
            iconType = 'check-circle';
            break;
    }
    notification[type]({
        message: <div style={{fontWeight: 'bold'}}>{tips}</div>,
        description: <div style={{maxHeight: windowHeight}}>{messageStr}</div>,
        duration: duration,
        icon: <LegacyIcon className='iconfont' type={iconType} style={{fontSize: 32, color: color}}/>,
        onClose: callBack,
        onClick: onClick
    });
};

/**
 * 格式化错误消息
 * 1：如果是数组为String 类型的（以数组的第一个数据类型判断, 目前只支持：string, object 2个类型）
 */
const formatArrayMsgToTable = (dataArray) => {
    if (dataArray.length == 0) {
        return '';
    }
    let firstOfData = dataArray[0];
    let columns = [];
    if (getObjectType(firstOfData) == 'string') {
        // initial parameters
        let dataSource = [];
        columns = [{title: '', dataIndex: 'msg', key: 'msg'}];
        let i = 0;
        for (let o of dataArray) {
            let obj = {};
            obj.msg = o;
            obj.key = i;
            i++;
            dataSource.push(obj);
        }
        return <Table columns={columns} dataSource={dataSource} pagination={false}/>
    }
}

/**
 * 页面离开事件
 * @Autor:Qiang.Chao
 */
const isDataChangedBeforePageUnload = (callback) => {
    window.noBunloadPromptFlag = false;
    if (callback && 'function' == getObjectType(callback)) {
        window.onbeforeunload = function () {
            if (!callback()) {
                if (!window.noBunloadPromptFlag) {
                    var msg = '数据已经改变，如果您离开此页面，改变的数据可能不会被保存。';
                    if (locale && locale == 'en') {
                        msg = 'The data has changed, and if you leave this page, the changed data may not be saved.';
                    }
                    return msg;
                }
            }
            window.noBunloadPromptFlag = false;
        }
    }
};

/**
 * 判断是否为空子串、 数组、对象、undefined 返回true
 * @autor qiang.chao
 * @param {any} obj
 */
const isNullOrEmpty = (obj) => {
    if (getObjectType(obj) == 'array' && obj.length == 0) {
        return true;
    }
    if (getObjectType(obj) == 'object' && JSON.stringify(obj) == '{}') {
        return true;
    }
    if (getObjectType(obj) == 'number') {
        return false
    }
    if (!obj) {
        return true;
    }
    return false;
}

/**
 * 判断对象是否相等(不包含对象中含有function)
 */
const judgeEqualsByTwoData = (x, y) => {
    if (!x && !y) {
        return true;
    }
    if ((x == undefined) !== (y == undefined)) return false;
    if ((x === null) !== (y === null)) return false;
    if ((x && x.constructor.toString()) != (y && y.constructor.toString())) {
        return false;
    }
    if (getObjectType(x) != 'object' && getObjectType(x) != 'array') { // if given parameters is not object or array direct to judge equals
        if (x != y) {
            return false;
        }
    }
    if (getObjectType(x) == 'object') {
        for (let key in x) { // 对象比较
            if (judgeEqualsByTwoData(x[key], y[key])) { // 如果相等就跳过
                continue;
            }
            return false;
        }
    }
    if (getObjectType(x) == 'array') {
        if (x.length != y.length) {
            return false;
        }
        for (let i in x) {
            if (judgeEqualsByTwoData(x[i], y[i])) {
                continue;
            }
            return false;
        }
    }

    return true;
}

/**
 * 深拷贝Array
 * @Autor:Qiang.Chao
 */
const deepCopyArray = (sourceArray) => {
    let target = [];
    for (let i = 0; i < sourceArray.length; i++) {
        if (getObjectType(sourceArray[i]) == 'array') {
            target.push(deepCopyArray(sourceArray[i]))
        } else if (getObjectType(sourceArray[i]) == 'object') {
            target.push(deepCopyObject(sourceArray[i]));
        } else {
            target.push(sourceArray[i]);
        }
    }
    return target;
}

/**
 * 深度拷贝Object
 * @parameter : 拷贝的对象是一个
 * @Autor:Qiang.Chao
 */
const deepCopyObject = function (sourceObj) {
    let obj = {};
    for (let key in sourceObj) {
        if (getObjectType(sourceObj[key]) == 'object') {
            obj[key] = sourceObj[key] ? deepCopyObject(sourceObj[key]) : null;
        } else if (getObjectType(sourceObj[key]) == 'array') {
            obj[key] = deepCopyArray(sourceObj[key]);
        } else {
            obj[key] = sourceObj[key];
        }
    }
    return obj
}

/**
 * 深度拷贝（无论是object Or array）
 */
const deepCopy = (objOrArray) => {
    if (getObjectType(objOrArray) == 'array') {
        return deepCopyArray(objOrArray);
    } else {
        return deepCopyObject(objOrArray);
    }
}

/**
 * 判断对象是什么类型
 * @Autor:Qiang.Chao
 * @parameter source : 传入的对象
 */
const getObjectType = function (source) {
    if (typeof source == 'object' && Array.isArray(source)) {
        return 'array'
    }
    return typeof (source)
}

/**
 * 查询时，添加的条件
 */
const addCondition = (...args) => {
    let obj = {};
    for (let i = 0; i < args.length / 3; i++) {
        obj[args[i * 3] + '_fld0_op'] = args[i * 3 + 1];
        obj[args[i * 3] + '_fld0_value'] = args[i * 3 + 2];
    }
    return obj;
}

/**
 * 比较页面JSON数据
 * @Autor: wu.chenyun
 * @param {any} newJsonData：最新的JSON数据
 * @param {any} initJsonData：初始的JSON数据
 */
const comparePageJsonDataTo = (newJsonData, initJsonData) => {
    if (newJsonData == undefined || newJsonData == null || !(newJsonData.constructor == String)) { // not a valid parameter
        return false;
    }
    if (initJsonData == undefined || initJsonData == null || !(initJsonData.constructor == String)) { // not a valid parameter
        return false;
    }
    if (newJsonData.length != initJsonData.length) { // note: there're some row which was created and then deleted. although the actual data is not modified, but this function will still return false
        return false;
    }
    return compareTwoObjects(newJsonData, initJsonData);
}

/**
 * 获取cookie数据
 * @param name cookie匹配的key值
 */
const getCookie = (name) => {
    var arr, reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
    if (arr = document.cookie.match(reg)) {
        return unescape(arr[2]);
    } else {
        return null;
    }
}

/**
 * 设置cookie
 * @param name
 * @param value
 * @param exdays 过期时间：时间戳
 */
const setCookie = (name, value, time) => {
    let expires = '';
    if (time) {
        var d = new Date();
        d.setTime(time);
        expires = 'expires=' + d.toUTCString();
    }
    document.cookie = name + '=' + escape(value) + ';' + expires;
}

/**
 * 删除cookie
 * @param name
 */
const deleteCookie = (name) => {
    var date = new Date();
    date.setTime(date.getTime() - 1);
    var delValue = getCookie(name);
    if (!!delValue) {
        document.cookie = name + '=' + delValue + ';expires=' + date.toGMTString();
    }
}

/**
 * 格式化坐标轴文字换行显示
 * @param params
 * @param provideNumber 每行显示个数
 * @param maxRowNumber  最多显示几行
 * @returns {string}
 */
const formartterEchartsLabel = (params, provideNumber, maxRowNumber) => {
    provideNumber = provideNumber || 6;
    maxRowNumber = maxRowNumber || 2;
    let newParamsName = '';
    let paramsLength = params.length;
    let rowNumber = Math.ceil(paramsLength / provideNumber);// 换行的话，需要显示几行，向上取整
    // 判断标签的个数是否大于规定的个数， 如果大于，则进行换行处理 如果不大于，即等于或小于，就返回原标签
    if (paramsLength > provideNumber) {
        for (let p = 0; p < rowNumber; p++) {
            if (p >= maxRowNumber) {
                newParamsName = newParamsName.substring(0, newParamsName.length - 2) + '...';
                break;
            }
            let tempStr = '';
            let start = p * provideNumber;      // 开始截取的位置
            let end = start + provideNumber;    // 结束截取的位置
            tempStr = (p == rowNumber - 1) ? params.substring(start, paramsLength) : (params.substring(start, end) + '\n');
            newParamsName += tempStr;           // 最终拼成的字符串
        }
    } else {
        newParamsName = params;
    }
    return newParamsName;
}

/**
 * 如果是IE10或低于IE10版本的浏览器,直接返回版本号：10、9、8、7、6等等 * 如果是高级版本IE或者是chrome、firefox等，则返回0
 * navigator.appName 返回值 String-浏览器名称
 *                   1. IE11, Firefox, Chrome and Safari returns "Netscape"
 *                   2. IE 10 and earlier versions return "Microsoft Internet Explorer"
 *                   3. Opera returns "Opera"
 */
const ieVersion = () => {
    if (navigator.appName === 'Microsoft Internet Explorer') {
        let b_version = navigator.appVersion;
        let version = b_version.split(';');
        let trim_Version = version[1].replace(/[ ]/g, '').replace('MSIE', '');
        return Number(trim_Version);
    } else {
        return 0;
    }
};

/**
 * 如果是 ie9, 手动为文本域组件添加字数限制
 * @param e           onchange 事件的返回值
 * @param fieldName   表单域
 * @param limit       最大字数
 * @param component   组件的 this
 */

const handleLimitTextArea = (e, fieldName, limit, component) => {
    if (!navigator.userAgent.includes('MSIE 9.0')) {
        return;
    }
    const value = e.target.value || '';
    if (value.length > limit) {
        component.setState(() => {
            component.props.form.setFieldsValue({[fieldName]: value.slice(0, limit)});
        });
    }
};

/**
 * 一个未被选中的复选框按钮组件（空方块）
 * @param propsStyle
 */
export function UncheckedCheckboxIcon({propsStyle}) {
    let style = {
        display: 'inline-block',
        width: 16,
        height: 16,
        verticalAlign: 'middle',
        border: '1px solid #d9d9d9',
        borderRadius: 2
    };
    style = propsStyle ? Object.assign(style, propsStyle) : style;
    return <div style={style} />;
}

/**
 * 一个中间态的复选框按钮组件（空方块中有一个实心小方块）
 * @param propsStyle
 */
export function IndeterminateCheckboxIcon({propsStyle, innerPropsStyle}) {
    let style = {
        display: 'inline-block',
        padding: 3,
        width: 16,
        height: 16,
        verticalAlign: 'middle',
        border: '1px solid #d9d9d9',
        borderRadius: 2,
    };
    style = propsStyle ? Object.assign(style, propsStyle) : style;
    let innerStyle = {
        width: 8,
        height: 8,
        background: '#d9d9d9'
    };
    innerStyle = innerPropsStyle ? Object.assign(innerStyle, innerPropsStyle) : innerStyle;
    return <div style={style}>
        <div style={innerStyle} />
    </div>;
}

/**
 * 一个被选中的复选框按钮组件（灰色背景的勾）
 */
export function CheckedCheckboxIcon() {
    return <i className='esh-common icon-ehs-checked-square'
        style={{color: '#ccc', fontSize: 16, verticalAlign: 'middle'}} />;
}

/**
 * 一个未被选中的单选框按钮组件（空圆圈）
 */
export function UncheckedRadioIcon() {
    return <div style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        verticalAlign: 'middle',
        border: '1px solid #d9d9d9',
        borderRadius: '50%'
    }} />;
}

/**
 * 一个被选中的单选框按钮组件（灰色背景的圆）
 */
export function CheckedRadioIcon() {
    return <i className='esh-common icon-ehs-checked-radio'
        style={{color: '#ccc', fontSize: 16, verticalAlign: 'middle'}} />;
}


/**
 * 定义一个有红色的*的列标题组件
 * @param title
 * @returns {*}
 * @constructor
 */
export function Star({title, styles = {}}) {
    return <span style={{...styles}}><span style={{
        display: 'inline-block',
        marginRight: 2,
        color: '#f5222d',
        fontFamily: 'SimSun',
        verticalAlign: 'top'
    }}>*</span>{title}</span>;
}

/**
 * 将保存在history中的查找条件取出，并清掉记录
 * @param title
 * @returns {inputFields, scrollTop, viewIndex, viewSize}
 * @constructor
 */
const handleCacheFindConditions = () => {
    // 载入页面时，判断是否 history 里有查找条件: 如果页面存有 history，说明刚刚点击过详情页面
    // 如果为真，将其中的信息写入 state 中，并清掉 history.state
    // 如果为假，直接清掉 history.state
    let state = window.history.state;
    if (!state) {
        return {};
    }
    // 清掉 history, 并返回取出的查找条件
    if (window.history.replaceState) {
        window.history.replaceState(null, 'findConditions');
    }
    return state.findConditions || {};
};

const isNotificationType = (type) => {
    return type == 'error' || type == 'info' || type == 'warning' || type == 'success' || type == 'warn';
}

// 上传按钮(带文字提示)
export const UploadButton = (props) => {
    return (
        <div style={{background: '#fff', cursor: 'pointer', position: 'relative'}} className={props.className || ''}>
            <img src='/eshImages/upload-btn-bg.png' style={{width: 102, height: 102}}/>
            <div style={{position: 'absolute', top: 52, left: 0, textAlign: 'center', width: '100%', ...(props.contentStyle || {})}}>
                {props.tipContent || i18n.EshUpload}
            </div>
        </div>
    );
};

// 上传按钮(图片带提示)
export const UploadButtonWithTips = (props) => {
    return (
        <div style={{background: '#fff', cursor: 'pointer'}}>
            <img src={props.src || '/eshImages/uploadTips.png'} style={{width: 102, height: 102}}/>
        </div>
    );
};

/**
 * 获取当前时间间隔前的整分时间
 * @param  minuteStep    时间间隔
 * @param  endDate       计算间隔的参考时间
 * @param  type          add 大于当前时间
 * 如果包含时间间隔，并且传入了最小时间，则根据最小时间计算整点分的最小时间，重新赋值，如果传入的最小时间刚好是整点分，则不再重新计算
 * 如果包含时间间隔，并且传入了最大时间，则根据最大时间计算整点分的最大时间，重新赋值，如果传入的最大时间刚好是整点分，则不再重新计算
 */

export const getTimeByMinuteStep = (minuteStep, minDate, maxDate) => {
    let start = null;
    let end = null;
    let startTime = null;
    let endTime = null;
    if (minDate) {
        start = moment(minDate);
        // 判断传入的最小时间是否是时间间隔的整数倍
        const minute = moment(minDate).format('mm');
        if (Number(minute) % minuteStep) {
            let remainder = start.minute() % minuteStep;
            remainder = minuteStep - remainder;
            startTime = moment(start).add(remainder, 'minutes').format('YYYY/MM/DD HH:mm');
        } else {
            startTime = moment(start).format('YYYY/MM/DD HH:mm');
        }
    }
    if (maxDate) {
        end = moment(maxDate);
        const minute = moment(maxDate).format('mm');
        if (Number(minute) % minuteStep) {
            const remainder = end.minute() % minuteStep;
            endTime = moment(end).subtract(remainder, 'minutes').format('YYYY/MM/DD HH:mm');
        } else {
            endTime = moment(end).format('YYYY/MM/DD HH:mm');
        }
    }
    return {
        startTime: new Date(startTime),
        endTime: new Date(endTime)
    };
}

/*
* 获取文件的base64
 */
export const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/**
 * 获取url中的参数
 * @param name
 * @returns {*}
 */
export function getUrlParam(name) {
    let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)'); //构造一个含有目标参数的正则表达式对象
    let r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r != null) return unescape(r[2]);
    return null; //返回参数值
}

export const usePostLocalesData = () => {
    return [
        {
            lang: 'zh_CN',
            label: '简体中文',
            icon: '🇨🇳',
            title: '语言'
        },
        {
            lang: 'en_US',
            label: 'English',
            icon: '🇺🇸',
            title: 'Language'
        },
        {
            lang: 'zh_TW',
            label: '繁體中文',
            icon: '🇭🇰',
            title: '語言'
        }
    ]
}

/**
 * 判断传入对象是否为空
 * @param obj 
 * @returns 
 */
export function isEmpty(obj){
    if(typeof obj == "undefined" || obj == null || obj == "") {
        return true;
    } else {
        return false;
    }
}

// 判断是否移动端
export function isMobile(){
    if(window.navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
        return true; // 移动端
    } else {
        return false; // PC端
    }
}


const LbwJsUtils = {
    notification: notificationTips,
    isDataChangedBeforePageUnload: isDataChangedBeforePageUnload,
    deepCopy: deepCopy,
    getObjectType: getObjectType,
    judgeEqualsByTwoData: judgeEqualsByTwoData,
    addCondition: addCondition,
    comparePageJsonDataTo: comparePageJsonDataTo,
    isNullOrEmpty: isNullOrEmpty,
    getCookie: getCookie,
    setCookie: setCookie,
    deleteCookie: deleteCookie,
    formartterEchartsLabel: formartterEchartsLabel,
    ieVersion: ieVersion,
    handleCacheFindConditions: handleCacheFindConditions,
    getTimeByMinuteStep: getTimeByMinuteStep,
    getBase64: getBase64,
    getUrlParam: getUrlParam,
    isMobile: isMobile
};

export default LbwJsUtils;
