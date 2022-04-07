import React from 'react';
import {Form} from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import {Row, Input} from 'antd';

const FormItem = Form.Item;

export default class TextFind extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            operation: props.operation || 'contains',
            ignoreCase: props.ignoreCase || 'Y',
            required: props.required || false
        };
    }

    render() {
        const arr = ['equals', 'like', 'empty', 'notEqual', 'contains'];
        // $.inArray(this.props.operation, arr);
        if ($.inArray(this.state.operation, arr) < 0) { // 判断输入的operation是否正确
            console.error("operation:['" + this.state.operation + "']有误，可输入的有['equals', 'like', 'empty', 'notEqual', 'contains']");
            return;
        }
        if ($.inArray(this.state.ignoreCase, ['Y', 'N']) < 0) { // 判断输入的operation是否正确
            console.error("ignoreCase:['" + this.state.ignoreCase + "']有误，可输入的有['Y', 'N']");
            return;
        }
        const {getFieldDecorator} = this.props.form;
        const config = {
            initialValue: this.props.defaultValue,
            rules: [{required: this.props.required, message: i18n.CommonRequired}],
        };
        return (
            <div className='data-find'>
                {getFieldDecorator(this.props.name + '_op', {initialValue: this.state.operation})(
                    <Input type='hidden'/>
                )}
                <FormItem {...this.props.formItemLayout} label={this.props.label}>
                    {getFieldDecorator(this.props.name, config)(
                        <Input placeholder={i18n.EshCommonPleaseEnter}/>
                    )}
                </FormItem>
                {getFieldDecorator(this.props.name + '_ic', {initialValue: this.state.ignoreCase})(
                    <Input type='hidden'/>
                )}
            </div>
        );
    }
}