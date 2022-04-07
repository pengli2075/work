/**
 * @author: xuniwei
 * @file: 公用组件 半常量树形选择
 * @param: semiConstantType: 半常量类型(必须)
 * @param: defaultSemiConstantId: 半常量默认值
 */

import React from 'react';
import {TreeSelect} from 'antd';
import LbwJsUtils from 'component/LbwJsUtils';
import axiosForCommon from 'component/axiosForCommon';

const TreeNode = TreeSelect.TreeNode;

export default class CommonSemiConstantTreeSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            defaultSemiConstantId: props.defaultSemiConstantId || '',
            treeData: [],
        };
        this._scrollTop = 0;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.defaultSemiConstantId !== prevProps.defaultSemiConstantId) {
            this.setState({
                defaultSemiConstantId: this.props.defaultSemiConstantId
            });
        }
        if (this.props.supplierFactory !== prevProps.supplierFactory) {
            this.getSemiConstantListBySemiConstantType();
        }
    }

    componentDidMount() {
        this.getSemiConstantListBySemiConstantType();
    }

    // 根据半常量类型获取数据源
    getSemiConstantListBySemiConstantType() {
        let semiConstantType = this.props.semiConstantType; // 事故类型半常量类型
        if (semiConstantType) {
            let action = this.props.action || 'getSemiConstantListBySemiConstantType';
            let params = {semiConstantType};
            if (this.props.checkSupplierFactory && !this.props.supplierFactory) {
                return;
            } else {
                if (this.props.supplierFactory) {
                    params.supplierFactory = this.props.supplierFactory;
                }
            }
            axiosForCommon(action, params, (result) => {
                let semiConstantList = result.semiConstantList || [];
                this.setState({
                    treeData: semiConstantList
                })
            }, error => {
                LbwJsUtils.notification(error);
            });
        }
    }

    clearRecord = () => {
        this.setState({
            defaultSemiConstantId: ''
        });
        if (this.props.form && this.props.fieldName) { // 如果当前form存在
            let fieldNames = this.props.fieldName.split(',');
            for (let i = 0; i < fieldNames.length; i++) {
                if (fieldNames[i]) {
                    this.props.form.setFieldsValue({[fieldNames[i]]: ''});
                }
            }
        }

        // 如果设置了回调函数， 则触发使用回调函数，设置部门标识
        if (this.props.callBack) {
            this.props.callBack({});
        }
    }

    renderTreeNodes = (data) => {
        return data.map((item) => {
            let _item = {
                key: item.semiConstantId,
                value: item.semiConstantId,
                title: item.semiConstantNameLocale || item.semiConstantName,
            }
            // 判断当前是否可选中
            if (this.props.disabledKeys && this.props.disabledKeys.includes(_item.key)) {
                _item.disabled = true;
            } else {
                _item.disabled = false;
            }
            // 如果其他的父级是当前的key
            if (isNotEmpty(item.semiConstantList)) {
                return (
                    <TreeNode {..._item} dataRef={item}>
                        {this.renderTreeNodes(item.semiConstantList)}
                    </TreeNode>
                );
            }
            return <TreeNode {..._item} />;
        });
    }

    selectedValue = (value, label) => {
        this.setState({
            defaultSemiConstantId: value
        });
        if (this.props.form && this.props.fieldName) { // 如果当前form存在
            let fieldNames = this.props.fieldName.split(',');
            for (let i = 0; i < fieldNames.length; i++) {
                if (fieldNames[i]) {
                    this.props.form.setFieldsValue({[fieldNames[i]]: value});
                }
            }
        }

        // 如果设置了回调函数， 则触发使用回调函数，设置部门标识
        if (this.props.callBack) {
            this.props.callBack(value, label[0]);
        }
    };

    onDropdownVisibleChange = (open) => {
        if (this.props.isMobileBrowser) {
            if (open) {
                this.afterOpen();
            } else {
                this.beforeClose();
            }
        }
        this.props.onDropdownVisibleChange && this.props.onDropdownVisibleChange();
    }

    afterOpen = () => {
        this._scrollTop = document.scrollingElement.scrollTop;
        document.body.style.position = 'fixed'
        document.body.style.top = -this._scrollTop + 'px'
    }

    beforeClose = () => {
        document.body.style.position = ''
        document.body.style.top = ''
        // 使 scrollTop 恢复原状
        document.scrollingElement.scrollTop = this._scrollTop
    }

    render() {
        const {defaultSemiConstantId, treeData} = this.state;
        const {allowClear = true, style, showSearch = true} = this.props;
        let styleParam = {
            style: style || {width: '100%'}
        };
        return (
            <TreeSelect showSearch={showSearch}
                filterTreeNode={(input, treeNode) => {
                    return treeNode.props.title.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                }}
                value={defaultSemiConstantId || undefined}
                onChange={this.selectedValue}
                allowClear={allowClear}
                onDropdownVisibleChange={this.onDropdownVisibleChange}
                placeholder={i18n.EshCommonPleaseSelect}
                {...styleParam}>
                {this.renderTreeNodes(treeData || [])}
            </TreeSelect>

        );
    }
}