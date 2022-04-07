/**
 * @file:   输入框 formitem
 * @author: zhangyue
 */

import React from 'react';
import {Input} from 'antd';
import {Form} from '@ant-design/compatible';

const FormItem = Form.Item;
const formItemLayout = {labelCol: {span: 7}, wrapperCol: {span: 12}};
const {TextArea} = Input;

export default class CommonInputFormItem extends React.Component {
    render() {
        const {
            form, label, fieldName, required, maxLength, initialValue, bordered,
            customLayout = {}, onChange, onBlur, readOnly, extraRules = [], extraContent,
            inputType = 'input'
        } = this.props;
        const itemProps = {
            placeholder: !readOnly ? i18n.EshCommonPleaseEnter : '',
            onChange: onChange,
            maxLength: maxLength,
            onBlur: onBlur,
            readOnly: readOnly,
            bordered: bordered,
            autoSize: inputType === 'textarea' ? {minRows: 1} : null
        };
        return (
            <FormItem label={label} {...formItemLayout} {...customLayout}>
                {form.getFieldDecorator(fieldName, {
                    initialValue: initialValue,
                    rules: [{required: required, message: i18n.Err_IsMandatoryField}].concat(extraRules),
                })(
                    inputType === 'textarea' ? <TextArea {...itemProps} /> : <Input {...itemProps}/>
                )}
                {extraContent}
            </FormItem>
        );
    }
}
