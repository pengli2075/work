/**
 * @file: 添加成功提示页面
 * @author: longyangyang
 */

import '@ant-design/compatible/assets/index.css';
import { Card, Button } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { history } from 'umi';

/**
 * 
 * @param {} props {backHref: 返回页面href, returnPage: 返回页面提示, successPrompt: 添加成功提示文字, AddAgainHref: 再次添加跳转页面href(可选，若有则显示再次添加按钮), callBack: 跳转到原链接的话使用callBack刷新页面}
 * @returns 
 */
export default function SuccessContent(props) {
    const [count, setCount] = useState(10);
    useEffect(() => {
        let timeInterval = setInterval(() => {
            setCount((preCount) => {
                if (preCount === 1) {
                    clearInterval(timeInterval);
                }
                return preCount - 1;
            });
        }, 1000);
        return () => clearInterval(timeInterval);
    }, []);
    useEffect(() => {
        if (count === 0) {
            if (props.callBack) {
                props.callBack();
            } else {
                history.push(props.backHref);
            }
        }
    }, [count])
    return (
        <Card>
            <div style={{ textAlign: 'center', marginTop: 80 }}>
                <CheckCircleFilled style={{ color: '#52C41A', fontSize: 70 }} />
            </div>
            <div style={{ fontSize: 24, textAlign: 'center', marginTop: 20 }}>
                {props.successPrompt}
            </div>
            <div style={{ fontSize: 14, color: '#8C8C8C', textAlign: 'center', marginTop: 10 }}>
                {i18n.TenSecReturnPage.replace('#0#', props.returnPage).replace('#1#', count)}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Button
                    style={{ marginRight: 10 }}
                    type='primary'
                    onClick={() => {
                        props.callBack ? props.callBack('back') : history.push(props.backHref);
                    }}
                >
                    {i18n.BackToList}
                </Button>
                {props.AddAgainHref && (
                    <Button
                        type='danger'
                        onClick={() => {
                            if (props.callBack) {
                                props.callBack('addAgain');
                            } else {
                                history.push(props.AddAgainHref);
                            }
                        }}
                    >
                        {i18n.AddAgain}
                    </Button>
                )}
            </div>
        </Card>
    );
}
