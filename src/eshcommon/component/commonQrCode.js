/**
 * @file: 二维码生成
 * @author: pengli 
 */

import React from 'react';
import * as QrCode from 'qrcode.react'

class CommonQrCode extends React.Component {
    _canvas = null;

    getCanvas = () => {
        let canvas = document.getElementById(this.props.id);
        this._canvas = canvas;
        return this._canvas
    }

    /**
     * 转成图片
     * @return {[type]} [description]
     */
    getDataURL = () => {
        if (!this._canvas) {
            this._canvas = this.getCanvas();
        }
        return this._canvas.toDataURL();
    }

    render() {
        const {value, size, id} = this.props;
        return (
            <QrCode
                {...this.props} />
        );
    }
}

CommonQrCode.defaultProps = {
    size: 125,
    id: 'qrcode-container',
    value: ''
}

export default CommonQrCode;