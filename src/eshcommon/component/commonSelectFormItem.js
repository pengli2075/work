/**
 * @file:   下拉框 formitem
 * @author: zhangyue
 */

import React from 'react';
import {Select} from 'antd';
import {Form} from '@ant-design/compatible';

const FormItem = Form.Item;
const Option = Select.Option;
const formItemLayout = {labelCol: {span: 7}, wrapperCol: {span: 12}};

export default class CommonSelectFormItem extends React.Component {
    render() {
        const {form, label, fieldName, required, optionList, initialValue, onFocus, valueKey, labelKey, allowClear, onBlur, disabled,
            customLayout = {}, dropdownClassName = ''} = this.props;
        return (
            <FormItem label={label} {...formItemLayout} {...customLayout}>
                {form.getFieldDecorator(fieldName, {
                    initialValue: initialValue,
                    rules: [{required: required, message: i18n.Err_IsMandatoryField}],
                })(
                    <Select
                        dropdownClassName={dropdownClassName}
                        disabled={disabled}
                        placeholder={i18n.EshCommonPleaseSelect}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        allowClear={allowClear}
                    >
                        {
                            optionList.map((item, index) => {
                                return <Option key={index} value={item[valueKey || 'value']}>{item[labelKey || 'label']}</Option>;
                            })
                        }
                    </Select>
                )}
            </FormItem>
        );
    }
}
