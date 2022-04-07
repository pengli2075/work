/**
 * @file:   多供应商选择模块-一般放在页面顶部显示，未选择时页面上提示请选择供应商工厂
 * supplierFactor optional：false
 * @author: pengli
 *
 */

import React from 'react';
import {FrownOutlined} from '@ant-design/icons';
import {Form} from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import {Row, Col, Input} from 'antd';
import Lookup_supplierFactory from 'lookup/supplierFactory';

const formItemLayout = {
    labelCol: {span: 7},
    wrapperCol: {span: 12},
};

export default class supplierFactorySelectWithLookup extends React.Component {
    render() {
        const {
            callBack = () => {
            }
        } = this.props;
        const {getFieldDecorator} = this.props.form;
        let supplierFactory = this.props.form.getFieldValue('supplierFactory');
        return (
            <div>
                <Row style={!supplierFactory ? {borderBottom: '1px solid #e8e8e8'} : {}}>
                    <Col span={8} style={{margin: '10px 0 0 0'}}>
                        <Form.Item label={i18n.SupplierFactory} {...formItemLayout}>
                            {getFieldDecorator('supplierFactory', {
                                initialValue: ownerSupplierFactoryId ? ownerSupplierFactoryId : defSelectSupplierFactory,
                                rules: [{required: hasMultipleSupplierFactories, message: i18n.Err_IsMandatoryField}],
                            })(
                                <Input size='default' style={{display: 'none'}}/>
                            )}
                            <Lookup_supplierFactory form={this.props.form} fieldName='supplierFactory'
                                callBack={callBack}/>
                        </Form.Item>
                    </Col>
                </Row>
                {
                    !supplierFactory && <h4 className='container6'>
                        <div className='inner6'><FrownOutlined/> {i18n.PleaseSelectSupplierFactory}
                        </div>
                    </h4>
                }
            </div>
        );
    }
}