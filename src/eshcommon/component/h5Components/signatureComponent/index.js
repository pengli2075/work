/**
 * @file: 签字
 * @author: pengli
 * 无法手动改变屏幕方向，通过css样式转换（此时body.clientWidth|clientHeight不会发生变化）
 */
import React from 'react';
import {Modal, Button} from 'antd-mobile';
import ReactSignature from 'react-signature-canvas'
import {CommonListItem} from 'component/h5Components/index';
import {getUploadFileFormData, dataURLtoFile} from 'component/commonFunctions';
import './signatureStyle.css';
import DeviceOrientation, {Orientation} from 'react-screen-orientation';
import WaterMarker from './waterMark';
import LbwJsUtilsH5, {CommonDivider} from 'component/LbwJsUtilsH5';
import moment from 'moment';
import ImgUploadWithConfirm from 'component/ImgUploadWithConfirm';
import CommonEshIcon from 'component/commonEshIcon';

const dateFormatStr = 'YYYY-MM-DD HH:mm';
let body = document.documentElement || document.body;

export default class SignComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            signatureImg: props.signatureImg
        };
    }

    handleSignVisible = (visible) => {
        this.setState({
            visible
        })
    }

    /**
     * 签字回调
     * @param  {[type]} contentId [description]
     * @return {[type]}        [description]
     */
    handleCompleteSign = (contentId) => {
        this.setState({
            signatureImg: contentId
        })
        if (this.props.form) {
            this.props.form.setFieldsValue({
                [this.props.fieldName]: contentId
            })
        }
        this.props.callBack && this.props.callBack(contentId);
    }

    toSignature = () => {
        if ((this.props.signBeforeClick && this.props.signBeforeClick()) || !this.props.signBeforeClick) {
            this.handleSignVisible(true)
        }
    }

    render() {
        const {visible, signatureImg} = this.state;
        const {contentStyles = {}, rightContent, wrapperStyles = {}, label, hideDivider = false, hideSignBtn = false, text = ''} = this.props;
        return (
            <div>
                {
                    !hideDivider &&
                    <CommonDivider styles={{height: 5}}/>
                }
                <CommonListItem
                    label={label || i18n.Signature}
                    contentStyles={{...wrapperStyles}}
                    content={
                        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', ...contentStyles}}>
                            {
                                !hideSignBtn &&
                                <Button style={{marginRight: 10, borderRadius: 2}} type='primary' className='em-button-sm'
                                    onClick={this.toSignature}>{i18n.Signature}</Button>
                            }
                            {
                                signatureImg &&
                                <img src={'stream4imgsrc?contentId=' + signatureImg}
                                    style={{width: 80, height: 50, border: '1px solid #eee', borderRadius: 2}}/>
                            }
                        </div>
                    }
                    rightContent={rightContent}/>
                <SignModal
                    text={text}
                    visible={visible}
                    closeSign={() => this.handleSignVisible(false)}
                    callBack={this.handleCompleteSign}/>
            </div>
        );
    }
}

