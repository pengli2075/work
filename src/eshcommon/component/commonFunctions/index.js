/**
 * @file:   公用方法文件
 * @author: pengli
 */
import axiosForCommon from 'component/axiosForCommon';
import {Toast} from 'antd-mobile';
import LbwJsUtilsH5 from 'component/LbwJsUtilsH5';
import LbwJsUtils from 'component/LbwJsUtils';

// 处理审批意见数据-作业审批、危险废物审批公用
export function formatSuggestionList(result) {
    let approvalWorkflowList = result.approvalWorkflowList || [];
    let noticeRelatedPersonList = [];
    for (let approval of approvalWorkflowList) {
        (function (approvalObj) {
            let approvalRoleList = approvalObj.approvalRoleList || [];
            for (let role of approvalRoleList) {
                (function (roleObj) {
                    let approvalGroupRolePersonList = role.approvalGroupRolePersonList || [];
                    for (let person of approvalGroupRolePersonList) {
                        (function (personObj) {
                            if (isNotEmpty(personObj.approvalStatus)) {
                                personObj.approvalGroupName = roleObj.approvalGroupName;
                                personObj.approvalGroupId = roleObj.approvalGroupId;
                                personObj.approvalRoleName = roleObj.approvalRoleName;
                                personObj.approvalGroupRoleId = roleObj.approvalGroupRoleId;
                                personObj.approvalStatus = person.approvalStatus;
                                personObj.approvalDate = person.approvalDate;
                                personObj.approvalSuggestion = person.approvalSuggestion;
                                personObj.signatureImg = person.signatureImg;
                                noticeRelatedPersonList.push(personObj)
                            }
                            // 委托人员审批意见显示
                            let delegatedApprovalPerson = personObj.delegatedApprovalPerson;
                            if (isNotEmpty(delegatedApprovalPerson) && isNotEmpty(delegatedApprovalPerson.approvalStatus)) {
                                let obj = {...delegatedApprovalPerson, ...{
                                    approvalGroupId: roleObj.approvalGroupId,
                                    approvalGroupName: roleObj.approvalGroupName,
                                    approvalGroupRoleId: roleObj.approvalGroupRoleId,
                                    approvalRoleName: roleObj.approvalRoleName,
                                }
                                };
                                noticeRelatedPersonList.push(obj);
                            }
                        })(person)
                    }
                })(role)
            }
        })(approval);
    }
    return noticeRelatedPersonList;
}

/**
 * 获取上传文件基本表单数据
 * @param  {[type]} param [object]
 * @return {[type]}       [description]
 */
export function getUploadFileFormData(param = {}) {
    let formData = new FormData();
    formData.append('partyContentTypeId', 'USERDEF');
    formData.append('contentTypeId', param.contentTypeId || 'MANUAL_SIGNATURE_IMG');
    formData.append('dataResourceTypeId', 'OFBIZ_FILE');
    formData.append('statusId', 'CTNT_AVAILABLE');
    formData.append('dataCategoryId', 'BUSINESS');
    formData.append('isPublic', 'N');
    formData.append('needThumbnail', 'Y');
    if (param.partyId) {
        formData.append('partyId', param.partyId);
    }
    return formData;
}

/**
 * 将base64 格式转成File文件，用于上传文件
 * @param  {[type]} dataurl  [description]
 * @param  {[type]} filename [description]
 * @return {[type]}          [description]
 */
