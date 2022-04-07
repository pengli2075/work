/**
 * @file:   顶部tab菜单-切换
 * @author: pengli
 *  title:              tab 标题
 *  iconName:           图表名称
 *  href:               跳转链接
 *  isHasPermission:    是否有权限访问
 *  renderBody:         component
 */

import React from 'react';
import {Tabs} from 'antd';

const TabPane = Tabs.TabPane;

export default class HomeMenuComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeKey: props.activeKey
        };
    }

    // 生成标签头部
    createTabTitleComponent = (tabIndex) => {
        const {tabArray, tabOriginStyle} = this.props;
        let tab = tabArray[tabIndex];
        let tabTitleComponent = '';
        let titleText = tab.title, iconName = tab.iconName, href = tab.href;
        if (tabOriginStyle === 'Y') {
            return tab.title;
        }
        tabTitleComponent = <span style={{display: 'inline-block', textAlign: 'center', padding: '0 10px', fontSize: 17}}>
            {
                iconName &&
                                    <span className={`esh-common ${iconName}`} style={{marginRight: 10, verticalAlign: 'middle'}} />
            }
            <span style={{verticalAlign: 'middle', fontWeight: 700}}>{titleText}</span>
        </span>;
        if (href) {
            tabTitleComponent = <a href={href} className='tabTitle'>{tabTitleComponent}</a>;
        }
        return tabTitleComponent;
    }

    render() {
        const {activeKey, tabArray, tabsType, className} = this.props;
        return (
            <div style={{position: 'relative'}}>
                <Tabs activeKey={activeKey} type={tabsType || 'line'} className={className} onChange={this.props.onTabsChange} onTabClick={this.props.onTabClick} animated={false}>
                    {
                        tabArray.map((tab, index) => {
                            return (
                                tab.isHasPermission &&
                                    <TabPane tab={this.createTabTitleComponent(index)} key={index}>
                                        {tab.renderBody}
                                    </TabPane>
                            );
                        })
                    }
                </Tabs>
            </div>
        );
    }
}
