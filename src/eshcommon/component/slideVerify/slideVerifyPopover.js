import React from 'react';
import {Popover} from 'antd';
import SlideVerify from './slideVerify';

export default class slideVerifyPopover extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            curVerifyObj: null,
            visible: false,
            placement: this.props.placement ? this.props.placement : 'top',
            sliderTitle: this.props.sliderTitle ? this.props.sliderTitle : i18n.DefaultSliderVerifyTitle,
            sliderTip: this.props.sliderTip ? this.props.sliderTip : i18n.DefaultSliderVerifyTip,
        }
    }

    handleVisibleChange = (visible) => {
        this.setState({visible});
        if (visible) {
            this.refreshCurVerifyObj();
        }
    }

    setCurVerifyObj(curVerifyObj) {
        this.setState({curVerifyObj: curVerifyObj})
        this.handleVisibleChange(false);
    }

    refreshCurVerifyObj() {
        if (this.state.curVerifyObj) {
            this.state.curVerifyObj.reset();
        }
    }

    successCallbackVerify(isPass) {
        if (this.props.successCallbackVerify) {
            this.props.successCallbackVerify()
        }
    }

    render() {
        return (
            <Popover
                content={<SlideVerify sliderTip={this.state.sliderTip} callback={this.successCallbackVerify.bind(this)}
                    setCurVerifyObj={this.setCurVerifyObj.bind(this)}/>}
                trigger='click'
                title={this.state.sliderTitle}
                placement={this.state.placement}
                visible={this.state.visible}
                onVisibleChange={this.handleVisibleChange}
            >
                {this.props.children}
            </Popover>
        )
    }
}