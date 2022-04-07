/**
 * WebTriggerUpload
 * **推荐使用:triggerUploadAntd 组件
 */
import React from 'react'
import {Row, Col, DatePicker, Input, Button} from 'antd';
import LbwJsUtils from 'component/LbwJsUtils';
import '@ant-design/compatible/assets/index.css';

const {TextArea} = Input;

export default class WebTriggerUpload extends React.Component {
    state = {
        loading: false,
        fileVal: (this.props.cfg && this.props.cfg.fileVal) || 'imageData',
        callbackContent: this.props.callbackContent || undefined,               // 回调方法
        extraData: (this.props.cfg && this.props.cfg.extraData) || {},         // 额外添加的数据
        fileSizeLimit: this.props.fileSizeLimit,                               // 文件大小限制
        server: this.props.server || 'createDataResourceForLabway_antd',        // 文件上传的服务
        // 内部使用
        uploader: undefined,
        inputData: {},                                                         // 用户输入的数据
        // 上传文件的标签id，同一个页面有多个引用需要传值（每一次引用要传不同的值），否则id 冲突，影响上传
        picker: this.props.picker || 'picker',
        fileList: this.props.fileList || 'fileList'
    }

    componentDidMount() {
        let _this = this;
        // 默认的传递的参数
        let defaultParam = {
            'mimeTypeId': 'application/octet-strem',
            'partyContentTypeId': 'USERDEF',
            'dataResourceTypeId': 'OFBIZ_FILE',
            'statusId': 'CTNT_AVAILABLE',
            'dataCategoryId': 'BUSINESS',
            'isPublic': 'N',
            'needThumbnail': 'N'
        }
        let sendData = $.extend(defaultParam, this.state.extraData);
        let uploader = WebUploader.create({
            auto: false, // 使用自动提交
            swf: '/labwaycommon/images/webuploader/Uploader.swf', // flash文件
            server: this.state.server,
            pick: {id: '#' + this.state.picker, multiple: false}, // 控件 id
            method: 'POST', // 使用post 发送
            fileVal: this.state.fileVal, // 设置文件流的的字段名
            fileNumLimit: 1, // 文件上传限制
            formData: sendData,
            chunked: false,  // 分片上传大文件
        });

        uploader.on('uploadBeforeSend', function (object, data, headers) {
            _this.uploadBeforeSend(object, data, headers)
        });
        uploader.on('uploadError', function (file, response) {
        });
        uploader.on('uploadSuccess', function (file, response) {
            if (isJsonResponseError(response)) {
                LbwJsUtils.notification(response);
            } else {
                $.extend(file, response);
            }
            _this.setState({loading: false}, () => {
                setTimeout(() => {
                    _this.setState({fileName: ''});
                    $('#' + _this.state.fileList).html('');
                }, 500);
            });
            if (_this.state.callbackContent) {
                _this.state.callbackContent(response, file, _this.state.inputData);
            }
        });
        uploader.on('beforeFileQueued', function (file) {
            let array = uploader.getFiles();
            if (array.length != 0) { // 清空所有之前选择的文件
                for (let index in array) {
                    if (file != array[index]) {
                        uploader.removeFile(array[index])
                    }
                }
                uploader.reset();
                $('#' + _this.state.fileList).html('');
            }
        })
        // 当有文件添加进来的时候
        uploader.on('fileQueued', function (file) {
            if (_this.state.fileSizeLimit) {
                if (file.size > _this.state.fileSizeLimit * 1024 * 1024) {
                    LbwJsUtils.notification('error', i18n.EshFileMustSmallerThan + _this.state.fileSizeLimit + 'MB!');
                    _this.setState({loading: false});
                    return false;
                }
            }
            $('#' + _this.state.fileList).append('<div id="' + file.id + '" className="item">' +
                '<h4 className="info">' + file.name + '</h4>' +
                '</div>');
            $(`#${_this.state.picker}explain`).hide();
            _this.setState({
                fileName: file.name
            })
        });
        this.setState({uploader: uploader});
    }

    handleSubmit() {
        if (this.state.fileName) {
            /* 判断是否含有同名文件，是否允许上传 */
            if (this.props.isAllowedUpload) {
                this.props.isAllowedUpload(this.state.fileName);
            } else {
                this.uploadFile();
            }
        } else {
            $(`#${this.state.picker}explain`).show();
        }
    }

