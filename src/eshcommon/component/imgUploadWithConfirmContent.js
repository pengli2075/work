import React from 'react';
import {PlusOutlined} from '@ant-design/icons';
import {Upload, Modal} from 'antd';
import LbwJsUtils, {getBase64} from 'component/LbwJsUtils';
import LbwJsUtilsH5 from 'component/LbwJsUtilsH5';
import {Toast} from 'antd-mobile';
import ImgPreviewModal from './imgPreviewModal';
import {getFileUrl} from 'component/axiosForCommon';

export default class ImgUploadWithConfirmContent extends React.Component {
    constructor(props) {
        super(props);
        const {data = {}} = props;
        this.state = {
            previewVisible: false, // 是否显示预览
            fileList: props.fileList || [], // 文件列表
            needThumbnail: data.needThumbnail || 'Y', // 是否需要缩约图
            isPublic: data.isPublic || 'N', // 是否公开，N表示否，Y表示是
            contentTypeId: data.contentTypeId || undefined, // 上传内容类型，必须提供
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
            isNotDirectUpload: props.isNotDirectUpload || false, // 不直接上传，默认为false
        };
    }

    handleCancel() { // 预览取消事件
        this.setState({previewVisible: false});
    }

    handleAfterAddOrDel = (actionType, file) => { // 回调字段值设置
        let result = [];
        let resultStr = '';
        let fileList = this.state.fileList;
        if ('add' === actionType && file) { // 如果是添加
            fileList.push(file)
        }
        if ('del' === actionType) {
            for (let i = 0; i < fileList.length; i++) {
                if (fileList[i].uid === file.uid) {
                    fileList.splice(i, 1)
                }
            }
        }
        for (let i = 0; i < fileList.length; i++) {
            if (fileList[i].status === 'done') {
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
                if (this.state.isNotDirectUpload) {
                    this.state.onAfterAddOrDel(actionType, fileList);
                } else {
                    this.state.onAfterAddOrDel(actionType, resultStr, fileList);
                }
            }
        }
        this.props.setFileList(fileList);
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
                        this.props.setFileList(fileList);
                    },
                    onCancel: function () {
                        reject();
                    }
                })
            });
        } else {
            this.handleAfterAddOrDel('del', file);
            this.props.setFileList(fileList);
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

    handleChange = (info) => { // 上传文件改变时的状态
        let hasError = false;
        let fileList = info.fileList;
        if (!this.props.isNotLimit) {
            fileList = fileList.slice(0, this.state.fileNumLimit);
        }
        if (fileList.every(file => file.status === 'done')) {
            fileList = fileList.map((file) => {
                if (file.response) {
                    if (isJsonResponseError(file.response)) {
                        hasError = true;
                        if (this.props.isMobileBrowser) {
                            LbwJsUtilsH5.UtilToast('fail', file.name + ' : ' + getJasonResponseError(file.response));
                        } else {
                            LbwJsUtils.notification('error', file.name + ' : ' + getJasonResponseError(file.response));
                        }
                        file.status = 'error';
                    } else {
                        file.contentId = file.response.contentId;
                        let filePath = `${getFileUrl()}${this.props.filePath || 'stream'}`;
                        file.url = `${filePath}?contentId=${file.contentId}`;
                        file.thumbUrl = `${filePath}?contentId=${file.contentId}&thumbnail=Y`
                    }
                }
                return file;
            });
        } else if (info.file.status === 'error') {
            hasError = true;
            if (this.props.isMobileBrowser) {
                LbwJsUtilsH5.UtilToast('fail', info.file.name + ' upload error!');
            } else {
                LbwJsUtils.notification('error', info.file.name + ' upload error!');
            }
        } else if (info.file.size > this.state.fileSizeLimit * 1024 * 1024) {
            hasError = true;
        }
        if (this.state.isNotDirectUpload) { // 不直接上传
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
                if (!file.status || file.status == 'error') {
                    return false;
                }
                return true;
            });
        }
        // 先更新文件列表，再触发回调，把所有contentId返回给外部
        this.setState({fileList}, () => {
            if (this.state.isNotDirectUpload) { // 不直接上传
                !hasError && Toast.hide();
                this.handleAfterAddOrDel('add', null);
            } else {
                if (fileList.every(file => file.url)) {
                    !hasError && Toast.hide();
                    this.handleAfterAddOrDel('add', null);
                }
            }
        });
    }

    beforeUpload = (file) => { // 上传文件之前的钩子
        // h5状态显示为图片上传中
        if (this.props.isMobileBrowser) {
            Toast.loading('图片上传中');
        }
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
        const {data = {}} = this.props;
        let partyId = data.partyId || undefined;
        if (fileType.indexOf('image/') == -1) {
            if (this.props.isMobileBrowser) {
                LbwJsUtilsH5.UtilToast('fail', i18n.EshSupportsImgFile);
            } else {
                LbwJsUtils.notification('error', i18n.EshSupportsImgFile);
            }
            return false;
        }

        if (fileSize > this.state.fileSizeLimit * 1024 * 1024) {
            if (this.props.isMobileBrowser) {
                LbwJsUtilsH5.UtilToast('fail', i18n.EshImageMustSmallerThan + this.state.fileSizeLimit + 'MB!');
            } else {
                LbwJsUtils.notification('error', i18n.EshImageMustSmallerThan + this.state.fileSizeLimit + 'MB!');
            }
            return false;
        }
        if (this.state.isPublic == 'N') {
            if (this.state.action == 'createEshPartyContent_antd' && partyId == undefined) {
                if (this.props.isMobileBrowser) {
                    LbwJsUtilsH5.UtilToast('fail', i18n.ContentUploadNoSupplierError);
                } else {
                    LbwJsUtils.notification('error', i18n.ContentUploadNoSupplierError);
                }
                return false;
            }
            if (this.state.contentTypeId == undefined) {
                if (this.props.isMobileBrowser) {
                    LbwJsUtilsH5.UtilToast('fail', i18n.ContentUploadNoContentTypeError);
                } else {
                    LbwJsUtils.notification('error', i18n.ContentUploadNoContentTypeError);
                }
                return false;
            }
        }
        // isNotDirectUpload 默认为false，直接上传
        return !this.state.isNotDirectUpload;
    }

    handleSuccess = (...args) => {
        let fileObj = args[0]; // 返回的信息
        let file = {};
        if (typeof fileObj == 'string') { // ie9 return type is string, modern broswer return object
            fileObj = fileObj.replace('<pre>', '').replace('</pre>', '');
            fileObj = JSON.parse(fileObj);
        }
        file.uid = fileObj.contentId;
        file.contentId = fileObj.contentId;
        let filePath = `${getFileUrl()}${this.props.filePath || 'stream'}`;
        file.url = `${filePath}?contentId=${fileObj.contentId}`;
        file.status = 'done';
        file.thumbUrl = `${filePath}?contentId=${fileObj.contentId}&thumbnail=Y`;
        this.handleAfterAddOrDel('add', file);
        Toast.hide();
    }

    setPhotoIndex = (photoIndex) => {
        this.setState({photoIndex});
    }

    render() {
        // partyId: this.props.data.partyId || undefined, // 供应商id，action为createEshPartyContent_antd时，必须指定
        const {hideUploadPlusBtn, fileNumLimit, previewVisible, hideUploadBtn, contentTypeId, needThumbnail, isPublic,
            isNotLimit, photoIndex} = this.state;
        const {fileList, data = {}, viewFileList, isAllowedTakePic, isMobileBrowser} = this.props;
        let partyId = data.partyId || undefined;
        let uploadButton = this.props.uploadButton ||
            (<div>
                {!hideUploadPlusBtn &&
                <PlusOutlined className='iconfont'/>
                }
                <div className='ant-upload-text'>{!hideUploadPlusBtn && i18n.EshUpload}</div>
            </div>);
        const defaultData = { // 发到后台的参数
            partyContentTypeId: 'USERDEF',
            contentTypeId: contentTypeId,
            dataResourceTypeId: 'OFBIZ_FILE',
            statusId: 'CTNT_AVAILABLE',
            dataCategoryId: 'BUSINESS',
            isPublic: isPublic,
            needThumbnail: needThumbnail,
            partyId: partyId,
        }
        const props = {
            action: this.state.action, // 文件上传地址
            listType: this.state.listType, // 上传显示的样式
            fileList: fileList,
            multiple: fileNumLimit > 1 ? true : false,
            name: this.state.name, // 发到后台的文件参数名
            data: defaultData,
            accept: 'image/*', // suitable modern broswer
            onPreview: this.handlePreview,
            onRemove: this.handleRemove,
            showUploadList: this.props.showUploadList == undefined ? {
                showPreviewIcon: this.state.showPreviewIcon,
                showRemoveIcon: this.state.showRemoveIcon
            } : this.props.showUploadList,
            beforeUpload: this.beforeUpload
        };

        if (this.state.isIE) {
            let userAgent = navigator.userAgent; // 取得浏览器的userAgent字符串
            let reIE = new RegExp('MSIE (\\d+\\.\\d+);');
            reIE.test(userAgent);
            let fIEVersion = parseFloat(RegExp['$1']);
            if (fIEVersion < 10) {
                props.data.customContentType = 'text/plain'
                props.onSuccess = this.handleSuccess;
                props.multiple = false; // ie9不支持多选上传
            } else {
                props.onChange = this.handleChange;
            }
        } else {
            props.onChange = this.handleChange;
        }

        return (
            <div className='clearfix imgUpload_addButton'>
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
                    isMobileBrowser={isMobileBrowser}
                    images={isNotEmpty(viewFileList) ? viewFileList : fileList}
                    isAllowedTakePic={isAllowedTakePic}
                    visible={previewVisible}
                    photoIndex={photoIndex}
                    setPhotoIndex={this.setPhotoIndex}
                    handleCancel={this.handleCancel}
                    takePicCallBack={this.state.onAfterAddOrDel}
                />
            </div>
        );
    }
}
