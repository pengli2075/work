/**
 * @file: 批量上传: 上传组件
 * @author: zhangyue
 * @param: 详见父组件 batchUploadWrapper.jsx
 */

import React from 'react';
import LbwJsUtils from 'component/LbwJsUtils';

export default class BatchUploader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fileSizeLimit: props.fileSizeLimit || 8,  // 文件大小限制
            uploader: undefined,                      // 内部使用
        };
    }

    componentDidMount() {
        this.createUploader(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (JSON.stringify(this.props.formData) !== JSON.stringify(nextProps.formData)) {
            let uploader = this.state.uploader;
            if (uploader) {
                uploader.destroy();
                this.createUploader(nextProps);
            }
        }
    }

    // 创建上传组件
    createUploader = () => {
        // 用这种方法可以保证能接到渲染途中传入的新参数
        this.setState((state, props) => {
            // 默认的传递的参数
            let uploader = WebUploader.create({
                // swf文件路径
                swf: '/labwaycommon/images/webuploader/Uploader.swf',
                // 保存按钮调用的接口
                server: props.saveServer,
                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: {
                    id: '.uploadsList',
                    multiple: true,
                },
                fileSingleSizeLimit: this.state.fileSizeLimit * 1024 * 1024,
                // 指定接受哪些类型的文件
                accept: {
                    title: '*.*',
                    extensions: '*.*',
                    mimeTypes: props.accept || '*.*',
                },
                // 设置为 true 后，不需要手动调用上传，有文件选择即开始上传
                auto: false,
                // 如果某个分片由于网络问题出错，允许自动重传多少次
                // chunkRetry: 1,
                // 文件上传方式，POST或者GET
                method: 'POST',
                // 传递参数
                formData: props.formData || {},
                // 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
                resize: false
            });
    
            // 上传之前，发送到验证接口进行验证
            uploader.on('filesQueued', (fileList) => {
                let newFiles = fileList.map(file => ({
                    name: file.name,
                    size: file.size,
                    originId: file.id,
                    fileType: file.ext
                }));
                // 过滤掉重名文件
                let newDataCollection = newFiles.filter(file => !this.props.currentList.some(curFile => curFile.name === file.name));
                // 如果过滤后仍有文件，发送验证请求
                if (newDataCollection.length) {
                    let parameters = props.formData;
                    parameters.fileList = JSON.stringify(newDataCollection);
                    props.setLoading(true);
                    // 将过滤后的列表发送给后台，再写入state中
                    $.post(props.validServer, parameters, (result) => {
                        if (isJsonResponseError(result)) {
                            LbwJsUtils.notification(result);
                            props.setLoading(false);
                        } else {
                            props.onAfterAdd(result.fileInfoList);
                            props.setLoading(false);
                        }
                    });
                }
            });
            
            uploader.on('uploadSuccess', (file, response) => {
                const {newDoneFileCount, dataList} = this.handleDataAfterUploadFile(file, response);
                props.afterUploadSuccess(newDoneFileCount, dataList);
            });
    
            uploader.on('uploadError', (file, response) => {
                const {newDoneFileCount, dataList} = this.handleDataAfterUploadFile(file, response);
                props.afterUploadSuccess(newDoneFileCount, dataList);
            });
            return {uploader};
        });
    }

    // 上传成功或失败的回调
    handleDataAfterUploadFile = (file, response) => {
        const {doneFileCount, currentList, turnToDetailPage} = this.props;
        let targetFile = currentList.find(listFile => file.name === listFile.name);
        if (targetFile) {
            targetFile.status = response._ERROR_MESSAGE_ ? 'error' : 'success';
            targetFile.uploaded = response._ERROR_MESSAGE_ ? 'N' : 'Y';
            targetFile.message = response._ERROR_MESSAGE_ || i18n.LbwcUploadSuccessfully; // 上传成功
        }
        // 如需跳转页面，全部上传后，重置上传组件
        if (turnToDetailPage !== 'N' && doneFileCount + 1 === currentList.length) {
            this.state.uploader.reset();
        }
        return {newDoneFileCount: doneFileCount + 1, dataList: currentList || []};
    }

    render() {
        return (
            <div id='uploaderButton' style={{position: 'relative'}}>
                <div className='uploadsList'>{this.props.uploadInfoMap.buttonContent || i18n.AddPhotos}</div>
                {
                    this.props.uploadBtnDisabled &&
                    <div style={{position: 'absolute', top: 0, width: 80, height: 28, background: 'rgba(0,0,0,.1)', cursor: 'not-allowed'}} />
                }
            </div>
        );
    }
}