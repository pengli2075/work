/**
 * @file:   不支持当前浏览器版本提示语
 * @author: xu.niwei
 * @param:  tip 提示语句
 */

import React from 'react';

export default class NotSupportedBrowserTip extends React.Component {

    render() {
        const {tip} = this.props
        return (
            <div>
                <a style={{verticalAlign: 'middle'}}>
                    <span className='esh-common icon-ehs-prompt'
                        style={{width: 18, height: 18, display: 'inline-block', marginRight: 5, cursor: 'default'}} />
                </a>
                <span>{tip}</span>
            </div>
        );
    }
}