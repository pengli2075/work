/**
 * 公用组件
 * @author: pengli
 */

import React, {useState, useEffect, forwardRef, useRef, useImperativeHandle} from 'react';
import {Radio, Select, Tag} from 'antd';
import {CalendarOutlined} from '@ant-design/icons';
import {Picker, DatePicker, InputItem, Card} from 'antd-mobile';
import zh_CN from 'antd-mobile/lib/date-picker/locale/zh_CN';
import CommonEshIcon from 'component/commonEshIcon';
import {Star, getTimeByMinuteStep} from 'component/LbwJsUtils';
import moment from 'moment';

const dateFormatStr = 'YYYY-MM-DD HH:mm';

// 不可编辑行
export const CommonListItem = ({required, label, content, contentStyles = {}, labelStyles = {}, wrapperStyles = {}, rightContent, extra, onClick}) => {
    return (
        <div className={'em-list-item'} style={{...wrapperStyles}}>
            <div className={'em-list-item-label'} style={{...labelStyles}}>
                <>{required && <Star/>}{label}</>
            </div>
            <div className={'em-list-item-content'} style={{...contentStyles}} onClick={onClick}>
                <div className={'content'} style={rightContent ? {width: 'auto'} : {width: '100%'}}>{content}</div>
                <span style={{lineHeight: '0px'}}>{rightContent}</span>
            </div>
            {
                extra &&
                extra
            }
        </div>
    );
}

// checkboxitem
export const CommonCheckBoxItem = ({label, checked, onClick, isDetail, checkStyles = {}, labelStyles = {}, boxStyles = {}}) => {
    return (
        <div className={'em-check-box'} onClick={!isDetail ? onClick : null} style={{...boxStyles}}>
            {
                checked ?
                    (
                        isDetail ?
                            <CommonEshIcon type={'icon-ehs-check-square check-icon'} style={{...checkStyles}}/>
                            :
                            <CommonEshIcon type={'icon-ehs-checked-square check-icon'} style={{...checkStyles}}/>
                    )
                    :
                    <CommonEshIcon type={'icon-ehs-no-square uncheck-icon'} style={{...checkStyles}}/>
            }
            <span className={'em-check-box-label'} style={{...labelStyles}}>{label}</span>
        </div>
    );
}

// checkbox
export const CommonCheckbox = ({isSelected, disabled}) => {
    if (isSelected) {
        return <i className={`esh-common icon-ehs-checked-square ${disabled ? 'disabled' : ''}`} style={{fontSize: 16}}/>;
    } else {
        return <i className={'esh-common icon-ehs-no-square'} style={{fontSize: 16, color: '#108ee9'}} />;
    }
};
// radio
export const CommonRadio = ({label, checked, onClick, isDetail, checkStyles = {}, labelStyles = {}, styles={}}) => {
    return (
        <div className={'em-radio-box'} onClick={!isDetail ? onClick : null} style={{...styles}}>
            {
                checked ?
                    <CommonEshIcon type={'icon-esh-checked-radio check-icon'} style={{...checkStyles}}/>
                    :
                    <CommonEshIcon type={'icon-esh-unchecked-radio uncheck-icon'} style={{...checkStyles}}/>
            }
            <span className={'em-radio-label'} style={{ ...labelStyles}}>{label}</span>
        </div>
    );
}

/*
* 公用按钮组
* @param: fieldName form绑定字段名
* @param: value     默认值字段
* @param: required  是否是必须验证字段
* @param：onChange  回调事件
*/
export const CommonRadioGroup = (props) => {
    const {styles = {}} = props;
    let radioProps = {
        value: props.value
    }
    if (props.fieldName) {
        radioProps = props.form.getFieldProps(props.fieldName, {
            initialValue: props.value,
            rules: [{required: props.required, message: `请选择${props.label}`}]
        });
    }
    if (props.onChange) {
        radioProps.onChange = (e) => {
            if (props.fieldName) {
                props.form.setFieldsValue({[props.fieldName]: e.target.value});
            }
            props.onChange && props.onChange(e)
        };
    }
    return (
        <div className={'em-radio-group'} style={styles}>
            <Radio.Group {...radioProps}>
                {
                    props.radioList.map((item, index) => {
                        return <Radio key={index} value={item.value} disabled={item.disabled}>{item.label}</Radio>
                    })
                }
            </Radio.Group>
        </div>
    );
}