export class SignModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isSign: false, // 是否签字的标识
            signatureImg: null,
            orientation: 'portrait',
            autoOrientation: 'portrait', // 自动切换屏幕
            transformtype: 'manual',
            isTransform: false, // 是否手动旋转
        }
        this.angle = 0;
    }

    getRotateDataUrl = () => {
        return new Promise((resolve) => {
            let ismanuallandscape = this.state.transformtype === 'manual' && this.state.orientation === 'landscape';
            let _canvas = this.signatureboard.getCanvas();
            let copy = document.createElement('canvas');
            copy.width = ismanuallandscape ? _canvas.height : _canvas.width;
            copy.height = ismanuallandscape ? _canvas.width : _canvas.height;
            let _context = copy.getContext('2d');
            _context.fillStyle = '#fff';
            _context.fillRect(0, 0, copy.width, copy.height);
            if (ismanuallandscape) {
                _context.translate(copy.width / 2, copy.height / 2);
                _context.rotate(90 * Math.PI / 180);
            }
            let img = new Image();
            img.onload = () => {
                if (ismanuallandscape) {
                    _context.drawImage(img, 0 - _canvas.width / 2, 0 - _canvas.height / 2);
                } else {
                    _context.drawImage(img, 0, 0);
                }
                resolve(copy.toDataURL('image/jpeg', 0.1));
            }
            img.src = _canvas.toDataURL();
        })
    }

    onSave = () => {
        if (this.state.isSign) {
            this.getRotateDataUrl().then(signatureImg => {
                this.props.closeSign();
                this.handleCompleteSign(signatureImg);
                this.setState({
                    transformtype: 'manual',
                    orientation: 'portrait'
                })
            })
        } else {
            LbwJsUtilsH5.UtilToast('请签字');
            return;
        }
    }

    /**
     * 签字上传
     * @param  {[type]} signatureImg [description]
     * @return {[type]}        [description]
     */
    handleCompleteSign = (signatureImg) => {
        LbwJsUtilsH5.UtilToast('loading', '上传中...');
        // 上传签字图片
        let formData = getUploadFileFormData({
            partyId: userCompany
        });
        let newFile = dataURLtoFile(signatureImg, 'sign.png');
        formData.append('imageData', newFile);
        $.ajax({
            method: 'post',
            processData: false,
            contentType: false,
            cache: false,
            data: formData,
            enctype: 'multipart/form-data',
            url: 'createEshPartyContent_antd',
            success: success => {
                if (success.contentId) { // 上传成功
                    this.props.callBack(success.contentId);
                    LbwJsUtilsH5.UtilToast('success', '上传成功');
                } else {
                    LbwJsUtilsH5.UtilToast('fail', success);
                }
            },
            error: error => {
                LbwJsUtilsH5.UtilToast('fail', error);
            }
        });
    }

    onReSign = () => {
        this.setState({
            isSign: false
        })
        this.signatureboard.clear();
    }

    onClose = () => {
        this.setState({
            transformtype: 'manual',
            orientation: 'portrait'
        })
        this.props.closeSign();
    }

    onEnd = () => {
        this.setState({
            isSign: true
        })
    }

    /**
     * 手动切换屏幕方向（模拟：css旋转）
     * @return {[type]} [description]
     */
    handleChangeOrientation = () => {
        let _orientation = this.state.orientation;
        if (this.state.transformtype === 'auto') {
            _orientation = this.state.autoOrientation;
        }
        _orientation = _orientation === 'portrait' ? 'landscape' : 'portrait';
        let _transformtype = 'auto', _autoOrientation = this.state.autoOrientation;
        if (this.angle === 0) { // 横屏状态
            _transformtype = 'manual';
            this.rotateModalScreen(_orientation);
        } else {
            _autoOrientation = _orientation;
        }
        this.setState({
            transformtype: _transformtype,
            orientation: _orientation,
            autoOrientation: _autoOrientation
        })
    }

    rotateModalScreen = (orientation) => {
        let isTransform = 'manual';
        if (orientation === 'landscape') {
            // 模拟横屏，将弹框整体逆时针旋转90度
            let entry = document.getElementsByClassName('signature-modal')[0];
            let am_modal_popup = entry.getElementsByClassName('am-modal-popup')[0];
            am_modal_popup.style.width = body.clientHeight + 'px';
            am_modal_popup.style.height = body.clientWidth + 'px';
            am_modal_popup.style.transform = 'rotate(-90deg)';
            am_modal_popup.style.top = (body.clientHeight - body.clientWidth) / 2 + 'px';
            am_modal_popup.style.left = (body.clientWidth - body.clientHeight) / 2 + 'px';
        } else {
            // 模拟竖屏，非横屏状态下将样式回复默认
            let entry = document.getElementsByClassName('signature-modal')[0];
            let am_modal_popup = entry.getElementsByClassName('am-modal-popup')[0];
            am_modal_popup.style.width = '100%';
            am_modal_popup.style.height = 'auto';
            am_modal_popup.style.transform = 'rotate(0deg)';
            am_modal_popup.style.top = 'auto';
            am_modal_popup.style.left = '0px';
        }
        this.setState({isTransform}, () => {
            if (orientation === 'landscape') {
                $('.signature-transform').css({
                    top: (body.clientWidth - (body.clientHeight + 44)) / 2 + 'px',
                    left: (body.clientHeight - (body.clientWidth - 44)) / 2 + 'px'
                })
            }
        });
    }

    onOrientationChange = (orientation, type, angle) => {
        setTimeout(() => {
            // 当前处于手动切换的横屏状态
            if (this.state.transformtype === 'manual' && this.state.orientation === 'landscape') {
                this.rotateModalScreen('portrait');
            }
            this.angle = typeof angle === 'object' ? (angle.angle || 0) : angle;
            this.setState({
                transformtype: 'auto',
                autoOrientation: orientation
            })
        }, 100);
    }

    onLockOrientation = (success) => {
        // do something on lock
    }

    render() {
        const {orientation, transformtype, autoOrientation} = this.state;
        const {text} = this.props;
        let _orientation = orientation;
        let modalHeight = 0;
        let canvasHeight = 0, canvasWidth = body.clientWidth, canvasCName = 'signature';
        if (transformtype === 'manual') { // 手动
            if (_orientation === 'landscape') {
                modalHeight = body.clientWidth;
                canvasHeight = body.clientHeight;
                canvasWidth = body.clientWidth - 44;
                canvasCName = 'signature-transform';
            } else {
                modalHeight = 300;
                canvasHeight = modalHeight - 44;
            }
        } else {
            _orientation = autoOrientation;
            if (_orientation === 'landscape') {
                modalHeight = body.clientHeight;
                canvasHeight = modalHeight - 44;
            } else {
                modalHeight = 300;
                canvasHeight = modalHeight - 44;
            }
        }
        const canvasProps = {
            className: canvasCName,
            height: canvasHeight,
            width: canvasWidth,
            orientation: _orientation,
            transformtype
        };
        return (
            <Modal
                wrapClassName={'signature-modal'}
                popup
                visible={this.props.visible}
                onClose={this.onClose}
                animationType='slide-up'
            >
                <DeviceOrientation
                    ref={com => this.deviceOrientation = com}
                    lockOrientation={orientation}
                    onLockOrientation={this.onLockOrientation}
                    onOrientationChange={this.onOrientationChange}>
                    <Orientation orientation={orientation}>
                        <div className={'orientation-screen'}
                            style={{height: modalHeight, boxShadow: '#ccc 5px 5px 20px -2px', background: '#fff'}}>
                            <div className='signature-btn-wrapper'>
                                <span style={{marginTop: 3}}>
                                    <a onClick={this.onReSign}>{i18n.ResetSign}</a>
                                </span>
                                <span>
                                    <a onClick={this.onSave}>{i18n.CommonSave}</a>
                                    <a style={{marginLeft: 10}} onClick={this.onClose}>{i18n.CommonCancel}</a>
                                    <a style={{
                                        marginLeft: 10,
                                        background: 'transparent',
                                        padding: 0,
                                        verticalAlign: '-1px'
                                    }} onClick={this.handleChangeOrientation}>
                                        <i style={{color: '#108ee9', fontSize: 16}}
                                            className={`esh-common ${_orientation === 'portrait' ? 'icon-ehs-fullscreen' : 'icon-ehs-smallscreen'}`} />
                                    </a>
                                </span>
                            </div>
                            <WaterMarker
                                text={text}
                                canvasProps={canvasProps}>
                                <ReactSignature
                                    ref={com => this.signatureboard = com}
                                    canvasProps={canvasProps}
                                    onEnd={this.onEnd}/>
                            </WaterMarker>
                        </div>
                    </Orientation>
                </DeviceOrientation>
            </Modal>
        );
    }
}


