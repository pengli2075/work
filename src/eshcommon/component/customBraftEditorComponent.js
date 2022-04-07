/**
 * @file:   邮件编辑器组件
 * @author: pengli
 *
 */

import React from 'react';
// 引入编辑器组件
import BraftEditor from 'braft-editor';
// 引入编辑器样式
import 'braft-editor/dist/index.css';
import {PictureFilled} from '@ant-design/icons';
import {Form} from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import {Row, Col, Input} from 'antd';
import {ContentUtils} from 'braft-utils';
import {ImageUtils} from 'braft-finder';
import ImgUpload from 'component/ImgUpload';
import {getFileUrl} from 'component/axiosForCommon';

const FormItem = Form.Item;

export default class CustomBraftEditorComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: BraftEditor.createEditorState(props.mainBodyText),             // 创建一个空的editorState作为初始值
            readOnly: props.readOnly || false,                                          // 是否只读（不显示toolbar）
            isUploadPic: props.isUploadPic || false,                                    // 是否能上传图片
            contentData: props.contentData || {contentTypeId: 'READING_CENTER_CNTTP'},  // 默认支持阅读通知【供应商审核】
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (this.props.mainBodyText !== nextProps.mainBodyText) {
            const htmlContent = nextProps.mainBodyText;
            this.setData(htmlContent);
        }
    }

    setData = (htmlContent) => {
        this.setState({
            editorState: BraftEditor.createEditorState(htmlContent),
            mainBodyText: htmlContent
        })
    }

    handleEditorChange = (editorState) => {
        const {fileName} = this.props;
        // <p>   </p>只有一个节点时， 替换成空字符串
        var htmlContent = this.state.editorState.toHTML();
        if ($(htmlContent) && $(htmlContent).length == 1) {
            htmlContent = htmlContent.replace(/\<p\>\s*\<\/p\>/ig, '');
        }
        const {setFieldsValue} = this.props.form;
        setFieldsValue({
            [fileName]: htmlContent
        })
        this.setState({editorState})
    }

    onAfterAddOrDel = (actionType, file) => {
        if (!file) {
            return false;
        }
        let contendIds = file.split(',');
        let contentId = contendIds[contendIds.length - 1];
        this.setState({
            editorState: ContentUtils.insertMedias(this.state.editorState, [{
                type: 'IMAGE',
                url: `${getFileUrl()}stream?contentId=${contentId}`
            }])
        })
    }

    render() {
        const {editorState, readOnly, isUploadPic, contentData} = this.state;
        const {label, formItemLayout, mainBodyText, fileName, contentStyle} = this.props;
        const {getFieldDecorator} = this.props.form;
        const extendControls = isUploadPic ? [
            {
                key: 'antd-uploader',
                type: 'component',
                component: (
                    <ImgUpload
                        data={contentData}
                        listType='picture'
                        showUploadList={false}
                        isNotLimit={true}
                        action='createDataResourceForLabway_antd'
                        uploadButton={
                            <button type='button' className='control-item button upload-button' data-title='插入图片'>
                                <PictureFilled/>
                            </button>
                        }
                        onAfterAddOrDel={this.onAfterAddOrDel}/>
                )
            }
        ] : [];
        return (

            <Row>
                <Col span={24}>
                    {
                        readOnly ?
                            <FormItem label={label} {...formItemLayout} className='ant-legacy-form-item-default'>
                                <div className='my-component'
                                    style={{marginBottom: 5, border: '1px solid #d1d1d1', borderRadius: 5}}>
                                    <BraftEditor
                                        readOnly={true}
                                        value={editorState}
                                        controls={[]}/>
                                </div>
                            </FormItem>
                            :
                            <FormItem label={label} {...formItemLayout} className='ant-legacy-form-item-default'>
                                {
                                    getFieldDecorator(fileName, {
                                        initialValue: mainBodyText,
                                        rules: [{required: true, message: i18n.Err_IsMandatoryField}],
                                    })(
                                        <Input size='default' style={{display: 'none'}}/>
                                    )
                                }
                                <div className='my-component'
                                    style={{marginBottom: 5, border: '1px solid #d1d1d1', borderRadius: 5}}>
                                    <BraftEditor
                                        excludeControls={['media']}
                                        value={editorState}
                                        contentStyle={contentStyle}
                                        onChange={this.handleEditorChange}
                                        extendControls={extendControls}/>
                                </div>
                            </FormItem>

                    }
                </Col>
            </Row>
        )

    }

}
