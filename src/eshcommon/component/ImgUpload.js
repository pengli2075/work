/**
 * @file:   上传图片
 * resetUploadState[arg1: loading 状态 , arg2: 是否有错误]
 */

import React from 'react';
import {PlusOutlined} from '@ant-design/icons';
import {Upload, Modal} from 'antd';
import LbwJsUtils from 'component/LbwJsUtils';
import ImgPreviewModal from './imgPreviewModal';
import {getFileUrl} from 'component/axiosForCommon';

export default class ImgUpload extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            previewVisible: false, // 是否显示预览
            fileList: [], // 文件列表
            needThumbnail: props.data.needThumbnail || 'Y', // 是否需要缩约图
            isPublic: props.data.isPublic || 'N', // 是否公开，N表示否，Y表示是
            contentTypeId: props.data.contentTypeId || undefined, // 上传内容类型，必须提供
            fileNumLimit: props.maxNumLimit || 1, // 文件最大个数
            isNotLimit: props.isNotLimit || false, // 是否限制上传个数 true不限制
            fieldName: props.fieldName, // 上传后回设的字段，如果有多个文件，则用','分割后回设，已过时，请使用onAfterAddOrDel回调方法
            fileSizeLimit: props.fileSizeLimit || 8, // 文件大小限制(M)
            action: props.action || 'createEshPartyContent_antd', // 上传的url 目前支持：createDataResourceForLabway_antd、 createEshPartyContent_antd
            listType: props.listType || 'picture-card', // 上传显示的样式
            name: props.name || 'imageData', // 发到后台的文件参数名
            onAfterAddOrDel: props.onAfterAddOrDel, // 指定添加或删除之后回调方法
            isDelConfirm: props.isDelConfirm || false, // 是否删除确认
            showPreviewIcon: props.showPreviewIcon == undefined ? true : props.showPreviewIcon, // 是否显示预览图标
            showRemoveIcon: props.showRemoveIcon == undefined ? true : props.showRemoveIcon, // 是否显示删除图标
            hideUploadBtn: props.hideUploadBtn || false, // 是否显示上传按钮
            hideUploadPlusBtn: props.hideUploadPlusBtn || false, // 是否显示按钮上文字显示
            isIE: window.ActiveXObject || 'ActiveXObject' in window, // 判断是不是Ie
            hasMultipleSupplierFactories: props.hasMultipleSupplierFactories || false //是否是多供应商
        };
    }

    componentDidMount() { // 组件初始化
        this.setFileList(this.props.defaultValue);
    }

    UNSAFE_componentWillReceiveProps(nextProps) { // 父组件参数变更时调用
        if (this.props.defaultValue != nextProps.defaultValue) {
            this.setFileList(nextProps.defaultValue);
        }
    }

    clearFileList(file) { // 清空当前
        this.setState({'fileList': []});
    }

    handleCancel = () => { // 预览取消事件
        this.setState({previewVisible: false});
    }

    handleAfterAddOrDel = (actionType, file) => { // 回调字段值设置
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
            if (file != null) {
                this.state.onAfterAddOrDel(actionType, file.contentId);
            } else {
                this.state.onAfterAddOrDel(actionType, resultStr);
            }
        }
        this.setState(fileList);
    }

    handleRemove = (file) => { // 点击移除文件时的回调
        let _this = this;
        if (this.state.isDelConfirm) {
            return new Promise(function (resolve, reject) {
                Modal.confirm({
                    title: i18n.CommonConfirmDelete,
                    onOk: function () {
                        resolve();
                        _this.handleAfterAddOrDel('del', file);
                    },
                    onCancel: function () {
                        reject();
                    }
                })
            });
        } else {
            this.handleAfterAddOrDel('del', file);
            return true;
        }
    }

    handlePreview = (file) => { // 点击文件链接时的回调
        const {fileList} = this.state;
        this.setState({
            previewVisible: true,
            photoIndex: fileList.findIndex(item => item.contentId === file.contentId)
        });
    }

    setPhotoIndex = (photoIndex) => {
        this.setState({photoIndex});
    }

    handleChange = (info) => { // 上传文件改变时的状态
        let fileList = info.fileList;
        if (this.props.isNotLimit) {
            fileList = fileList;
        } else {
            fileList = fileList.slice(0, this.state.fileNumLimit);
        }
        let isUploadSuccess = false;
        if (info.file.status == 'done') {
            fileList = fileList.map((file) => {
                if (file.uid == info.file.uid) {
                    file = info.file;
                    if (file.response) {
                        if (isJsonResponseError(file.response)) {
                            this.props.resetUploadState && this.props.resetUploadState(false, true);
                            LbwJsUtils.notification('error', file.name + ' : ' + getJasonResponseError(file.response));
                            file.status = 'error';
                        } else {
                            this.props.resetUploadState && this.props.resetUploadState(false);
                            file.contentId = file.response.contentId;
                            file.url = `${getFileUrl()}stream?contentId=${file.response.contentId}`;
                            file.thumbUrl = `${getFileUrl()}stream?contentId=${file.response.contentId}&thumbnail=Y`;
                            isUploadSuccess = true;
                        }
                    }
                }
                return file;
            });
        } else if (info.file.status == 'error') {
            this.props.resetUploadState && this.props.resetUploadState(false, true);
            LbwJsUtils.notification('error', info.file.name + ' upload error!');
        }
        // 过滤失败的
        fileList = fileList.filter((file) => {
            if (!file.status || file.status == 'error') {
                return false;
            }
            return true;
        });
        let _this = this;
        this.setState({fileList}, () => {
            if (isUploadSuccess) {
                _this.handleAfterAddOrDel('add', null);
            }
        });
    }

    beforeUpload = (file) => { // 上传文件之前的钩子
        // 如果是多供应商，先判断是否选择了供应商，未选择则提醒用户选择供应商
        let hasSupplierError = false;
        if (this.state.hasMultipleSupplierFactories) {
            this.props.form.validateFieldsAndScroll(['supplierFactory'], function (err) {
                if (!!err) {
                    LbwJsUtils.notification('error', i18n.EshCommonError_IsMandatoryField.replace('#0#', i18n.SupplierFactory));
                    hasSupplierError = true;
                    return false;
                }
            })
        }
        if (hasSupplierError) {
            return false;
        }
        // 设置loading效果 如果需要loading效果，传入resetUploadState
        this.props.resetUploadState && this.props.resetUploadState(true);
        let fileSize = file.size;
        let fileType = file.type;
        let isIE = navigator.userAgent.indexOf('MSIE') != -1;
        if (!fileSize && isIE) {
            let fileSystem = new ActiveXObject('Scripting.FileSystemObject');
            let filePath = file.name
            let fileObj = fileSystem.GetFile(file.name);
            let ext = filePath.substr(filePath.lastIndexOf('.') + 1);
            fileType = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].indexOf(ext) != -1 ? ('image/' + ext) : ext;
            fileSize = fileObj.Size;
        }
        let partyId = this.props.data.partyId || undefined;
        if (fileType.indexOf('image/') == -1) {
            this.props.resetUploadState && this.props.resetUploadState(false, true);
            LbwJsUtils.notification('error', i18n.EshSupportsImgFile);
            return false;
        }

        if (fileSize > this.state.fileSizeLimit * 1024 * 1024) {
            this.props.resetUploadState && this.props.resetUploadState(false, true);
            LbwJsUtils.notification('error', i18n.EshImageMustSmallerThan + this.state.fileSizeLimit + 'MB!');
            return false;
        }
        if (this.state.isPublic == 'N') {
            if (this.state.action == 'createEshPartyContent_antd' && partyId == undefined) {
                this.props.resetUploadState && this.props.resetUploadState(false, true);
                LbwJsUtils.notification('error', i18n.ContentUploadNoSupplierError);
                return false;
            }
            if (this.state.contentTypeId == undefined) {
                this.props.resetUploadState && this.props.resetUploadState(false, true);
                LbwJsUtils.notification('error', i18n.ContentUploadNoContentTypeError);
                return false;
            }
        }
        return true;
    }

    setFileList = (cotentIdArrayStr) => {
        if (cotentIdArrayStr && cotentIdArrayStr != '') {
            let cotentIdArray = cotentIdArrayStr.split(',');
            let fileList = [];
            let imgPreviewUrlPrefix = this.props.imgPreviewUrlPrefix ? this.props.imgPreviewUrlPrefix : '';
            for (let i = 0; i < cotentIdArray.length; i++) {
                let fileObj = {
                    uid: cotentIdArray[i],
                    contentId: cotentIdArray[i],
                    name: cotentIdArray[i] + '.png',
                    status: 'done',
                    thumbUrl: imgPreviewUrlPrefix + 'stream?contentId=' + cotentIdArray[i] + '&thumbnail=Y',
                    url: imgPreviewUrlPrefix + 'stream?contentId=' + cotentIdArray[i]
                };
                fileList.push(fileObj);
            }
            this.setState({fileList: fileList});
        } else {
            this.setState({fileList: []});
        }
    }

    handleSuccess = (...args) => {
        let fileObj = args[0]; // 返回的信息
        let file = {};
        if (typeof fileObj == 'string') { // ie9 return type is string, modern broswer return object
            fileObj = fileObj.replace('<pre>', '').replace('</pre>', '');
            fileObj = JSON.parse(fileObj);
        }
        if (isJsonResponseError(fileObj)) {
            LbwJsUtils.notification(fileObj);
            return;
        }
        file.uid = fileObj.contentId;
        file.contentId = fileObj.contentId;
        file.url = `${getFileUrl()}stream?contentId=${fileObj.contentId}`;
        file.thumbUrl = `${getFileUrl()}stream?contentId=${fileObj.contentId}&thumbnail=Y`;
        file.status = 'done';
        this.handleAfterAddOrDel('add', file)
    }

    render() {
        let userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
        let reIE = new RegExp('MSIE (\\d+\\.\\d+);');
        reIE.test(userAgent);
        let fIEVersion = parseFloat(RegExp['$1']);
        // partyId: this.props.data.partyId || undefined, // 供应商id，action为createEshPartyContent_antd时，必须指定
        const {hideUploadPlusBtn, fileNumLimit, previewVisible, fileList, hideUploadBtn, contentTypeId, needThumbnail,
            isPublic, isNotLimit, photoIndex, action, listType, isIE, name, showPreviewIcon, showRemoveIcon} = this.state;
        let partyId = this.props.data.partyId || undefined;
        let uploadButton = this.props.uploadButton || <div>
            {!hideUploadPlusBtn &&
            <PlusOutlined className='iconfont'/>
            }
            <div className='ant-upload-text'>{!hideUploadPlusBtn && i18n.EshUpload}</div>
        </div>;
        const props = {
            action: action, // 文件上传地址
            listType: listType, // 上传显示的样式
            fileList: fileList,
            multiple: (isIE && fIEVersion < 10) ? false : fileNumLimit > 1 ? true : false, // ie9不支持多选上传
            name: name, // 发到后台的文件参数名
            data: { // 发到后台的参数
                partyContentTypeId: 'USERDEF',
                contentTypeId: contentTypeId,
                dataResourceTypeId: 'OFBIZ_FILE',
                statusId: 'CTNT_AVAILABLE',
                dataCategoryId: 'BUSINESS',
                isPublic: isPublic,
                needThumbnail: needThumbnail,
                partyId: partyId,
            },
            accept: 'image/*', // suitable modern broswer
            onPreview: this.handlePreview,
            onRemove: this.handleRemove,
            showUploadList: this.props.showUploadList == undefined ? {
                showPreviewIcon: showPreviewIcon,
                showRemoveIcon: showRemoveIcon
            } : this.props.showUploadList,
            beforeUpload: (this.state.isIE && fIEVersion < 10) ? null : this.beforeUpload // ie9不支持该属性
        };

        if (this.state.isIE) {
            if (fIEVersion < 10) {
                props.data.customContentType = 'text/plain'
                props.onSuccess = this.handleSuccess;
            } else {
                props.onChange = this.handleChange;
            }
        } else {
            props.onChange = this.handleChange;
        }

        return (
            <div className='clearfix'>
                <Upload {...props}>
                    {
                        hideUploadBtn ?
                            null
                            :
                            fileList.length >= fileNumLimit && !isNotLimit ?
                                null
                                :
                                uploadButton
                    }
                </Upload>
                <ImgPreviewModal
                    images={fileList}
                    visible={previewVisible}
                    photoIndex={photoIndex}
                    setPhotoIndex={this.setPhotoIndex}
                    handleCancel={this.handleCancel}
                />
            </div>
        );
    }
}