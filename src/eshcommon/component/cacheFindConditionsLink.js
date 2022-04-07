/**
 * @file:   链接组件：点击时，将当前页面的查找条件保存在 window.history 中
 * @author: zhangyue
 * @param:  href: 要跳转到的链接地址 string
 *          findConditions: 要保存的查找条件 object
 *          content: 要显示的链接文字 string || ReactNode
 */

import React from 'react';
import {Button} from 'antd-mobile';
import {history, Link} from 'umi';
export default class CacheFindConditionsLink extends React.Component {

    setHistoryData = () => {
        const {findConditions, beforeLink} = this.props;
        let beforeLinkReturn = true;
        // 如果跳转之前有验证，调用它，如果返回false，不继续执行
        if (beforeLink) {
            beforeLinkReturn = beforeLink();
        }
        if (beforeLinkReturn === false) {
            return;
        }
        // 写入滚动高度和所在页数
        findConditions.scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        let w_history = window.history;
        if (w_history.replaceState) {
            w_history.replaceState({findConditions}, 'findConditions');
        }
    }

    handleClickLink = () => {
        this.setHistoryData();
        const {href} = this.props;
        history.push(href || '/');
    }

    render() {
        const {openhref, btnType = '', content} = this.props;
        if (btnType.includes('mobile-')) {
            return (
                <Button onClick={this.handleClickLink}
                    type={btnType.includes('-primary') ? 'primary' : ''}>{this.props.content}</Button>
            );
        }
        return (
            <>
                {
                    openhref ?
                    <Link to={(location) => {
                        this.setHistoryData();
                        return {...location, pathname: openhref};
                    }} target='_blank'>{content}</Link>
                    :
                    <a onClick={this.handleClickLink}>{content}</a>
                }
            </>
        );
    }
}