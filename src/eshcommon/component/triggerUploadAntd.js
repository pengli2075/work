import React from 'react';
import {UploadOutlined} from '@ant-design/icons';
import {Upload, Button} from 'antd';
import LbwJsUtils, {getBase64} from 'component/LbwJsUtils.js';
import {getFileUrl} from 'component/axiosForCommon';

/**
 * 使用antd方式的上传文件
 * uploadParam:{
 *         contentTypeId : 上传内容类型，必须提供
 *         partyId : 图片所属人/公司/供应商 的Id
 *     }
 *
 */
export default class TriggerUploadAntd extends React.Component {
    state = {
        callBack: this.props.callBack, // 上传成功之后的操作
        fileList: [], // 文件列表
        isPublic: this.props.uploadParam.isPublic || 'N', // 是否公开，N表示否，Y表示是
        fileNumLimit: this.props.maxNumLimit || 1, // 文件最大个数
        multiple: this.props.maxNumLimit && this.props.maxNumLimit > 1, // 是否支持多选文件
        fileSizeLimit: this.props.fileSizeLimit || 16, // 文件大小限制(M)
        action: this.props.action || 'createEshPartyContent_antd', // 上传的url
        uploadFileName: this.props.uploadFileName || 'imageData', // 发到后台的文件参数名
        accept: this.props.accept, // 只选取该类型文件
        onAfterAddOrDel: this.props.onAfterAddOrDel, // 指定添加或删除之后回调方法
        isDelConfirm: this.props.isDelConfirm || false, // 是否删除确认
        isIE: window.ActiveXObject || 'ActiveXObject' in window, // 判断是不是Ie
        fieldName: this.props.fieldName,
        buttonText: this.props.buttonText || i18n.EshUpload, // 按钮中显示的文字
        filterSameNameFile: this.props.filterSameNameFile,  // 是否过滤同名文件
        showFileUrl: this.props.showFileUrl === undefined ? true : this.props.showFileUrl,    // 是否支持文件点击跳转
        defaultData: { // 发到后台的参数
            partyContentTypeId: 'USERDEF',
            dataResourceTypeId: 'OFBIZ_FILE',
            statusId: 'CTNT_AVAILABLE',
            dataCategoryId: 'BUSINESS',
            isPublic: this.props.uploadParam.isPublic || 'N',
            needThumbnail: 'N',
        }
    }

    componentDidMount() {
        this.setState({fileList: this.setFileList(this.props.value)})
    }

    // 接收到新的props更新后执行
    componentDidUpdate(prevProps) {
        let _value = (prevProps.value || []).map(item => item.contentId).join(',');
        let _defaultValue = (this.props.value || []).map(item => item.contentId).join(',');
        if (_value !== _defaultValue) {
            this.setState({fileList: this.setFileList(this.props.value)})
        }
    }

    setFileList(value) {
        let fileList = [];
        value = value ? value : [];
        for (let o of value) {
            let obj = {status: 'done'};
            obj.name = o.name || o.contentId;
            obj.uid = o.uid || o.contentId; // 这是 upload 组件自己的标记，一定要保证它有值
            obj.contentId = o.contentId;
            obj.key = o.contentId;
            if (o.url) { // 如果调用处传了url则加进去
                obj.url = o.url;
            }
            fileList.push(obj);
        }
        return fileList;
    }

    handleChange(info) { // 上传文件改变时的状态
        let _this = this;
        let fileList = info.fileList;
        fileList = fileList.slice(0, this.state.fileNumLimit);
        let isUploadSuccess = false;
        if (info.file.status == 'done') {
            fileList = fileList.map((file) => {
                if (file.uid == info.file.uid) {
                    file = info.file;
                    if (file.response) {
                        if (isJsonResponseError(file.response)) {
                            LbwJsUtils.notification(file.response);
                            file.status = 'error';
                        } else {
                            file.contentId = file.response.contentId;
                            if (_this.state.showFileUrl) {
                                file.url = `${getFileUrl()}stream?contentId=${file.response.contentId}`;
                            }
                            isUploadSuccess = true;
                        }
                    }
                }
                return file;
            });
        } else if (info.file.status == 'error') {
            LbwJsUtils.notification('error', info.file.name + ' upload error!');
        }
        if (this.props.isNotDirectUpload) {// 不直接上传
            // 将数据转为base64
            fileList.map(_file => {
                getBase64(_file.originFileObj).then(url => {
                    _file.url = url;
                });
                return _file;
            })
        } else {
            // 过滤失败的
            fileList = fileList.filter((file) => {
                if (file.status == 'error' || !file.status) {
                    return false;
                }
                return true;
            });
        }
        
        this.setState({fileList}, () => {
            if (this.props.isNotDirectUpload) { // 不直接上传
                this.handleAfterAddOrDel('add', null);
            } else {
                if (isUploadSuccess) {
                    this.handleAfterAddOrDel('add', null);
                }
            }
        });
    }

