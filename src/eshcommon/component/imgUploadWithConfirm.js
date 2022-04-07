/**
 * @file: 组件: 图片预览及上传
 * @author: zhangyue
 * @param:
 *     defaultValue: 用于显示的图片 ids: string
 *     width / height: 缩略图的宽 / 高: number (px)
 *     callback: 回调事件: function
 *     其他参数详见 ImgUploadWithConfirmContent 组件(即原 ImgUpload)
 */

import React from 'react';
import ImgUploadWithConfirmContent from './imgUploadWithConfirmContent';
import ImgsPreview from 'component/imgPreview';
import {getFileUrl} from 'component/axiosForCommon';

export default class ImgUploadWithConfirm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fileList: [],        // 图片列表
            defaultValue: props.defaultValue,
            isMobileBrowser: props.isMobileBrowser === 'true', // 是否是移动端
        };
    }

    componentDidMount() {
        if (this.state.defaultValue) {
            this.setDefaultFileList(this.state.defaultValue);
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) { // 父组件参数变更时调用
        if (this.props.defaultValue != nextProps.defaultValue) {
            this.setState({
                defaultValue: nextProps.defaultValue
            }, () => {
                this.setDefaultFileList(nextProps.defaultValue);
            })
        }
    }

    // 判断点击对象不是删除按钮时，再触发打开 / 关闭查看大图的弹框
    toggleModalVisible = (e, flag) => {
        if (!e || e.target.tagName.toLowerCase() === 'div') {
            this.setState({visible: flag});
        }
    }

    // 供子组件调用：将图片列表保存在父组件中
    setFileList = (fileList) => {
        this.setState({
            fileList,
        });
    }

    // 将默认图片 ids 转换成 list
    setDefaultFileList = (defaultValue) => {
        let cotentIdArray = defaultValue ? defaultValue.split(',') : [];
        let fileList = [];
        let imgPreviewUrlPrefix = this.props.imgPreviewUrlPrefix ? this.props.imgPreviewUrlPrefix : '';
        let filePath = `${getFileUrl()}${this.props.filePath || 'stream'}`;
        for (let i = 0; i < cotentIdArray.length; i++) {
            let contentId = cotentIdArray[i];
            let fileObj = {
                contentId: contentId,
                uid: contentId,
                name: contentId + '.png',
                status: 'done',
                url: `${imgPreviewUrlPrefix}${filePath}?contentId=${contentId}`,
                thumbUrl: `${imgPreviewUrlPrefix}${filePath}?contentId=${contentId}&thumbnail=Y`
            };
            fileList.push(fileObj);
        }
        this.setState({fileList: fileList});
    }

    // 删除一张图片
    deleteImage = (file, index) => {
        let fileList = this.state.fileList;
        fileList.splice(index, 1);
        this.setState({fileList});
        if (this.props.onAfterAddOrDel) {
            this.props.onAfterAddOrDel('del', file);
        }
    }

    render() {
        const {data, hideUploadPlusBtn, onAfterAddOrDel, maxNumLimit, hideUploadBtn, isNotLimit, isNotDirectUpload, fieldName, fileSizeLimit, action,
            listType, name, showPreviewIcon, showRemoveIcon, width, height, uploadButton, layout = 'inline', isDelConfirm, filePath, viewFileList = [],
            isAllowedTakePic, tempShowNumLimit} = this.props;
        const {fileList, defaultValue, isMobileBrowser} = this.state;
        return (
            <>
                <div className='imgUpload-confirm-wrapper'>
                    {
                        layout === 'inline' &&
                            <ImgsPreview
                                images={fileList}
                                width={width || 100}
                                height={height || 100}
                                closable={showRemoveIcon}
                                handleDelete={this.deleteImage}/>
                    }
                    {
                        (fileList.length < maxNumLimit || isNotLimit) &&
                        <ImgUploadWithConfirmContent
                            filePath={filePath}
                            isMobileBrowser={isMobileBrowser}
                            onAfterAddOrDel={onAfterAddOrDel}
                            hideUploadBtn={hideUploadBtn}
                            defaultValue={defaultValue}
                            fileList={fileList}
                            viewFileList={viewFileList}
                            setFileList={this.setFileList}
                            data={data}
                            maxNumLimit={maxNumLimit}
                            hideUploadPlusBtn={hideUploadPlusBtn}
                            isNotLimit={isNotLimit}
                            fieldName={fieldName}
                            fileSizeLimit={fileSizeLimit}
                            action={action}
                            listType={listType}
                            name={name}
                            showPreviewIcon={showPreviewIcon}
                            uploadButton={uploadButton}
                            isNotDirectUpload={isNotDirectUpload}
                            isAllowedTakePic={isAllowedTakePic}
                            // showRemoveIcon={showRemoveIcon}
                        />
                    }
                </div>
                {
                    layout !== 'inline' &&
                    <div className='esh-image-upload'>
                        <ImgsPreview
                            isMobileBrowser={isMobileBrowser}
                            data={data}
                            images={isNotEmpty(viewFileList) ? viewFileList : fileList}
                            width={width || 100}
                            height={height || 100}
                            tempShowNumLimit={tempShowNumLimit}
                            closable={showRemoveIcon}
                            isDelConfirm={isDelConfirm}
                            handleDelete={this.deleteImage}
                            isAllowedTakePic={isAllowedTakePic}
                            onAfterAddOrDel={onAfterAddOrDel}/>
                    </div>
                }
            </>
        );
    }
}
