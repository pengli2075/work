/**
 * @file:   公用组件-hook
 * @author: pengli
 *
 */

import React, {useState, useRef, useEffect, createContext} from 'react';
import {Col, DatePicker, Form, Input, Row, Tooltip} from 'antd';
import moment from 'moment';
import {InfoCircleOutlined} from '@ant-design/icons';
import './css/indexStyle.css';

const FormItem = Form.Item;
const formatDay = 'YYYY-MM-DD';
const formatTime = 'YYYY-MM-DD HH:mm:ss';

/**
 * 处理时间参数-将时间类型转为字符串
 * @param parameters
 * @param format
 */
export function handleParametersTime(parameters, format = formatDay) {
    for (let key in parameters) {
        if (key.indexOf('_fld0_value') > -1 || key.indexOf('_fld1_value') > -1) {
            if (parameters[key]) {
                parameters[key] = moment(parameters[key]).format(format);
            } else {
                parameters[key] = '';
            }
        }
    }
    return parameters;
}

/**
 * 时间范围选择
 * @param name 字段名称（传入后台为[name]_fld0_value）
 * @param format 时间格式
 * @param defaultBeginDate 缺省开始时间
 * @param requiredBegin 开始时间是否必须
 * @param defaultEndDate 缺省结束时间
 * @param requiredEnd 结束时间是否必须
 * @param layout 显示样式，缺省两行显示
 * @param showTime 是否显示时间
 */
export function CommonDateFind({name, format, defaultBeginDate, requiredBegin, defaultEndDate, requiredEnd, layout, showTime}) {
    let _format = showTime ? formatTime : formatDay;
    format = format || _format;

    const configBegin = defaultBeginDate ? {
        initialValue: defaultBeginDate,
        rules: [{type: 'object', required: requiredBegin, message: i18n.CommonRequired}],
    } : {
        rules: [{type: 'object', required: requiredBegin, message: i18n.CommonRequired}]
    };
    const configEnd = defaultEndDate ? {
        initialValue: defaultEndDate,
        rules: [{type: 'object', required: requiredEnd, message: i18n.CommonRequired}],
    } : {
        rules: [{type: 'object', required: requiredEnd, message: i18n.CommonRequired}]
    };
    const startRender = <FormItem name={`${name}_fld0_value`} {...configBegin}>
        <DatePicker style={{width: '100%'}}
            format={format}
            showTime={showTime}
            placeholder={i18n.Date_Begin}/>
    </FormItem>;
    const endRender = <FormItem name={`${name}_fld1_value`} {...configEnd}>
        <DatePicker style={{width: '100%'}}
            format={format}
            showTime={showTime}
            placeholder={i18n.Date_End}/>
    </FormItem>;
    return (
        <div className={'date-find-block'}>
            <FormItem style={{display: 'none'}} name={`${name}_fld0_op`} initialValue={'greaterThanEqualTo'} />
            <FormItem style={{display: 'none'}} type={'hidden'} name={`${name}_fld1_op`} initialValue={'lessThanEqualTo'} />
            {
                layout === 'inline' ?
                    <Row>
                        <Col span={12}>{startRender}</Col>
                        <Col span={12}>{endRender}</Col>
                    </Row>
                    :
                    <>
                        {startRender}
                        {endRender}
                    </>
            }
        </div>
    );
}

CommonDateFind.defaultProps = {
    layout: 'vertical',
    push: 0,
    pull: 0,
    requiredBegin: false,
    requiredEnd: false,
    showTime: false
};