export function dataURLtoFile(dataurl, filename = 'temp.png') {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

/**
 * 校验密码强度
 * @param value
 * @returns {number} 0｜1 弱 2中 3强
 */
export function checkStrengthPassword(value) {
    // 强度校验 弱：小于8位或纯数字或纯字母 中：数字字母，任意两种类型 强：数字字母特殊符号
    var level = 0;
    if (value.length < 8) {//最初级别
        return level;
    }
    if (/[1-9]/.test(value)) {
        level++;
    }
    if (/[a-zA-Z]/.test(value)) {
        level++;
    }
    if (/\W/.test(value)) {//如果是非数字 字母 下划线
        level++;
    }
    return level;
}

/**
 * 根据审批单标识获取审批意见
 * @param approvalFormId
 */
export const getSuggestionData = (approvalFormId, currentApprovalCount) => {
    return new Promise((resolve, reject) => {
        axiosForCommon('getApprovalWorkflowListByApprovalFormId', {
            approvalFormId: approvalFormId,
            currentApprovalCount: currentApprovalCount || 1
        }, result => {
            resolve(result || {});
        }, error => {
            reject(error || {});
        })
    })
}

/**
 * 根据审批单标识获取最新的审批流程配置
 * @param approvalFormId
 */
export const getAfApprovalPersonOfPendingInfoByApprovalFormId = (approvalFormId) => {
    return new Promise((resolve, reject) => {
        axiosForCommon('getAfApprovalPersonOfPendingInfoByApprovalFormId', {approvalFormId: approvalFormId}, result => {
            resolve(result || {});
        }, error => {
            reject(error || {});
        })
    })
}

/**
 * 根据作业证状态判断显示状态图标的颜色
 * @param approvalFormStatus
 */
export const getConstructionsColor = (approvalFormStatus) => {
    let color = '';
    switch (approvalFormStatus) {
        case 'APROV_FORM_NEW':              // 新建
            color = '#40A9FF';
            break;
        case 'APROV_FORM_APING':           // 申请中
        case 'APROV_FORM_SUBMIT':           // 提交
        case 'CAF_AND_SWP_WORKING':         // 正在作业 (施工作业)
        case 'SWPAAM_WKSTA_WORKING':        // 正在作业 (风险作业)
            color = '#3DCBE9';
            break;
        case 'APROV_FORM_APPCONF':         // 申请确认
        case 'EXTE_FILE_AWAIT_RESP':        // 待响应 (文件批示)
            color = '#FAAD14';
            break;
        case 'APROV_FORM_UNREVIE':          // 审批中
            color = '#13C2C2';
            break;
        case 'APROV_FORM_REJECT':           // 拒绝
            color = '#4D4C5B';
            break;
        case 'CAF_AND_SWP_WKABO':       // 作业废止
        case 'SWPAAM_WKSTA_WORABOL':
            color = '#FF4D4F';
            break;
        case 'CAF_AND_SWP_WKABOR':          // 作业中止(施工作业)
        case 'SWPAAM_WKSTA_WORABOR':        // 作业中止(风险作业)
            color = '#FF7976';
            break;
        case 'CAF_AND_SWP_WKEND':           // 作业结束 (施工作业)
        case 'SWPAAM_WKSTA_WORKEND':        // 作业结束(风险作业)
            color = '#25CCAB';
            break;
        case 'SWPAAM_WKSTA_WAIFPER':        // 待许可
            color = '#FFC200';
            break;
        case 'CAF_AND_SWP_COMPACC':         // 完工验收 (施工作业)
        case 'SWPAAM_WKSTA_CHECACC':        // 完工验收 (风险作业)
        case 'EXTE_FILE_AWAIT_REVI':        // 待复核 (文件批示)
        case 'APROV_FORM_APPPASS':          // 审批通过
            color = '#52C51A';
            break;
        case 'APROV_FORM_CANCEL':           // 撤销
            color =  '#818bc6';
            break;
        case 'SWPAAM_WKSTA_WORCLEA':        // 作业清理 (风险作业)
        case 'CAF_AND_SWP_WORCLEA':         // 作业清理 (施工作业)
            color = '#13C2C2';
            break;
        case 'APROV_FORM_RETURN':           // 退回
            color = '#FF7A45';
            break;
        default:
            color = '#00B6F0';
            break;
    }
    return color;
}

/**
 * 根据人员类别分类获取
 * @param persons  人员列表
 * @param category 类别
 * @returns {*}
 */
export const getPersonsByConstPersonCategory = (persons, category) => {
    let resultPersons = [];
    if (category) {
        resultPersons = persons.filter(item => item.personRole.indexOf(category) > -1)[0];
        if (resultPersons) {
            resultPersons = resultPersons.relatedPersonList;
        } else {
            resultPersons = [];
        }
    }
    return resultPersons;
}

/**
 * 按照角色分类审核意见
 * @param  {[type]} list [description]
 * @return {[type]}      [description]
 */
export function resetData(list) {
    let obj = {};
    let newData = [];
    for (let i = 0; i < list.length; i++) {
        let id = `${list[i].approvalGroupRoleId}_|_${list[i].approvalRoleName}${list[i].approvalGroupName && `(${list[i].approvalGroupName})`}`;
        if (!obj[id]) {
            let arr = [];
            arr.push(list[i]);
            obj[id] = arr;
        } else {
            obj[id].push(list[i]);
        }
    }
    if (isNotEmpty(obj)) {
        for (let key in obj) {
            let newObj = {
                label: key.split('_|_')[1],
                value: key.split('_|_')[0],
                list: obj[key]
            };
            newData.push(newObj);
        }
    }
    return newData;
}

export function commonToast(flag, result, pageThis, isWeb) {
    if (isWeb === 'Y') {
        pageThis.setState({loading: flag});
        if (result) {
            LbwJsUtils.notification(result);
        }
    } else {
        if (result) {
            LbwJsUtilsH5.UtilToast(result);
        } else if (flag) {
            LbwJsUtilsH5.UtilToast();
        } else {
            Toast.hide();
        }
    }
}

// 作业申请状态（部分）
export function getAllWorkStatus() {
    return [{
        workStatus: 'APROV_FORM_NEW',
        workStatusName: '新建'
    }, {
        workStatus: 'APROV_FORM_APING,APROV_FORM_SUBMIT',
        workStatusName: '申请中,提交'
    }, {
        workStatus: 'APROV_FORM_APPCONF',
        workStatusName: '申请确认'
    }, {
        workStatus: 'CAF_AND_SWP_PREAPP',
        workStatusName: '作业预审'
    }, {
        workStatus: 'CAF_AND_SWP_WKPREP',
        workStatusName: '作业准备'
    }, {
        workStatus: 'APROV_FORM_APPPASS,CAF_AND_SWP_WORKING,CAF_AND_SWP_WKABOR,CAF_AND_SWP_WKABO',
        workStatusName: '审批通过,正在作业,作业中止,作业废止'
    }, {
        workStatus: 'CAF_AND_SWP_WKEND',
        workStatusName: '作业结束'
    }, {
        workStatus: 'CAF_AND_SWP_ACPTAPP',
        workStatusName: '验收审批'
    }, {
        workStatus: 'CAF_AND_SWP_COMPACC',
        workStatusName: '完工验收'
    }]
}

// 热加工的作业状态流程
export function getAllWorkStatusForThrprc() {
    return [{
        workStatus: 'APROV_FORM_NEW',
        workStatusName: '新建'
    }, {
        workStatus: 'APROV_FORM_SUBMIT',
        workStatusName: '提交'
    }, {
        workStatus: 'APROV_FORM_UNREVIE,APROV_FORM_APPPASS,CAF_AND_SWP_WORKING,CAF_AND_SWP_WKABOR,CAF_AND_SWP_WKABO',
        workStatusName: '审批中,审批通过,正在作业,作业中止,作业废止'
    }, {
        workStatus: 'CAF_AND_SWP_WORCLEA',
        workStatusName: '作业清理'
    }, {
        workStatus: 'CAF_AND_SWP_WKEND',
        workStatusName: '作业结束'
    }, {
        workStatus: 'CAF_AND_SWP_ACPTAPP',
        workStatusName: '验收审批'
    }, {
        workStatus: 'CAF_AND_SWP_COMPACC',
        workStatusName: '完工验收'
    }]
}

/**
 * 根据当前状态获取下个变更状态
 * @param currentStatus
 * @param callback
 * @param isJumpForWork 作业结束时是否跳过验收审批（动火｜受限作业结束的下一个状态是验收审批）| 作业确认直接到作业准备（安全作业许可）
 * @param isThrprc 热加工
 */
export function getNextStatusForCurrentStatus(currentStatus, callback, isJumpForWork, isThrprc) {
    let allWorkStatus = isThrprc ? getAllWorkStatusForThrprc() : getAllWorkStatus();
    let currentStatusIndex = allWorkStatus.findIndex(status => status.workStatus.includes(currentStatus));
    let nextIndex = isJumpForWork ? currentStatusIndex + 2 : currentStatusIndex + 1;
    if (currentStatusIndex < allWorkStatus.length - 1) { // 截止到倒数第二个状态
        callback({
            flag: 1,
            ...allWorkStatus[nextIndex]
        });
        return;
    }
    callback({
        flag: 0
    })
}

// 获得请求的动态url拼接
export const getReqDynamicUrlSplice = () => {
    let reqDynamicUrl = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    if (!reqDynamicUrl) {
        reqDynamicUrl = '/control';
    }
    return reqDynamicUrl;
}

/**
 * 企业微信授权
 */
export function weComAuthorize() {
    return new Promise((resolve, reject) => {
        if (_APP_PLATFORM_ === 'WeCom') {
            // 链接直接进入页面
            let parameter = {};
            let code = LbwJsUtils.getUrlParam('code');
            if (code) {
                parameter.code = code;
            }
            axiosForCommon(getReqDynamicUrlSplice() + '/getWeComUserIdByCode', parameter, result => {
                if (!result.hasWeComUserId) {
                    LbwJsUtilsH5.UtilToast('正在跳转用户授权...');
                    let parameter = {
                        redirect_uri: window.location.href
                    };
                    axiosForCommon(getReqDynamicUrlSplice() + '/getWeComAuthorizeUrl', parameter, success => {
                        if (success._WECOM_AUTH_URL_) {
                            window.location.href = success._WECOM_AUTH_URL_;
                        }
                    }, error => {
                        LbwJsUtilsH5.UtilToast(error);
                        reject(JSON.stringify(error));
                    })
                } else {
                    resolve(result);
                }
            }, error => {
                LbwJsUtilsH5.UtilToast(error);
                reject(JSON.stringify(error));
            })
        } else {
            resolve();
        }
    })
}
