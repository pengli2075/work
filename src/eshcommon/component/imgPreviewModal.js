/**
 * @file: 图片预览弹框
 * @author: pengli
 */

import React, {useEffect} from 'react';
import {UndoOutlined, ZoomInOutlined, ZoomOutOutlined, CloseOutlined, ArrowDownOutlined, ArrowUpOutlined} from '@ant-design/icons';
import Viewer from 'react-viewer';
import CommonModalComponent from 'component/commonModalComponent';
import CommonEshIcon from 'component/commonEshIcon';

export default function ImgPreviewModal(props) {
    const {images, visible, photoIndex, setPhotoIndex, handleCancel, isAllowedTakePic, takePicCallBack, isMobileBrowser, partyId, data} = props;
    let interval = null;
    let interval1 = null;
    useEffect(() => {
        if (visible) {
            replaceText();
            setTakePic();
        }
        return () => {
            clearInterval(interval);
            clearInterval(interval1);
        };
    }, [visible]);

    function replaceText() {
        interval = setInterval(() => {
            if ($('.react-viewer-showTotal').length > 0) {
                $('.react-viewer-showTotal').html($('.react-viewer-showTotal').html().replaceAll('of', '/'));
                clearInterval(interval);
            } 
        }, 10);
    }

    function setTakePic() {
        interval1 = setInterval(() => {
            if (isAllowedTakePic) {
                $('.react-viewer').map(function() {
                    if ($(this).css('display') !== 'none') {
                        $(this).find('.react-viewer-btn').find('input[type="file"]').attr('capture', 'camera');
                    }
                })
                clearInterval(interval1);
            }
        }, 10)
    }

    function handleChangeIndex(e, key) {
        e.stopPropagation();
        replaceText();
        if (key) {
            setPhotoIndex(photoIndex ? photoIndex - 1 : images.length - 1);
        } else {
            setPhotoIndex(photoIndex === images.length - 1 ? 0 : photoIndex + 1);
        }
    }
    
    function onAfterAddOrDel(type, content) {
        handleCancel();
        takePicCallBack && takePicCallBack(type, content);
    }

    return (
        <>
            <Viewer
                visible={visible}
                onClose={handleCancel}
                images={images.map(item => ({src: item.url}))}
                noNavbar={true}
                noImgDetails={true}
                zoomSpeed={1}
                minScale={1}
                noClose={true}
                disableMouseZoom={true}
                disableKeyboardSupport={true}
                activeIndex={photoIndex}
                onMaskClick={handleCancel}
                customToolbar={(ToolbarConfig) => {
                    let toolbars = [{
                        actionType: 1,
                        key: 'zoomIn',
                        render: <ZoomInOutlined />
                    }, {
                        actionType: 2,
                        key: 'zoomOut',
                        render: <ZoomOutOutlined />
                    }, {
                        actionType: 5,
                        key: 'rotateLeft',
                        render: <UndoOutlined />
                    }, {
                        actionType: 0,
                        key: 'close',
                        render: <CloseOutlined onClick={handleCancel} />
                    }];
                    if (props.isAllowedTakePic) {
                        toolbars.unshift({
                            actionType: -1,
                            key: 'takepic',
                            render: props.takePicComponent
                        })
                    }
                    return toolbars;
                }}
            />
            {
                visible &&
                <CommonModalComponent containerId={'react-viewer-prenext'}>
                    <div style={{height: '100%'}} onClick={handleCancel}>
                        {
                            photoIndex !== 0 &&
                        <li className='react-viewer-btn' data-key='prev' onClick={(e) => handleChangeIndex(e, 'prev')}>
                            <ArrowDownOutlined/>
                        </li>
                        }
                        {
                            photoIndex !== images.length - 1 &&
                        <li className='react-viewer-btn' data-key='next' onClick={handleChangeIndex}>
                            <ArrowUpOutlined/>
                        </li>
                        }
                    </div>
                </CommonModalComponent>
            }
        </>
    );
}