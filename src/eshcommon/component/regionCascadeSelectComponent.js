import React from 'react';
import {Cascader} from 'antd';
import LbwJsUtils from 'component/LbwJsUtils';

/**
 * 属性：
 * callBack 用户点击地区回调函数
 * value 设置的值， 必须是数组 Cascader 值为数组与其保持统一
 * regionLevel 缺省为 0：无限制 1：国家 2：省/直辖市 3：市 4:区/县 5：城镇 6:街道
 *      Notice:目前系统只有部分地区支持到城镇
 *      TODO:目前调试到4（区/县）
 * hasDefaultValue: 是否拥有默认值， 默认为true 见TODO
 * displayMode : 是否显示全部（eg:full:中国/安徽/芜湖, simple: 芜湖） default:full
 *      Notice : 如果是不常用的格式， 建议diplayMode 通过传递函数实现
 * 内置：
 * option 默认为系统配置 目前是：中国， 美国!
 * 地区级联选择器
 *
 * author: QiangChao
 * TODO: 由于在编辑页面，需要使用value, 由于需要查询该值所在及上级的所有Option 和现有的点击事件查询冲突，
 *      所以使用hasDefaultValue 区分
 */
export default class RegionCascadeSelect extends React.Component {
    // 初始化
    state = {
        visible: false,
        value: this.props.value || this.props.defaultValue || [],
        options: [],
        callBack: this.props.callBack,
        regionLevel: this.props.regionLevel || 0,
        allowClear: this.props.allowClear === undefined ? true : this.props.allowClear,
        hasDefaultValue: this.props.hasDefaultValue == undefined ? true : false, // deprecated
        displayMode: this.props.displayMode == undefined ? 'full' : this.props.displayMode,
        topGeoIds: this.props.topGeoIds ? this.props.topGeoIds : "CHN",
        topGeoIdSubFlag: this.props.topGeoIdSubFlag != undefined ? this.props.topGeoIdSubFlag : false,
    }

    UNSAFE_componentWillMount() {
        this.defaultValue(this.state.value[0])
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        // 如果当前的value 有值， 表示已经手动选择过了， 不再进行修改
        if (JSON.stringify(this.props.value) !== JSON.stringify(nextProps.value)) {
            this.defaultValue(nextProps.value);
        }
    }

    triggerChange(value) {
        // Should provide an event to pass value to Form.
        const onChange = this.props.onChange;
        if (onChange) {
            onChange(value);
        }
    }

    // 改变
    changeCountry = (value, selectedOptions) => {
        const _this = this;
        this.setState({value: value});
        this.triggerChange(value)
        if (typeof this.state.callBack == 'function') {
            this.state.callBack(value, selectedOptions);
        }
        this.loadData(value[value.length - 1], selectedOptions[selectedOptions.length - 1], _this)
    }

    loadData(geoId, targetObj, _this) {
        // 如果geoId 不存在， 或者 目标对象有子集（表示该地区已经查询过， 不需要查询了）
        if (!geoId || typeof (geoId) != 'string' || targetObj.children) {
            return;
        }
        $.post('getSubAdminRegionListOfGeoId', {
            "geoId": geoId,
            regionLevel: _this.state.regionLevel
        }, function (result) {
            if (isJsonResponseError(result)) {
                LbwJsUtils.notification(result);
            } else {
                let options = _this.state.options;
                let stateList = result.resultList;
                if (stateList.length == 0) {
                    return;
                }
                // 当有数据的时候， 添加children
                targetObj.children = [];
                for (let value of stateList) {
                    let obj = {};
                    obj.value = value.geoId
                    obj.label = value.geoName;
                    obj.isLeaf = false;
                    targetObj.children.push(obj);
                }
                // Notice:不是没有赋值到options！！targetObj既options中的对象
                _this.setState(options)
            }
        });
    }

    defaultValue(geoId) {
        let parameters = {topGeoIds: this.state.topGeoIds, topGeoIdSubFlag: this.state.topGeoIdSubFlag};
        if (LbwJsUtils.getObjectType(geoId) == 'array' && this.props.regionLevel == geoId.length) {
            this.setState({value: geoId});
            return;
        }
        if (geoId) {
            if (LbwJsUtils.getObjectType(geoId) == 'array') {
                parameters.geoId = geoId[geoId.length - 1]
            } else {
                parameters.geoId = geoId;
            }
        }
        $.post('getFullOptionsByGeoId', parameters, function (result) {
            if (isJsonResponseError(result)) {
                LbwJsUtils.notification(result);
            } else {
                this.setState({options: result.allOptions, value: result.defaultValues});
                // this.triggerChange(result.defaultValues)
            }
        }.bind(this));
    }

    // 选择后展示的方式
    displayText(label, selectedOptions) {
        if ('full' == this.state.displayMode) {
            return label.join('/')
        }
        if ('simple' == this.state.displayMode) {
            return label.pop()
        }
    }

    render() {
        let styleParam = {
            style: this.props.style,
        };
        return (
            <Cascader
                allowClear={this.state.allowClear}
                value={this.state.value}
                {...styleParam}
                displayRender={(label, selectedOptions) => this.displayText(label, selectedOptions)}
                placeholder={i18n.EshCommonPleaseSelect}
                options={this.state.options}
                changeOnSelect={true}
                loadData={this.loadData}
                onChange={this.changeCountry.bind(this)}
            />
        );
    }

}