/**
 * @file:   详情中的一条内容
 * @author: zhangyue
 */

import React from 'react';
import {Col, Form} from 'antd';
const FormItem = Form.Item;
const formItemLayout = {
    wrapperCol: {span: 17},
    labelCol: {span: 7},
};

export default class DetailItem extends React.Component {
    render() {
        const {label, content, uom, span = 8, colLayout = {}, className = '', customLayout = {}, formClassName = ''} = this.props;
        return (
            <Col span={span} {...colLayout} className={'common-detail ' + className}>
                <FormItem {...formItemLayout} {...customLayout} label={label} className={formClassName}>
                    {content}{`${content && uom ? ` ${uom}` : ''}`}
                </FormItem>
            </Col>
        );
    }
}
