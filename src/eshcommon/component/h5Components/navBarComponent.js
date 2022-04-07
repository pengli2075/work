/**
 * @file:   导航
 * @author: pengli
 */

import React from 'react';
import {NavBar} from 'antd-mobile';
import FaceTimeComponent from './faceTimeComponent';

export default class NavBarComponent extends React.Component {
    render() {
        return (
            <>
                <NavBarContent {...this.props} />
                {
                    this.props.showFacetime &&
                    <FaceTimeComponent  />
                }
            </>
        );
    }
}

class NavBarContent extends React.Component {
    render() {
        return (
            <div>
                <NarBarItem {...this.props} />
                <div style={{paddingTop: 45}}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

class NarBarItem extends React.Component {
    handleLeftClick = () => {
        history.back();
    }

    render() {
        const {mode = 'dark', icon, showLeft = history.length > 1 ? true : false, rightContent, title, onLeftClick, className, leftContent} = this.props;
        return (
            <NavBar
                className={className}
                mode={mode}
                icon={showLeft && (icon || <i className={'esh-common icon-ehs-left'} />)}
                onLeftClick={() => showLeft ? (onLeftClick ? onLeftClick() : this.handleLeftClick()) : null}
                rightContent={rightContent}
                leftContent={showLeft ? leftContent: null}
            >
                <span>{title}</span>
            </NavBar>
        );
    }
}
