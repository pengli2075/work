/**
 * @file: iconfont-图标引入
 * @author: pengli
 * 注释：图标更新后重新替换scriptUrl
 * 使用：<CommonEshIcon type={'icon-ehs-clock'} />
 *
 */

import React from 'react';

const CommonEshIcon = (props) => {
    return <i className={`esh-common ${props.type}`} {...props}/>
};

export default CommonEshIcon;
