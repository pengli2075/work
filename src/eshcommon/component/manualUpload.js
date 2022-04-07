/**
 * WebTriggerUpload
 * **推荐使用:triggerUploadAntd 组件
 */
import React from 'react'
import {Row, Col, DatePicker, Input, Button, Upload, Form} from 'antd';
import LbwJsUtils from './LbwJsUtils';
import '@ant-design/compatible/assets/index.css';
import { axiosFormDataForCommon } from './axiosForCommon';

const {TextArea} = Input;
const FormItem = Form.Item;
const formItemLayout = {
    labelCol: {span: 4},
    wrapperCol: {span: 18},
}

export default class WebTriggerUploadAntd extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            fileVal: (props.cfg && props.cfg.fileVal) || 'imageData',
            callbackContent: props.callbackContent || undefined,               // 回调方法
            extraData: (props.cfg && props.cfg.extraData) || {},         // 额外添加的数据
            fileSizeLimit: props.fileSizeLimit,                               // 文件大小限制
            server: props.server || 'createDataResourceForLabway_antd',        // 文件上传的服务
            // 内部使用
            uploader: undefined,
            inputData: {},                                                         // 用户输入的数据
            // 上传文件的标签id，同一个页面有多个引用需要传值（每一次引用要传不同的值），否则id 冲突，影响上传
            picker: props.picker || 'picker',
            fileList: props.fileList || []
        }
    }

    handleUpload = () => {
        const {fileList, server, picker, extraData, inputData} = this.state;
        if (fileList.length === 0) {
            $(`#${picker}explain`).show();
            return;
        }
        const file = fileList[0];
        const fileName = file.name;
        if (fileName) {
            /* 判断是否含有同名文件，是否允许上传 */
            if (this.props.isAllowedUpload && !this.props.isAllowedUpload(fileName)) {
                return;
            }
        }
        this.setState({loading: true});
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
        let sendData = $.extend(defaultParam, extraData, inputData, file, {imageData: file});
        delete sendData.lastModifiedDate;
        let bodyFormData = new FormData();
        for (let key in sendData) {
            bodyFormData.append(key, sendData[key]);
        }
        axiosFormDataForCommon(server, {bodyFormData, webappName: extraData.webappName}, success => {
            this.setState({
                fileList: [],
                loading: false
            }, () => {
                if (this.state.callbackContent) {
                    this.state.callbackContent(success, fileList[0], this.state.inputData);
                }
            });
        }, error => {
            LbwJsUtils.notification('error', error);
            this.setState({loading: false});
        })
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

    removeFile = (file) => {
        let {fileList} = this.state;
        const index = fileList.indexOf(file);
        fileList.splice(index, 1);
        this.setState({fileList});
    }

    beforeUpload = (file) => {
        $(`#${this.state.picker}explain`).hide();
        let {fileSizeLimit} = this.state;
        if (file.size > fileSizeLimit * 1024 * 1024) {
            LbwJsUtils.notification('error', i18n.EshFileMustSmallerThan + _this.state.fileSizeLimit + 'MB!');
        } else {
            this.setState({fileList: [file]});
        }
        return false;
    }

    resetData = () => {
        $(`#${this.state.picker}explain`).hide();
        this.setState({
            fileList: [],
            inputData: {}
        })
    }

    render() {
        const {loading, extraData, fileList} = this.state;
        const {fromDate, thruDate, description} = this.state.inputData;
        let sendData = $.extend({
            'mimeTypeId': 'application/octet-strem',
            'partyContentTypeId': 'USERDEF',
            'dataResourceTypeId': 'OFBIZ_FILE',
            'statusId': 'CTNT_AVAILABLE',
            'dataCategoryId': 'BUSINESS',
            'isPublic': 'N',
            'needThumbnail': 'N'
        }, extraData);
        let uploadProps = {
            action: this.state.server,
            data: sendData,
            maxCount: 1,
            showUploadList: this.props.showUploadList === undefined || this.props.showUploadList, // 是否要显示上传文件列表
            onRemove: this.removeFile,
            beforeUpload: this.beforeUpload,
            fileList
        };
        return (
            <>
                <Row>
                    <Col span={24}>
                        <FormItem label={<><span style={{
                            color: 'red',
                            padding: '0px 5px',
                            fontSize: 15,
                            verticalAlign: 'middle'
                        }}>*</span>{i18n.content}</>} {...formItemLayout}>
                            <Upload {...uploadProps} style={{width: '20%'}}>
                                <Button>{i18n.EshCommonPleaseSelectFile}</Button>
                            </Upload>
                            <span id={`${this.state.picker}explain`} style={{color: 'red', display: 'none', marginLeft: 5}}>{i18n.Err_IsMandatoryField}</span>
                        </FormItem>
                    </Col>
                </Row>
                <Row style={{display: this.getDisplayFlagByFieldName('showFromDate')}}>
                    <Col span={24}>
                        <FormItem label={i18n.fromDate} {...formItemLayout}>
                            <DatePicker showTime={true} value={fromDate} format='YYYY-MM-DD HH:mm:ss' name='fromDate'
                                onChange={(...args) => this.inputDataChange(args, 'fromDate')}/>
                        </FormItem>
                    </Col>
                </Row>
                <Row style={{display: this.getDisplayFlagByFieldName('showThruDate')}}>
                    <Col span={24}>
                        <FormItem label={i18n.thruDate} {...formItemLayout}>
                            <DatePicker showTime={true} value={thruDate} format='YYYY-MM-DD HH:mm:ss' name='thruDate'
                                onChange={(...args) => this.inputDataChange(args, 'thruDate')}/>
                        </FormItem>
                    </Col>
                </Row>
                <Row style={{display: this.getDisplayFlagByFieldName('showDescription')}}>
                    <Col span={24}>
                        <FormItem label={i18n.description} {...formItemLayout}>
                            <TextArea maxLength={255} value={description} autoSize={{minRows: 2, maxRows: 3}}
                                name='description' onChange={(e) => this.inputDataChange(e, 'description')} placeholder={i18n.EshCommonPleaseEnter}/>
                        </FormItem>
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        <FormItem wrapperCol={{span: 12, offset: 4}}>
                            <Button size='default' type='primary' loading={loading} onClick={this.handleUpload}>{i18n.CommonSave}</Button>
                            <Button size='default' type='danger' loading={loading} onClick={this.resetData} style={{marginLeft: 10}}>{i18n.LbwcReset}</Button>
                        </FormItem>
                    </Col>
                </Row>
            </>
        );
    }
}