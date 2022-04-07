/**
 * @author: pengli
 * canvasId: 页面中必须唯一
 */
import React from 'react';
import ZoomBox from './zoomBox';

class CanvasIndex extends React.Component {
    zoomInOrOut = (factor, flag) => {
        let CANVAS = this.props.CANVAS;
        let context = CANVAS.canvas_context;
        let scale = context.getScale();
        if (scale < 0.5 && flag === 'in') {
            return;
        }
        this.props.handleZoom && this.props.handleZoom();
        // 固定指数缩放(flag && flag !== 'in')
        let _factor = (flag && flag !== 'in') ? (factor / scale) : factor;
        CANVAS.zoom(0, null, _factor);
    }

    restoreRatio = () => {
        this.props.handleZoom && this.props.handleZoom();
        let CANVAS = this.props.CANVAS;
        CANVAS.restoreRatio();
    }

    render() {
        const {canvasId, style, factor, zommBoxStyles = {}} = this.props;
        return (
            <div style={{position: 'relative'}}>
                <canvas ref={'canvasBox'} tabIndex='1' id={`canvas${canvasId}`} style={{
                    outline: 'none',
                    border: '1px solid #eee',
                    width: this.props.width,
                    height: this.props.height,
                    ...style,
                }} />
                {
                    this.props.isNeedScale &&
                        <ZoomBox
                            customStyles={zommBoxStyles}
                            zoomInOrOut={this.zoomInOrOut}
                            zoom={factor}
                            restoreRatio={this.restoreRatio} />
                }
            </div>
        );
    }
}

CanvasIndex.defaultProps = {
    height: document.body.clientHeight || document.documentElement.clientHeight,
    width: document.body.clientWidth || document.documentElement.clientWidth,
    canvasId: 100,
    isNeedScale: true
}
export default CanvasIndex;