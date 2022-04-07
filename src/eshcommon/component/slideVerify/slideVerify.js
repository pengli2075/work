import React from 'react';

require(`./slideVerify.css`);
require(`./slideFunction.js`);

export default class SlideVerify extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    componentDidMount() {
        let _this = this;
        verifyCanvas.init({
            el: this.verify,
            onSuccess: (obj) => {
                _this.props.callback();
                _this.props.setCurVerifyObj(obj);
            },
            onFail: () => {
            },
            onRefresh: () => {
            },
            sliderTip: this.props.sliderTip
        })
    }

    loadVerify() {
    }

    render() {
        return (
            <div ref={(e) => {
                this.verify = e;
            }} />
        )
    }
}