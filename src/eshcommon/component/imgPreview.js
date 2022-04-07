/**
 * @file: 图片预览-支持多张
 * @author: pengli
 */

import React from 'react';
import {CloseCircleFilled} from '@ant-design/icons';
import {Popconfirm} from 'antd';
import CommonEshIcon from 'component/commonEshIcon';
import ImgUploadWithConfirm from './imgUploadWithConfirm';
import ImgPreviewModal from './imgPreviewModal';

export default class ImgPreview extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
        };
    }

    // 判断点击对象不是删除按钮时，再触发打开 / 关闭查看大图的弹框
    handlePreview = (e, file) => { // 点击文件链接时的回调
        const {images} = this.props;
        if (!e || e.target.tagName.toLowerCase() === 'div') {
            this.setState({
                visible: true,
                photoIndex: images.findIndex(item => item.contentId === file.contentId)
            });
        }
    }

    setPhotoIndex = (photoIndex) => {
        this.setState({photoIndex});
    }

    handleCancel = () => { // 预览取消事件
        this.setState({visible: false});
    }

    takePicCallBack = (type, content) => {
        this.handleCancel();
        this.props.onAfterAddOrDel(type, content)
    }

    render() {
        const {imgId, handleDelete, closable, width, height, isDelConfirm = true, images, isAllowedTakePic, isMobileBrowser, tempShowNumLimit, data} = this.props;
        const {visible, photoIndex} = this.state;
        let showRemoveIcon = closable == undefined ? true : closable;
        // 页面上要显示的图片个数（弹框会显示所有的）
        let _tempShowNumLimit = tempShowNumLimit || images.length;
        let takePicComponent = null;
        if (isAllowedTakePic) {
            takePicComponent = <span className={`preview-upload`}>
                <ImgUploadWithConfirm
                    data={data}
                    maxNumLimit={1}
                    isMobileBrowser={isMobileBrowser}
                    onAfterAddOrDel={(type, content) => this.takePicCallBack(type, content)}
                    uploadButton={
                        <a><CommonEshIcon type='icon-ehs-camera' style={{color: '#fff'}}/></a>
                    }/>
            </span>
        }
        return (
            <div>
                {
                    images.map((file, index) => {
                        if (images.length - index > _tempShowNumLimit) return null;
                        let thumbUrl = imgId || '';
                        if (!imgId && file) {
                            thumbUrl = file.url;
                        }
                        return (
                            <div className='clearfix imgPreview-imgWrapper ant-upload-list-picture-card'
                                style={{position: 'relative', display: 'inline-block'}}
                                key={index}>
                                <div
                                    className='imgPreview-imgContent ant-upload-list-item'
                                    onClick={(e) => this.handlePreview(e, file)}
                                    style={{
                                        width: width,
                                        height: height,
                                        background: `url(${thumbUrl}&thumbnail=Y) #fff no-repeat center / contain`,
                                    }}
                                >
                                    {
                                        showRemoveIcon &&
                                        <>
                                            {
                                                isDelConfirm ?
                                                    <Popconfirm title={i18n.DeleteConfirmation}
                                                        placement={'topRight'}
                                                        onConfirm={() => handleDelete(file, index)}>
                                                        <CloseCircleFilled className='iconfont imgPreview-delIcon'
                                                            style={{fontSize: 14}}/>
                                                    </Popconfirm>
                                                    :
                                                    <CloseCircleFilled onClick={() => handleDelete(file, index)}
                                                        className='iconfont imgPreview-delIcon' style={{fontSize: 14}}/>
                                            }
                                        </>
                                    }
                                </div>
                            </div>

                        );
                    })
                }

                <ImgPreviewModal
                    isMobileBrowser={isMobileBrowser}
                    isAllowedTakePic={isAllowedTakePic}
                    images={images}
                    visible={visible}
                    photoIndex={photoIndex}
                    setPhotoIndex={this.setPhotoIndex}
                    handleCancel={this.handleCancel}
                    takePicComponent={takePicComponent}
                />
            </div>
        );
    }
}