/**
 * 作业人员签字详情(右照片+下签字时间)
 */
export const DetailSignatureForPerson = ({item, isDetail}) => (
    <>
        <SignComponent
            hideDivider={true}
            hideSignBtn={true}
            contentStyles={{alignItems: 'normal'}}
            signatureImg={item.signatureImg}
            rightContent={
                <span className={`em-upload person-upload ${!isDetail ? 'detail' : ''}`}>
                    {
                        item.onsiteImg ?
                            <ImgUploadWithConfirm data={{}}
                                showRemoveIcon={false}
                                defaultValue={item.onsiteImg}/>
                            :
                            (!isDetail && <CommonEshIcon type='icon-ehs-camera' />)
                    }
                </span>
            }
        />
        {
            item.signatureTime &&
            <CommonListItem content={moment(item.signatureTime).format(dateFormatStr)} />
        }
    </>
)

export const DetailSignature = ({item, _dateFormatStr, label}) => (
    <SignComponent
        label={label}
        hideDivider={true}
        hideSignBtn={true}
        contentStyles={{alignItems: 'normal'}}
        signatureImg={item.signatureImg}
        wrapperStyles={{position: 'relative', width: '70%'}}
        rightContent={
            <span>{item.signatureTime ? moment(item.signatureTime).format(_dateFormatStr || dateFormatStr) : ''}</span>
        }/>
)
