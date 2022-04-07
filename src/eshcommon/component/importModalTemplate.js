/*
*
<link rel="stylesheet" href="/eshImages/webuploadercss/webuploader-override.css" />
<script src="/labwaycommon/images/webuploader/webuploader.js"></script>
<#include "/esh/webapp/esh/includes/lookupSupplierFactory.i18n.ftl">
*
* showSupplierFactory  // 是否展示供应商选择
* templateUrl          // 模板链接
* server               // 确认导入的链接
* fileVal              // 上传文件的字段名称
* setSupplierFactory   // 如果需要将多供应商id传回父组件，传入该方法可以取到 partyId
* */
import React from 'react';
import {Form} from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import {Modal, Button, Checkbox, InputNumber} from 'antd';
import LbwJsUtils from 'component/LbwJsUtils.jsx';
import Lookup_supplierFactory from 'lookup/supplierFactory';

const FormItem = Form.Item;

class ImportModalTemplate extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            uploader: undefined,
            loading: false,
            showSupplierFactory: props.showSupplierFactory || false,  // 是否展示供应商选择
            templateUrl: props.templateUrl,    // 模板链接
            server: props.server,              // 确认导入的链接
            fileVal: props.fileVal || 'imageData', // 上传文件的字段名称
            isGlobal: props.isGlobal || '',
            needGlobal: props.needGlobal || false, // 是否显示是否全局
            companyInternalId: props.companyInternalId || '',
            trainingQualScore: props.trainingQualScore || 80
        }
    }

    componentDidMount() {
        if (this.props.defaultShowModal) {
            this.setState({visible: true});
        }
    }

    componentDidUpdate = () => {
        const {visible, uploader} = this.state;
        if (uploader == undefined) {
            setTimeout(() => {
                if (!visible) {
                    return;
                }
                if (uploader) {
                    return;
                }
                if ($('#picker') && $('#picker').children().length > 0) {
                    return;
                }
                let obj = {
                    auto: false, // 使用自动提交
                    swf: '/labwaycommon/images/webuploader/Uploader.swf', // flash文件
                    server: this.state.server,
                    pick: {id: '#picker', multiple: false}, // 控件 id
                    method: 'POST', // 使用post 发送
                    fileVal: this.state.fileVal, // 设置文件流的的字段名
                    fileNumLimit: 1, // 文件上传限制
                    chunked: false,  // 分片上传大文件
                    accept: {
                        mimeTypes: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                };
                let isIE = window.ActiveXObject || 'ActiveXObject' in window; // 判断是不是Ie
                if (isIE) {
                    let userAgent = navigator.userAgent; //取得浏览器的userAgent字符串 
                    let reIE = new RegExp('MSIE (\\d+\\.\\d+);');
                    reIE.test(userAgent);
                    let fIEVersion = parseFloat(RegExp['$1']);
                    if (fIEVersion < 10) {
                        delete obj.accept;
                    }
                }
                let uploader = WebUploader.create(obj);
                uploader.on('uploadBeforeSend', (object, data, headers) => {
                    data.itemIncludesSubSection = this.props.showSubSection;
                    data.trainingQualificationScore = this.state.trainingQualScore;
                    if (this.state.isGlobal !== 'Y') {
                        // 将供应商id传给后台
                        if (this.state.showSupplierFactory) {
                            data = $.extend(data, {supplierFactory: this.props.form.getFieldValue('supplierFactory')});
                        } else {
                            data = $.extend(data, {supplierFactory: userCompany});
                        }
                    } else {
                        data.isGlobal = this.state.isGlobal;
                        data.supplierFactory = 'Company';
                    }
                    delete data.lastModifiedDate // 删除不需要的传递的数据
                });
                uploader.on('uploadSuccess', (file, result) => {
                    this.setState({loading: false});
                    LbwJsUtils.notification(result);
                    this.props.importTemplate(result);
                    this.handleCancel();
                });
                uploader.on('beforeFileQueued', (file) => {
                    let array = uploader.getFiles();
                    if (array.length != 0) { // 清空所有之前选择的文件
                        for (let index in array) {
                            if (file != array[index]) {
                                uploader.removeFile(array[index])
                            }
                        }
                        uploader.reset();
                        $('#fileList').html('');
                    }
                })
                // 当有文件添加进来的时候
                uploader.on('fileQueued', (file) => {
                    $('#fileList').append('<div id="' + file.id + '" className="item">' +
                        '<h4 className="info">' + file.name + '</h4>' +
                        '</div>');
                    this.props.form.setFieldsValue({checkListTemplate: '12'}); // 不能设置为file 否则在ie9 下 会导致堆栈溢出
                });
                this.setState({uploader: uploader});
            }, 100);
        }
    }

    showModal = () => {
        this.setState({
            visible: true,
        });
    }

    handleCancel = () => {
        this.setState({
            visible: false,
            uploader: undefined
        });
        this.clearUploadInput();

    }

    clearUploadInput() {
        this.props.form.setFieldsValue({checkListTemplate: ''});
        $('#fileList').html('');
    }

    handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.props.form.validateFields((err, fieldsValue) => {
            if (err) {
                return;
            }
            this.setState({loading: true});
            let uploader = this.state.uploader;
            let formData = uploader.options.formData;
            formData['meetObjNullReturn'] = true
            window.theAmountSaved = 0;
            uploader.upload(); // 上传
        });
    }

    setSupplierCallBack = (data) => {
        this.props.form.setFieldsValue({supplierFactory: data.partyId});
        this.props.setSupplierFactory(data.partyId);
    }

    changeIsGlobal = (e) => {
        let isGlobal = e.target.checked ? 'Y' : 'N';
        this.setState({isGlobal: isGlobal}, () => {
            this.props.setIsGlobal(isGlobal, this.props.form.getFieldValue('supplierFactory'));
        })
    }
    changeTrainingQualScore = (score) => {
        this.setState({trainingQualScore: score}, () => {
            this.props.setTrainingQualScore(score);
        })
    }
    render() {
        const {templateUrl, showSupplierFactory, isGlobal, needGlobal, companyInternalId} = this.state;
        const {getFieldDecorator} = this.props.form;
        const formItemLayout = {labelCol: {span: 7}, wrapperCol: {span: 16}};
        const formItemLayout_lookup = {labelCol: {span: 7}, wrapperCol: {span: 10}};
        let globalSetting = isGlobal === 'Y';
        return (
            <span>
                <a className='menuA' onClick={this.showModal}>{i18n.EshCommonImportFromTemplate}</a>
                <Modal className='modal-with-title' visible={this.state.visible}
                       title={i18n.EshCommonImportFromTemplate} onCancel={this.handleCancel} footer={null}>
                    <Form onSubmit={this.handleSubmit}>
                        <FormItem {...formItemLayout} label={i18n.downloadTemplate}>
                            <a href={templateUrl}>{i18n.LbwcDownload}</a>
                        </FormItem>
                        {
                            needGlobal &&
                            <FormItem {...formItemLayout} label={i18n.isGlobal}>
                                {getFieldDecorator('isGlobal')(
                                    <Checkbox checked={globalSetting} onChange={this.changeIsGlobal}/>
                                )}
                            </FormItem>
                        }
                        {
                            (isGlobal !== 'Y' && showSupplierFactory) &&
                            <FormItem {...formItemLayout_lookup} label={i18n.SupplierFactory}>
                                {getFieldDecorator('supplierFactory', {
                                    rules: [{required: true, message: i18n.Err_IsMandatoryField}]
                                })(
                                    <Lookup_supplierFactory
                                        form={this.props.form}
                                        callBack={(record) => this.setSupplierCallBack(record)}
                                        fieldName='supplierFactory'/>
                                )}
                            </FormItem>
                        }
                        <FormItem {...formItemLayout} label={i18n.EshCommonFile} className='chooseFile'>
                            {getFieldDecorator('checkListTemplate', {
                                rules: [{type: 'string', required: true, message: i18n.Err_IsMandatoryField}]
                            })(
                                <div>
                                    <input type='hidden' name='checkListTemplate'/>{/*antd form 会验证这个字段*/}
                                    <div className='btns'>
                                        <div id='picker'>{i18n.EshCommonPleaseSelectFile}</div>
                                        <div id='fileList'></div>
                                    </div>
                                </div>
                            )}
                        </FormItem>
                        {
                            companyInternalId === '15' &&
                            <FormItem {...formItemLayout} label={i18n.TrainingQualificationScore}>
                                {getFieldDecorator('trainingQualificationScore', {
                                    initialValue: this.state.trainingQualScore,
                                    rules: [{required: true, message: i18n.Err_IsMandatoryField}]
                                })(
                                    <InputNumber min=#0# max={100} precision=#0# onChange={this.changeTrainingQualScore} placeholder={i18n.EshCommonPleaseEnter}/>
                                )}
                            </FormItem>
                        }
                        <FormItem wrapperCol={{offset: 7}}>
                            <Button size='default' loading={this.state.loading} type='primary'
                                    htmlType='submit'>{i18n.EshCommonImport}</Button>
                        </FormItem>
                    </Form>
                </Modal>
            </span>
        );
    }
}

export default Form.create({})(ImportModalTemplate);