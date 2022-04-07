/*
* @file: 公用数据请求组件
* @author: wang.ru
* @param: url             请求地址
* @param: paramters       请求所需参数
* @param: successCallback 成功的回调
* @param: errorCallback   失败的回调
* 使用方式
引入
import axiosForCommon from 'component/axiosForCommon';
axiosForCommon('传入url', 参数, result => {
    console.log('成功回调')
}, error => {
    console.log('失败回调')
})
*/

import axios from 'axios';
import qs from 'qs';

export default function axiosForCommon(url, paramters, successCallback, errorCallback) {
    const postParameters = qs.stringify(paramters);
    const webappName = paramters.webappName;
    delete paramters.webappName;
    axios.post(getServerUrl(url, webappName).replace(global.routerBase, '/'), postParameters, {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'credentials': 'include'
    }).then(result => {
        if (isJsonResponseError(result.data)) {
            const data = result.data;
            errorCallback && errorCallback(result.data);
            if (data.LOGIN_REDIRECT === 'sessionTimeoutLogIn') {
                // 跳转至登录页面
                window.location.replace('/login');
            }
            return;
        }
        successCallback && successCallback(result.data);
    }).catch(error => {
        errorCallback && errorCallback(error);
    })
}

// 参数为form data类型数据
export function axiosFormDataForCommon(url, paramters, successCallback, errorCallback) {
    const webappName = paramters.webappName;
    const bodyFormData = paramters.bodyFormData;
    axios({
        method: 'post',
        url: getServerUrl(url, webappName).replace(global.routerBase, '/'),
        data: bodyFormData,
        headers: {'Content-Type': 'multipart/form-data'},
    }).then((result) => {
        if (isJsonResponseError(result.data)) {
            const data = result.data;
            errorCallback && errorCallback(result.data);
            if (data.LOGIN_REDIRECT === 'sessionTimeoutLogIn') {
                // 跳转至登录页面
                window.location.replace('/login');
            }
            return;
        }
        successCallback && successCallback(result.data);
    }).catch((error) => {
        errorCallback && errorCallback(error);
    });
}


// 开发模式增加支持跨域的前缀
function getServerUrl(url, webappName) {
    const _url = `${webappName ? '/' + webappName : ''}/control/${url}`;
    if (process.env.NODE_ENV === 'development') {
        return `/dev${_url}`
    }
    return _url
}

// 文件访问链接，支持开发｜生产
export function getFileUrl(url = '') {
    return `${process.env.NODE_ENV === 'development' ? '/dev' : ''}/control/${url}`;
}

/* 导出excel、word、pdf
* @param: url         导出的url
* @param: paramters  需要传给后端的参数
* @param: fileName   文件名称 [可选]
* @param: type       文件类型 【excel、word、pdf】大小写均可
* @param: successCallback 成功的回调
* @param: errorCallback   失败的回调
* 使用方式
* axiosForExportFile(url, parametes, filename, type, success => {
*     console.log('成功回调')
* }, error => {
*     console.log('失败回调')
* })
*/
export function axiosForExportFile(url, paramters, successCallback, errorCallback) {
    const postParameters = qs.stringify(paramters);
    axios.post(getServerUrl(url, paramters.webappName), postParameters, {
        'responseType': 'blob'
    }).then(result => {
        const data = result.data;
        const headers = result.headers;
        if (data.type === 'application/json') {
            let reader = new FileReader();
            reader.onload = function (event) {
                const content = reader.result;
                const message = JSON.parse(content) // 错误信息
                errorCallback && errorCallback(message);
                return;
            }
            reader.readAsText(data);
        } else {
            // 处理filename
            const contentDis = headers['content-disposition'];
            const contentDisArray = contentDis.split(';');
            let _fileName = '';
            if (contentDisArray.length > 1) {
                const filenameStr = contentDisArray[1].replace(/"/g, "");
                _fileName = decodeURI(filenameStr.split('filename=')[1]);
            }
            const blob = new Blob([data], {type: data.type});
            // bolb对象转为一个DOMString的url
            const downloadUrl = URL.createObjectURL(blob);
            // 对ie兼容
            if (window.navigator.msSaveBlob) {
                try {
                    window.navigator.msSaveBlob(blob, _fileName);
                    successCallback && successCallback(result.data);
                } catch (e) {
                    errorCallback && errorCallback(e);
                }
            } else {
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = downloadUrl;
                a.download = `${_fileName}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                successCallback && successCallback(result.data);
            }
        }
    }).catch(error => {
        errorCallback && errorCallback(error);
    })
}