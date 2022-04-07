/**
 * @file:   点击缩放组件
 * @author: pengli
 *
 */

import React from 'react';
import { CaretDownOutlined, ReloadOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { Popover, Tooltip } from 'antd';
import './zoomBox.css';


const zoomIndexList = [{title: '25%', index: 0.25}, {title: '50%', index: 0.5}, {title: '100%', index: 1}, {title: '200%', index: 2}, {title: '400%', index: 4}];

export default class ZoomBox extends React.Component{
    render() {
        const {zoom, zoomInOrOut, restoreRatio, customStyles = {}} = this.props;
        return (
            <div>
                <div className={'fixed-scale-block'} style={customStyles}>
                    <Tooltip placement='top' title={i18n.EshCommonRestore}>
                        <span onClick={restoreRatio}><ReloadOutlined /></span>
                    </Tooltip>
                    <Tooltip placement='top' title={i18n.EshCommonZoomIn}>
                        <span onClick={() => zoomInOrOut(2)}><ZoomInOutlined /></span>
                    </Tooltip>
                    <Tooltip placement='top' title={i18n.EshCommonZoomOut}>
                        <span onClick={() => zoomInOrOut(0.5, 'in')}><ZoomOutOutlined /></span>
                    </Tooltip>

                    <Popover overlayClassName={'padding-pop'} content={
                        <div className={'tag-select-block'}>
                            {
                                zoomIndexList.map(item => <div key={item.index} onClick={() => zoomInOrOut(item.index, true)}>{item.title}</div>)
                            }
                        </div>
                    } placement='top'>
                        <span style={{fontSize: 14}}>{zoom ? (Number(zoom) * 100).toFixed(0) : 100}%<CaretDownOutlined /></span>
                    </Popover>
                </div>
            </div>
        );
    }
}