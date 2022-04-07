import React from 'react'
import {Input, DatePicker, Row, Col} from 'antd';

export default class DateFind extends React.Component {
    render() {
        // 默认为垂直排列， 如果要在同一行显示则设置 layout = 'inline'
        // 如果要移动第二个输入框的位置，push 栅格向右移动格数    number ；pull 栅格向左移动格数    number
        const {getFieldDecorator} = this.props.form;
        const configBegin = this.props.defaultBeginDate ? {
            initialValue: this.props.defaultBeginDate,
            rules: [{type: 'object', required: this.props.requiredBegin, message: i18n.CommonRequired}],
        } : {
            rules: [{type: 'object', required: this.props.requiredBegin, message: i18n.CommonRequired}]
        };
        const configEnd = this.props.defaultEndDate ? {
            initialValue: this.props.defaultEndDate,
            rules: [{type: 'object', required: this.props.requiredEnd, message: i18n.CommonRequired}],
        } : {
            rules: [{type: 'object', required: this.props.requiredEnd, message: i18n.CommonRequired}]
        };
        return (
            <div className='data-find'>
                {
                    this.props.layout == 'inline' ?
                        <Row>
                            <Input
                                type='hidden' {...getFieldDecorator(this.props.name + '_fld0_op', {initialValue: 'greaterThanEqualTo'})} />
                            <Input
                                type='hidden' {...getFieldDecorator(this.props.name + '_fld1_op', {initialValue: 'lessThanEqualTo'})} />
                            <Col span={12}>
                                {getFieldDecorator(this.props.name + '_fld0_value', configBegin)(
                                    <DatePicker style={{width: '100%'}} showTime={this.props.showTime}
                                        format={this.props.showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'}
                                        placeholder={i18n.Date_Begin}/>
                                )}
                            </Col>
                            <Col span={12} push={this.props.push} pull={this.props.pull}>
                                {getFieldDecorator(this.props.name + '_fld1_value', configEnd)(
                                    <DatePicker style={{width: '100%'}} showTime={this.props.showTime}
                                        format={this.props.showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'}
                                        placeholder={i18n.Date_End}/>
                                )}
                            </Col>
                        </Row>
                        :
                        <div>
                            <Input
                                type='hidden' {...getFieldDecorator(this.props.name + '_fld1_op', {initialValue: 'lessThanEqualTo'})} />
                            <Input
                                type='hidden' {...getFieldDecorator(this.props.name + '_fld0_op', {initialValue: 'greaterThanEqualTo'})} />
                            {getFieldDecorator(this.props.name + '_fld0_value', configBegin)(
                                <DatePicker style={{width: '100%'}} showTime={this.props.showTime}
                                    format={this.props.showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'}
                                    placeholder={i18n.Date_Begin}/>
                            )}
                            {getFieldDecorator(this.props.name + '_fld1_value', configEnd)(
                                <DatePicker style={{width: '100%'}} showTime={this.props.showTime}
                                    format={this.props.showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'}
                                    placeholder={i18n.Date_End}/>
                            )}
                        </div>
                }
            </div>
        )
    }
}
DateFind.defaultProps = {
    layout: 'vertical',
    push: 0,
    pull: 0,
    requiredBegin: false,
    requiredEnd: false
};