// 行输入
export const CommonInputListItem = (props) => {
    let inputProps = {value: props.inputvalue};
    if (props.inputkey) {
        inputProps = props.form.getFieldProps(props.inputkey, {
            initialValue: props.inputvalue,
            rules: [{required: props.required, message: props.label ? `${props.itemType === 'picker' ? '请选择' : '请输入'}${props.label}` : '此字段为必须字段'}]
        });
    } else {
        inputProps.onChange = (value) => {
            props.onChange && props.onChange(value)
        };
    }
    inputProps = {...inputProps, ...props}
    let listProps = {...props};
    if (props.itemType === 'picker') {
        let pickerData = inputProps.pickerData;
        delete inputProps.pickerData;
        listProps.rightContent = <span className='clear em-block'>
            {
                pickerData.data ?
                    <Picker
                        value={pickerData.pickerValue}
                        className={'em-picker'}
                        data={pickerData.data}
                        cols={1}
                        onOk={pickerData.onPickerChange}>
                        <CustomChildren callBackBeforeClick={pickerData.callBackBeforeClick} />
                    </Picker>
                    :
                    <span>{pickerData.pickerLabel}</span>
            }
        </span>
    }
    return (
        <CommonListItem
            {...listProps}
            labelStyles={{...(props.labelstyles || {})}}
            content={
                <InputItem
                    autoAdjustHeight={true}
                    className={'em-input em-input-with-extra'}
                    moneyKeyboardAlign='left'
                    {...inputProps}
                    placeholder={props.placeholder ? props.placeholder : i18n.EshCommonPleaseEnter}/>
            }/>
    );
}

// 行选择
export const CommonPickerListItem = (props) => {
    const {labelStyles, wrapperStyles, extraIconStyle, extraTextStyle, extra, value = []} = props;
    return (
        <div className={`${value.length ? 'real-data' : 'placeholder'}`}>
            <CommonListItem
                label={props.label}
                required={props.required}
                labelStyles={{...labelStyles}}
                wrapperStyles={{display: 'flex', alignItems: 'center', ...wrapperStyles}}
                content={
                    <div className='common-item-content'>
                        <div style={{position: 'relative', display: 'inline-block', width: extra ? 'calc(100% - 5px)' : '100%'}}>
                            <Picker
                                data={props.data}
                                className={'em-picker'}
                                onOk={props.onOk}
                                cols={props.cols || 1}
                                value={value}>
                                <CustomChildren
                                    extraIconStyle={{position: 'absolute', right: 0, ...extraIconStyle}}
                                    extraTextStyle={{display: 'inline-block', width: '100%', ...extraTextStyle}}
                                    callBackBeforeClick={props.callBackBeforeClick}
                                    onHandleClick={props.onHandleClick}/>
                            </Picker>
                        </div>
                    </div>
                }
                rightContent={extra}
                contentStyles={{width: '70%'}}
            />
        </div>
    );
};

// 行输入&picker选择
export const CustomChildren = props => {
    const click = props.callBackBeforeClick ? () => props.onHandleClick((param) => {
        if (param) {
            props.onClick();
        }
    }) : props.onClick;
    return (
        <span onClick={click}>
            {
                props.extraTextStyle ?
                    <span style={props.extraTextStyle}>{props.extra}</span>
                    :
                    props.extra
            }
            <i className={'esh-common icon-ehs-right'}
                style={{color: '#bbb', fontSize: 14, ...(props.extraIconStyle || {})}} />
        </span>
    );
};

/**
 * 时间选择
 * 如果包含时间间隔，并且传入了最小时间，则根据最小时间计算整点分的最小时间，重新赋值，如果传入的最小时间刚好是整点分，则不再重新计算
 * 如果包含时间间隔，并且传入了最大时间，则根据最大时间计算整点分的最大时间，重新赋值，如果传入的最大时间刚好是整点分，则不再重新计算
 */
export const CommonDatePickerItem = (props) => {
    const [currentValue, setCurrentValue] = useState(null);
    useEffect(() => {
        if (props.defaultValue) {
            setCurrentValue(new Date(props.defaultValue.replace(/\-/g,"\/")));
        } else {
            setCurrentValue(null)
        }
    }, [props.defaultValue]);
    let pickerProps = {}
    if (props.fieldName) {
        pickerProps = props.form.getFieldProps(props.fieldName, {
            initialValue: currentValue,
            rules: [{required: props.required, message: `请选择${props.message || props.label || props.placeholder}`}]
        })
    }
    
    useImperativeHandle(props.pickerRef, () => ({
        resetValue: () => {
            setCurrentValue('');
        }
    }))

    pickerProps = {...pickerProps, ...props};
    pickerProps.onOk = (val) => {
        setCurrentValue(val);
        props.onOk && props.onOk(val);
    }
    if (props.minuteStep && (props.minDate || props.maxDate)) {
        const pickerPropsMap = getTimeByMinuteStep(props.minuteStep, props.minDate, props.maxDate);
        if (props.minDate) {
            pickerProps.minDate = pickerPropsMap.startTime;
        } else if (props.maxDate) {
            pickerProps.maxDate = pickerPropsMap.endTime;
        }
    }
    return (
        <div className={`${props.bordered ? 'border-date-box' : ''} common-datePicker ${currentValue ? 'real-data' : 'placeholder'}`}>
            <DatePicker
                locale={zh_CN}
                mode={props.mode || 'datetime'}
                {...pickerProps}>
                <CustomDatePickerChildren
                    callBackBeforeClick={props.callBackBeforeClick}
                    onHandleClick={props.onHandleClick}>
                    <div className={'datepicker-value'}>
                        <a className={`${props.disabled ? 'grey ' : ''}date-icon`}>{props.icon || <CalendarOutlined style={{fontSize: 18}}/>}</a>
                        {
                            currentValue ?
                                moment(currentValue).format(props.format || dateFormatStr)
                                :
                                (props.placeholder || '请选择')
                        }
                    </div>
                </CustomDatePickerChildren>
            </DatePicker>
        </div>
    );
}