    handleAfterAddOrDel(actionType, file) { // 回调字段值设置
        let result = [];
        let resultStr = '';
        let fileList = this.state.fileList;
        if ('add' == actionType && file) { // 如果是添加
            fileList.push(file)
        }
        if ('del' == actionType) {
            for (let i = 0; i < fileList.length; i++) {
                if (fileList[i].uid == file.uid) {
                    fileList.splice(i, 1)
                }
            }
        }
        for (let i = 0; i < fileList.length; i++) {
            if (fileList[i].status == 'done') {
                result.push(fileList[i].contentId);
            }
        }
        if (result.length > 0) {
            resultStr = result.join(',');
        }
        // 如果传入了form
        if (this.props.form && this.state.fieldName) {
            this.props.form.setFieldsValue({
                [this.state.fieldName]: resultStr,
            });
        }
        // 如果配置了 返回的方法
        if (this.state.onAfterAddOrDel) {
            if (actionType !== 'add') {
                this.state.onAfterAddOrDel(actionType, file);
            } else {
                this.state.onAfterAddOrDel(actionType, fileList);
            }
        }
        this.setState(fileList);
    }

    handleRemove(file) { // 点击移除文件时的回调
        if (this.state.isDelConfirm) {
            return new Promise((resolve, reject) => {
                Modal.confirm({
                    title: i18n.CommonConfirmDelete,
                    onOk: () => {
                        resolve();
                        this.handleAfterAddOrDel('del', file);
                    },
                    onCancel: () => {
                        reject();
                    }
                })
            });
        } else {
            this.handleAfterAddOrDel('del', file);
            return true;
        }
    }

    handleSuccess(...args) {
        let fileObj = args[0]; // 返回的信息
        let file = {};
        if (typeof fileObj == 'string') { // ie9 return type is string, modern broswer return object
            fileObj = fileObj.replace('<pre>', '').replace('</pre>', '');
            fileObj = JSON.parse(fileObj);
        }
        file.uid = fileObj.contentId;
        file.contentId = fileObj.contentId;
        file.url = `${getFileUrl()}stream?contentId=${fileObj.contentId}`;
        file.status = 'done';
        let name = args[1].name;
        file.name = name.substring(name.lastIndexOf('\\') + 1);
        let fileList = this.state.fileList;
        fileList.push(file);
        this.setState({fileList}, () => {
            this.handleAfterAddOrDel('add', null);
        });
    }

    render() {
        const {fileList, action, uploadFileName, multiple, accept, isIE, fileNumLimit, buttonText, defaultData, fileSizeLimit} = this.state;
        let userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
        let reIE = new RegExp('MSIE (\\d+\\.\\d+);');
        reIE.test(userAgent);
        let fIEVersion = parseFloat(RegExp['$1']);
        let props = {
            fileList: fileList,
            action: action,
            onPreview: this.handlePreview,
            onRemove: this.handleRemove.bind(this),
            name: uploadFileName,
            beforeUpload: (isIE && fIEVersion < 10) ? null : (file, _fileList) => {
                // 上传之前限制上传文件大小
                let fileSize = file.size;
                if (fileSize > fileSizeLimit * 1024 * 1024) {
                    LbwJsUtils.notification('error', i18n.EshFileMustSmallerThan + fileSizeLimit + 'MB!');
                    return false;
                }
                this.props.beforeUpload && this.props.beforeUpload(file, _fileList);
                return !this.props.isNotDirectUpload;
            },
            multiple: (isIE && fIEVersion < 10) ? false : multiple, // 是否可多选文件同时上传 ie9不支持
            showUploadList: this.props.showUploadList === undefined || this.props.showUploadList, // 是否要显示上传文件列表
            data: defaultData,
            customRequest: this.props.customRequest ? () => {        // 自定义上传流程
                this.props.customRequest(defaultData)
            } : null,
        };
        if (accept) {
            props.accept = accept;
        }

        if (isIE) {
            if (fIEVersion < 10) {
                props.data.customContentType = 'text/plain';
                props.onSuccess = this.handleSuccess.bind(this);
            } else {
                props.onChange = this.handleChange.bind(this);
            }
        } else {
            props.onChange = this.handleChange.bind(this);
        }
        Object.assign(props.data, this.props.uploadParam); // 合并上传的数据
        return (
            <Upload {...props}>
                {
                    fileList.length < fileNumLimit &&
                    <div>
                        {
                            this.props.uploadButton ||
                            <Button><UploadOutlined className='iconfont'/>{buttonText}</Button>
                        }
                        {
                            this.props.showFileTip &&
                            this.props.showFileTip
                        }
                    </div>
                }
            </Upload>
        );
    }
}
