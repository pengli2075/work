/**
 * @file:   自定义弹框元素
 * @author: pengli
 * 支持追加到某个元素上
 */

import React from 'react';
import ReactDOM from 'react-dom';

class CommonModalComponent extends React.Component {
    constructor(props) {
        super(props)
        this.node = document.createElement('div');
        let body = props.container || document.body;
        body.appendChild(this.node);
    }

    render() {
        const {children, containerId} = this.props;
        return ReactDOM.createPortal(
            <div id={containerId || 'tag-block'}>{children}</div>,
            this.node,
        );
    }
}

export default CommonModalComponent
