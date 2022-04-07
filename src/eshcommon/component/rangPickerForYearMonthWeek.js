/**
 * @file:   公用组件：三级时间范围选择（年度-月度-周度）
 * @author: zhangyue
 */

import React from 'react';
import moment from 'moment';
import {Row, Select, DatePicker, Radio} from 'antd';
import '../../includes/rangPickerForYearMonthWeek.css';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button
const Option = Select.Option;
const {MonthPicker, WeekPicker} = DatePicker;
const fullDateFormat = 'YYYY-MM-DD';

export default class RangPickerForYearMonthWeek extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            timeRange: 'year',                                          // 当前选中的控件类型
            fromDate: moment().startOf('year').format(fullDateFormat),  // 当前选中的开始时间
            endDate: moment().endOf('year').format(fullDateFormat),     // 当前选中的结束时间
        };
        // 年份下拉框最早年份，默认显示到 2000 年
        this.defaultFromYear = props.defaultFromYear || 2000;
        // 年份下拉框最晚年份，默认显示到 当前 年
        this.defaultEndYear = props.defaultEndYear || parseInt(moment().format('YYYY'));
        let yearList = [];
        for (let i = this.defaultFromYear; i <= this.defaultEndYear; i++) {
            yearList.push(i);
        }
        // 年份下拉框数组
        this.yearList = yearList;
    }

    // 开始日期
    handleFromDateChange = (e, flag) => {
        let weekOfday = moment(e).format('E');    // 计算被点击的是这周第几天
        let weekStart = moment(e).subtract(weekOfday - 1, 'days').format(fullDateFormat); // 当周的周一日期
        let fromDate = flag === 'year' ? `${e}-01-01` : flag === 'month' ? e.format(fullDateFormat) : weekStart;
        if (e != null) {
            this.setState({
                fromDate: fromDate
            }, () => {
                this.props.handleRangeChange({
                    fromDate: fromDate,
                    endDate: this.state.endDate,
                    timeRange: this.state.timeRange
                });
            });
        }
    }

    // 结束日期
    handleEndDateChange = (e, flag) => {
        let weekOfday = moment(e).format('E');   // 计算被点击的是这周第几天
        let weekEnd = moment(e).add(7 - weekOfday, 'days').format(fullDateFormat);    // 当周的周日日期
        let endDate = flag === 'year' ? `${e}-12-31` : flag === 'month' ? moment(e).endOf('month').format(fullDateFormat): weekEnd;
        if (e != null) {
            this.setState({
                endDate: endDate
            }, () => {
                this.props.handleRangeChange({
                    fromDate: this.state.fromDate,
                    endDate: endDate,
                    timeRange: this.state.timeRange
                });
            });
        }
    }

    // 设置日期选择控件的禁用区间
    setDisabledDate = (date, pickerType) => {
        const {fromDate, endDate} = this.state;
        if (pickerType === 'start') {
            return date > moment(endDate);
        } else {
            return date < moment(fromDate);
        }
    }

    // 年度、月度、周度切换
    handleChange = (e) => {
        this.setState({
            timeRange: e.target.value
        }, () => {
            if (this.state.timeRange == 'week') {
                this.getWeekData();
            } else if (this.state.timeRange == 'month') {
                this.getMonthData();
            } else {
                this.getYearData();
            }
        });
    };

    // 获取年度数据
    getYearData = () => {
        const fromDate = moment().startOf('year').format(fullDateFormat);
        const endDate = moment().endOf('year').format(fullDateFormat);
        this.setState({
            fromDate: fromDate,
            endDate: endDate,
        }, () => {
            this.props.handleRangeChange({fromDate: fromDate, endDate: endDate, timeRange: this.state.timeRange});
        });
    }

    // 获取月度数据
    getMonthData = () => {
        const fromDate = moment().startOf('month').format(fullDateFormat);
        const endDate = moment().endOf('month').format(fullDateFormat);
        this.setState({
            fromDate: fromDate,
            endDate: endDate,
        }, () => {
            this.props.handleRangeChange({fromDate: fromDate, endDate: endDate, timeRange: this.state.timeRange});
        });
    };

    // 获取周度数据
    getWeekData = () => {
        let weekOfday = moment().format('E');   // 计算今天是这周第几天
        let fromDate = moment().subtract(weekOfday - 1, 'days').format(fullDateFormat); // 周一日期
        let endDate = moment().add(7 - weekOfday, 'days').format(fullDateFormat);       // 周日日期
        this.setState({
            fromDate: fromDate,
            endDate: endDate,
        }, () => {
            this.props.handleRangeChange({fromDate: fromDate, endDate: endDate, timeRange: this.state.timeRange});
        });
    };


    render() {
        const {timeRange, fromDate, endDate} = this.state;
        return (
            <div style={{float: 'right'}}>
                <Row style={{marginBottom: 5}}>
                    <RadioGroup onChange={this.handleChange} className='range-picker-btngroup'>
                        <RadioButton size='small' value='year'
                            type={timeRange === 'year' ? 'danger' : ''}>{i18n.EshCommonYear}</RadioButton>
                        <RadioButton size='small' value='month'
                            type={timeRange === 'month' ? 'danger' : ''}>{i18n.EshCommonMonth}</RadioButton>
                        <RadioButton size='small' value='week'
                            type={timeRange === 'week' ? 'danger' : ''}>{i18n.EshCommonWeek}</RadioButton>
                    </RadioGroup>
                    {
                        timeRange === 'year' &&
                        <span>
                            <Select
                                className='range-picker-select'
                                style={{width: 100, margin: '0 3px'}}
                                value={fromDate.split('-')[0]}
                                onChange={(e) => this.handleFromDateChange(e, 'year')}>
                                {
                                    this.yearList.map((year, yIndex) => {
                                        return <Option key={yIndex} value={year}
                                            disabled={year > moment(endDate).format('YYYY')}>{year}</Option>;
                                    })
                                }
                            </Select>
                            <Select
                                style={{width: 100}}
                                value={endDate.split('-')[0]}
                                onChange={(e) => this.handleEndDateChange(e, 'year')}
                            >
                                {
                                    this.yearList.map((year, yIndex) => {
                                        return <Option key={yIndex} value={year}
                                            disabled={year < moment(fromDate).format('YYYY')}>{year}</Option>;
                                    })
                                }
                            </Select>
                        </span>
                    }
                    {
                        timeRange === 'month' &&
                        <span>
                            <MonthPicker
                                style={{width: 100, margin: '0 3px'}}
                                allowClear={false}
                                onChange={(e) => this.handleFromDateChange(e, 'month')}
                                disabledDate={(e) => this.setDisabledDate(e, 'start')}
                                value={moment(fromDate)}
                                size='small'
                            />
                            <MonthPicker
                                style={{width: 100}}
                                allowClear={false}
                                onChange={(e) => this.handleEndDateChange(e, 'month')}
                                disabledDate={(e) => this.setDisabledDate(e, 'end')}
                                value={moment(endDate)}
                                size='small'
                            />
                        </span>
                    }
                    {
                        timeRange === 'week' &&
                        <span>
                            <WeekPicker
                                style={{width: 100, margin: '0 3px'}}
                                allowClear={false}
                                onChange={(e) => this.handleFromDateChange(e, 'week')}
                                disabledDate={(e) => this.setDisabledDate(e, 'start')}
                                value={moment(fromDate)}
                                size='small'
                            />
                            <WeekPicker
                                style={{width: 100}}
                                allowClear={false}
                                onChange={(e) => this.handleEndDateChange(e, 'week')}
                                disabledDate={(e) => this.setDisabledDate(e, 'end')}
                                value={moment(endDate)}
                                size='small'
                            />
                        </span>
                    }
                </Row>
                <Row style={{textAlign: 'right'}}>
                    <span className='selected-date-text'>{fromDate}<span className='date-text-center'>~</span></span>
                    <span className='selected-date-text'>{endDate}</span>
                </Row>
            </div>
        );
    }
}