    uploadFile() {
        this.setState({loading: true});
        let uploader = this.state.uploader;
        uploader.upload(); // 上传
    }

    uploadBeforeSend(object, data, headers) {
        // 添加 fromDate thruDate description etc..
        $.extend(data, this.state.inputData);
        if (data.fromDate) { // TODO: 后台没有对日期进行处理
            data.fromDate = data.fromDate.format('YYYY-MM-DD HH:mm:ss');
        }
        if (data.thruDate) {
            data.thruDate = data.thruDate.format('YYYY-MM-DD HH:mm:ss');
        }
        delete data.lastModifiedDate // 删除不需要的传递的数据
    }

    getDisplayFlagByFieldName(field) {
        if (this.props.cfg && this.props.cfg[field]) {
            return ''
        }
        return 'none'; // 默认不显示
    }

    inputDataChange(e, fieldName) {
        let obj = {};
        if (fieldName.includes('Date')) {
            obj[fieldName] = e[0]
        } else {
            obj[fieldName] = e.target.value
        }
        let inputData = this.state.inputData;
        $.extend(inputData, obj)
        this.setState(inputData);
    }

    render() {
        const {fromDate, thruDate, description} = this.state.inputData;
        const showNameLayout = 6;
        const showInputLayout = 17;
        return (
            <div>
                <Row className='ant-legacy-form-item'>
                    <Col span={showNameLayout} className='ant-legacy-form-item-label'>
                        <label><span style={{
                            color: 'red',
                            padding: '0px 5px',
                            fontSize: 15,
                            verticalAlign: 'middle'
                        }}>*</span>{i18n.content}</label>
                    </Col>
                    <Col span={showInputLayout}>
                        <div>
                            <input type='hidden' name='file'/>{/*antd form 会验证这个字段*/}
                            <div id='thelist' className='uploader-list' />
                            <div className='btns'>
                                <div id={this.state.picker}>{i18n.EshCommonPleaseSelectFile}</div>
                                <div id={this.state.fileList} />
                            </div>
                        </div>
                        <span id={`${this.state.picker}explain`}
                            style={{color: 'red', display: 'none'}}>{i18n.Err_IsMandatoryField}</span>
                    </Col>
                </Row>
                <Row className='ant-legacy-form-item'
                    style={{display: this.getDisplayFlagByFieldName('showFromDate')}}>
                    <Col span={showNameLayout} className='ant-legacy-form-item-label'>
                        <label>{i18n.fromDate}</label>
                    </Col>
                    <Col span={showInputLayout}>
                        <DatePicker showTime={true} value={fromDate} format='YYYY-MM-DD HH:mm:ss' name='fromDate'
                            onChange={(...args) => this.inputDataChange(args, 'fromDate')}/>
                    </Col>
                </Row>
                <Row className='ant-legacy-form-item'
                    style={{display: this.getDisplayFlagByFieldName('showThruDate')}}>
                    <Col span={showNameLayout} className='ant-legacy-form-item-label'>
                        <label>{i18n.thruDate}</label>
                    </Col>
                    <Col span={showInputLayout}>
                        <DatePicker showTime={true} value={thruDate} format='YYYY-MM-DD HH:mm:ss' name='thruDate'
                            onChange={(...args) => this.inputDataChange(args, 'thruDate')}/>
                    </Col>
                </Row>
                <Row className='ant-legacy-form-item'
                    style={{display: this.getDisplayFlagByFieldName('showDescription')}}>
                    <Col span={showNameLayout} className='ant-legacy-form-item-label'>
                        <label>{i18n.description}</label>
                    </Col>
                    <Col span={showInputLayout}>
                        <TextArea maxLength={255} value={description} autoSize={{minRows: 2, maxRows: 3}}
                            name='description' onChange={(e) => this.inputDataChange(e, 'description')} placeholder={i18n.EshCommonPleaseEnter}/>
                    </Col>
                </Row>
                <Row className='ant-legacy-form-item'>
                    <Col span={showNameLayout}>
                        <label />
                    </Col>
                    <Col span={showInputLayout}>
                        <Button size='default' type='primary' loading={this.state.loading}
                            onClick={this.handleSubmit.bind(this)}>{i18n.CommonSave ? i18n.CommonSave : 'CommonSave'}</Button>
                    </Col>
                </Row>
            </div>
        );
    }
}