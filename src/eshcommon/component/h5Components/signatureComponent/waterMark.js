/**
 * @file:   水印
 * @author: pengli
 *
 */

import React, {useRef, useEffect} from 'react';

let body = document.documentElement || document.body;

export default function WaterMarker(props) {
    const tempCanvas = useRef(null);

    useEffect(() => {
        const {text, canvasProps} = props;
        if (!text) return;
        let _canvas = tempCanvas.current;
        let context = _canvas.getContext('2d');
        let width = canvasProps.width, height = canvasProps.height, rotate = -20;
        let ismanuallandscape = canvasProps.orientation === 'landscape' && canvasProps.transformtype === 'manual';
        if (ismanuallandscape) {
            rotate -= 90;
        }

        let fontWeight = 'normal', fontSize = 22, fontFamily = 'sans-serif', opacity = 0.2, fontColor = '#000';

        // 绘制之前清除画布
        context.save();
        context.clearRect(0, 0, width, height);
        // 设置透明度
        context.globalAlpha = opacity;
        // 设置字体
        context.font = `normal ${fontWeight} ${fontSize}px '${fontFamily}'`;
        context.textAlign = 'center';
        let maxSize = Math.max(body.clientWidth, body.clientHeight)

        // 设置旋转角度
        context.translate(parseFloat(`${maxSize}`) / 2, parseFloat(`${maxSize}`) / 2);
        context.rotate(rotate * (Math.PI / 180));
        context.translate(-parseFloat(`${maxSize}`) / 2, -parseFloat(`${maxSize}`) / 2);

        // 设置字体颜色
        context.fillStyle = fontColor;

        // 获取文本的最大宽度以及文案
        let maxText = '';
        const textList = Array.isArray(text) ? text : [text];
        const widthList = textList.map(item => context.measureText(item).width);
        const maxWidth = Math.max(...widthList);
        const index = widthList.indexOf(maxWidth);

        if (index !== -1) {
            maxText = textList[index];
        }

        // 文案宽度大于画板宽度
        if (maxWidth > width) {
            context.font = `normal ${fontWeight} ${width / maxText.length}px '${fontFamily}'`;
        }
        let spaceY = 120, spaceX = maxWidth + 100, numberX = 0, numberY = 0;
        while ((numberX + 1) * spaceX < maxSize || (numberY + 1) * spaceY < maxSize) {
            context.fillText(maxText, numberX * spaceX + (spaceX / 2), numberY * spaceY + (spaceY / 2));
            if ((numberX + 1) * spaceX > maxSize) { // 横向超出范围
                numberY++;
                numberX = 0;
            } else {
                numberX++;
            }
        }
        context.restore();
    }, [props.canvasProps.orientation, props.canvasProps.transformtype]);

    return (
        <div style={{position: 'relative', height: 'calc(100% - 44px)'}}>
            {
                props.text &&
                <canvas ref={tempCanvas} style={{position: 'absolute'}} {...props.canvasProps} {...{className: `${props.canvasProps.className} temp-signature`}} />
            }
            {props.children}
        </div>
    );
}