// picker children
export const CustomDatePickerChildren = props => {
    const click = props.callBackBeforeClick ? () => props.onHandleClick((param) => {
        if (param) {
            props.onClick();
        }
    }) : props.onClick;
    return (
        <span onClick={click}>
            {props.children}
        </span>
    );
};

export class CommonPanel extends React.Component {
    render() {
        const {titleStyles = {}, contentStyles = {}} = this.props;
        return (
            <div>
                <div style={{color: '#1890FF', background: '#d5ebff', height: 36, fontWeight: 'bold', fontSize: 16, padding: '0px 10px', lineHeight: '36px', ...titleStyles}}>{this.props.title}</div>
                <div style={{...contentStyles}}>{this.props.children}</div>
            </div>
        );
    }
}

// 左侧有竖条的导航
export const SubTitleItem = ({title, extra}) => {
    return (
        <div style={{padding: '5px 8px', lineHeight: '25px', position: 'relative', textAlign: 'left'}}>
            <span style={{display: 'inline-block', width: 'calc(100% - 30px)'}}><span style={{
                display: 'inline-block',
                verticalAlign: 'top',
                width: 4,
                background: '#108ee9',
                marginRight: 10,
                height: 16,
                marginTop: 4
            }} />{title}</span>
            <span style={{position: 'absolute', right: 8, top: 7}}>{extra ? extra : null}</span>
        </div>
    );
}

/**
 * 浅蓝底蓝字的panel,不可折叠
 */
export function CommonTitle({title, thumb, extra, thumbStyle, className}) {
    return (
        <Card full className={`${className} em-card`}>
            <Card.Header
                title={title}
                thumb={thumb}
                extra={extra} />
        </Card>
    );
}

export const HiddenInputItem = forwardRef((props, _ref) => {
    return <span style={{display: 'none'}}><InputItem {...props} /></span>;
})

/**
 * 左边显示文字，右边显示图标的列表item
 */
export function TableListItem(props) {
    return <div onClick={props.onClick ? props.onClick : null} className='em-table-box'>
        <span className={'em-table-label'}>{props.label}</span>
        <span className={'em-table-extra'}>
            {
                !!props.extra && props.extra
            }
        </span>
    </div>
}

/**
 * 下拉框
 */
export function CommonSelect(props) {
    let _scrollTop = useRef(null);
    function afterOpen() {
        _scrollTop.current = document.scrollingElement.scrollTop
        document.body.style.position = 'fixed'
        document.body.style.top = -_scrollTop.current + 'px'
    }

    function beforeClose() {
        document.body.style.position = ''
        document.body.style.top = ''
        // 使 scrollTop 恢复原状
        document.scrollingElement.scrollTop = _scrollTop.current
    }

    function onDropdownVisibleChange(open) {
        if (open) {
            afterOpen();
        } else {
            beforeClose();
        }
    }
    return (
        <Select
            {...props}
            placeholder='请选择'
            onDropdownVisibleChange={onDropdownVisibleChange}>
            {props.children}
        </Select>
    );
}

/**
 * 作业负责人标签显示（支持是否可删除）
 */
export const PersonTagContent = (props) => {
    const [isDisplayAllPersonTag, setIsDisplayAllPersonTag] = useState(false);
    let isDisplayCloseAllPersonTag = false;
    function handleDisplayAllPersonTag() {
        setIsDisplayAllPersonTag(true);
    }
    return (
        <div className='tag-wrapper'>
            {
                props.list.map((person, index) => {
                    if (index < 10 || isDisplayAllPersonTag) {
                        return <Tag key={index}
                            visible={true}
                            onClose={() => props.handleDelete(person)}
                            closable={props.closable}>{person.personName || person.partyName}</Tag>
                    } else if (!isDisplayCloseAllPersonTag && !isDisplayAllPersonTag) {
                        isDisplayCloseAllPersonTag = true;
                        return <Tag key={index} onClick={handleDisplayAllPersonTag}>+ {i18n.CommonShowAll}</Tag>
                    }
                })
            }
        </div>
    );
}