export function CommonTextFind({operation, ignoreCase, defaultValue, required, name}) {
    const arr = ['equals', 'like', 'empty', 'notEqual', 'contains'];
    if ($.inArray(operation, arr) < 0) { // 判断输入的operation是否正确
        console.error("operation:['" + operation + "']有误，可输入的有['equals', 'like', 'empty', 'notEqual', 'contains']");
        return;
    }
    if ($.inArray(ignoreCase, ['Y', 'N']) < 0) { // 判断输入的operation是否正确
        console.error("ignoreCase:['" + ignoreCase + "']有误，可输入的有['Y', 'N']");
        return;
    }
    const config = {
        initialValue: defaultValue,
        rules: [{required: required, message: i18n.CommonRequired}],
    };
    return (
        <div className={'date-find-block'}>
            <FormItem style={{display: 'none'}} name={`${name}_op`} initialValue={operation} />
            <FormItem style={{display: 'none'}} name={`${name}_ic`} initialValue={ignoreCase} />
            <FormItem name={name} {...config}>
                <Input placeholder={i18n.EshCommonPleaseEnter}/>
            </FormItem>
        </div>
    );
}

CommonTextFind.defaultProps = {
    operation: 'contains',
    ignoreCase: 'Y',
    required: false
};

/**
 * 错误提示
 */
export function ErrorIcon({errorMsg, color}) {
    return (
        <Tooltip title={errorMsg}>
            <InfoCircleOutlined
                className={'ant-Row-item error-icon'}
                style={{
                    cursor: 'pointer',
                    marginRight: '4px',
                    display: errorMsg ? 'inline-block' : 'none',
                    color: color || '#f04134',
                    fontSize: 14
                }} />
        </Tooltip>
    );
}

/**
 * 自定义table分页hooks：支持分页的表格；都有共同的页码切换和页数切换功能，修改后重新获取数据
 * @param total
 * @param paginationChange
 * @returns {{pagination: {current: *, total: *, pageSizeOptions: string[], onChange: pagination.onChange, showTotal: (function(*): *), pageSize, showQuickJumper: boolean, showSizeChanger: boolean}}}
 */
export function useCustomTable(total, paginationChange) {
    const [viewIndex, setViewIndex] = useState(0);
    const [viewSize, setViewSize] = useState(20);
    return {
        pagination: {
            current: viewIndex + 1,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (_total) => `${i18n.EshCommonTotal.replace('#0#', _total)}`,
            pageSize: viewSize,
            pageSizeOptions: ['20', '30', '50', '100', '200'],
            onChange: (_viewIndex, _viewSize) => {
                setViewIndex(_viewIndex - 1);
                setViewSize(_viewSize);
                paginationChange(_viewIndex - 1, _viewSize);
            },
        }
    }
}

/**
 * useState 回调
 * const [test, setTest] = useCallbackState()
 * setTest(data, () => {})
 */
function useCallbackState (param) {
    const callBackRef = useRef();
    const [data, setData] = useState(param);

    useEffect(() => {
        callBackRef.current && callBackRef.current(data);
    }, [data]);

    return [data, function (newData, callback) {
        callBackRef.current = callback;
        setData(newData);
    }];
}
export {useCallbackState};

// 向下箭头
export const VerticalArrow = (props) => {
    return (
        <div className={`vertical-arrow ${props.classname}`}>
            <div className='line' />
            <div className='arrow' />
        </div>
    );
};

// 水平向右的箭头
export const HorizontalArrow = () => {
    return (
        <div className='horizontal-arrow'>
            <div className='line' />
            <div className='arrow' />
        </div>
    );
};

export function combineReducers(reducers) { //整合reducer函数的对象的函数
    return function (state = {}, action) { //返回一个整合之后的reducer函数，在dispatch的时候执行对应的
        // newState 保存所有新的子状态的容器对象
        return Object.keys(reducers).reduce((newState, key) => {
            newState[key] = reducers[key](state[key], action[key] === undefined ? state[key] : action[key]); // 得到新的子状态，赋值给对应的key的新state里面
            return newState;
        }, {});
    }
}

export const PageContext = createContext({});


export const useUnload = fn => {
    const callback = useRef(fn);

    useEffect(() => {
        callback.current = fn;
    }, [fn]);

    useEffect(() => {
        window.noBunloadPromptFlag = false;
        const onUnload = (...args) => {
            if (!callback.current?.()) {
                if (!window.noBunloadPromptFlag) {
                    return 'change';
                }
            }
            window.noBunloadPromptFlag = false;
        }
        window.onbeforeunload = onUnload;
        return () => window.onbeforeunload = null;
    }, []);
};


