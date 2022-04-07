/**
 * @file:   颜色选择弹框
 * @author: zhangyue
 * @param:  visible            boolean    是否显示弹框
 *          initColor          string     初始色号（可以为空）'#000000'
 *          onCancel           function   取消弹框的方法
 *          confirmSelectColor fundtion   确认的方法 
 *          type               string     config:地图配置使用
 *
 * 引用时，需在.ftl文件里加入 <#include "/esh/webapp/esh/includes/colorSkethDefaultColorList.ftl">
 */

import React from 'react';
import {Form} from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import {Button, Modal} from 'antd';
import {SketchPicker} from 'react-color';
import NotSupportedBrowserTip from 'component/notSupportedBrowserTip';

const FormItem = Form.Item;
const formItemLayout = {labelCol: {span: 6}, wrapperCol: {span: 18}};
const reIE = new RegExp('MSIE (\\d+\\.\\d+);');
reIE.test(navigator.userAgent);
const isOldIE = parseFloat(RegExp['$1']) <= 10;

export default class ColorSketchModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            initColor: props.initColor || ''
        };
    }

    // 保存选中的色号: HEX Color 格式 #000000
    handleChangeColor = (color) => {
        this.setState({initColor: color.hex});
    }

    // 将色号返回给调用本组件的文件
    confirmSelectColor = () => {
        if (this.props.confirmSelectColor) {
            this.props.confirmSelectColor(this.state.initColor);
        }
    }

    render() {
        const {onCancel, visible, type, colorList} = this.props;
        const initColor = this.state.initColor;
        let config = {
            type: 'Sketch',
            disableAlpha: true,
            color: initColor
        }
        if (type === 'config' && isNotEmpty(colorList)) {
            // 配置颜色多于16种，只取前16种
            config.presetColors = colorList;
            if (colorList.length > 16) {
                config.presetColors = colorList.slice(0, 16);
            }
        } else if (type !== 'config') {
            config.presetColors = defaultColorList;
        }
        if (!isOldIE) {
            return (
                <Modal
                    onCancel={onCancel}
                    visible={visible}
                    width={500}
                    footer={
                        <div>
                            <Button type='primary' size='default' onClick={onCancel}>{i18n.CommonCancel}</Button>
                            <Button type='primary' size='default' disabled={!initColor}
                                onClick={this.confirmSelectColor}>{i18n.Confirm}</Button>
                        </div>
                    }
                >

                    <FormItem {...formItemLayout} label={i18n.EshCommonColorCode}>
                        <Button type='primary' style={{backgroundColor: initColor}} />
                    </FormItem>
                    <div style={{marginLeft: '25%'}}>
                        <SketchPicker
                            {...config}
                            onChange={this.handleChangeColor}
                        />
                    </div>
                </Modal>
            );
        } else {
            return (
                <Modal
                    onCancel={onCancel}
                    visible={visible}
                    width={500}
                    footer={null}>
                    <div style={{padding: '0 10px'}}>
                        <NotSupportedBrowserTip tip={i18n.ColorSketchNotSupportedBrowserTip}/>
                        <div style={{textAlign: 'right'}}>
                            <Button type='primary' size='default'
                                onClick={() => this.props.confirmSelectColor()}>{i18n.Confirm}</Button>
                        </div>
                    </div>
                </Modal>
            );
        }
    }
} 