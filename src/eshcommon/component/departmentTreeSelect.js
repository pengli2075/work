import React from 'react';
import {TreeSelect} from 'antd';
import LbwJsUtils, {isEmpty} from 'component/LbwJsUtils';
import axiosForCommon from 'component/axiosForCommon';

export default class DepartmentTreeSelect extends React.Component {
    constructor(props) {
        super(props);
        let supplierFactoryFieldName = props.supplierFactoryFieldName === undefined ? 'supplierFactory' : props.supplierFactoryFieldName;
        this.state = {
            allowClear: props.allowClear === undefined ? true : props.allowClear,
            treeData: [],
            isCheckSupplierFactory: props.isCheckSupplierFactory === undefined ? true : props.isCheckSupplierFactory,   // 当不需要验证供应商工厂就查询部门时（false），就表明是获取当前的公司的部门。当为true时，点击部门时验证是否选择了供应商
            supplierFactoryFieldName: supplierFactoryFieldName,                                                         // 供应商工厂标识存储的字段名称
            supplierFactory: props.supplierFactory || (props.form && props.form.getFieldValue(supplierFactoryFieldName)) || '',
            action: props.action || 'getDepartmentListBySupplierFactory',
            defaultDepartmentId: props.defaultDepartmentId || '',
            isNeedClearDepartment: props.isNeedClearDepartment === undefined ? true : props.isNeedClearDepartment,      // 是否需要清空部门 缺省：清空
            isFirst: false,                                                                                             // 标志是否可以setFieldsValue
            isRelyExternalCondition: props.isRelyExternalCondition || false,                                            // 是否依赖外部传入的部门，缺省：不依赖
            isFirstMount: true,     // 标志是否是第一次渲染组件
            treeDefaultExpandAll: props.treeDefaultExpandAll || false,     // 是否默认展开所有树节点
            getPopupContainer: props.getPopupContainer || (() => document.body),            // 菜单渲染父节点
        };
    }

    componentDidMount() {
        let supplierFactory = this.props.supplierFactory;
        if (!this.state.isCheckSupplierFactory) { // 当不需要验证供应商工厂就查询部门时，就表明是获取当前的公司的部门
            if (!supplierFactory) {
                supplierFactory = this.state.supplierFactory;
            }
            this.findDepartmentData(supplierFactory);
        } else {
            if (supplierFactory) {
                this.findDepartmentData(supplierFactory);
            } else {
                this.setState({
                    treeData: []
                });
            }
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        let stateObj = {};
        if (JSON.stringify(nextProps.defaultDepartmentList) !== JSON.stringify(this.props.defaultDepartmentList)) {
            this.findDepartmentData(nextProps.supplierFactory, nextProps.defaultDepartmentList);
        }
        if (nextProps.isCheckSupplierFactory !== this.state.isCheckSupplierFactory) {
            stateObj.isCheckSupplierFactory = nextProps.isCheckSupplierFactory;
        }
        if (nextProps.supplierFactoryFieldName && nextProps.supplierFactoryFieldName !== this.state.supplierFactoryFieldName) {
            stateObj.supplierFactoryFieldName = nextProps.supplierFactoryFieldName;
        }
        // 依赖外部传入部门，需要跟传入的部门保持一致
        if (this.state.isRelyExternalCondition) {
            if (nextProps.defaultDepartmentId !== this.state.defaultDepartmentId && !this.state.isFirst) {
                stateObj.defaultDepartmentId = nextProps.defaultDepartmentId;
            }
        }
        this.setState(stateObj);

        // 如果供应商发生了变化，则清除部门数据
        let supplierFactory = this.props.form ? this.props.form.getFieldValue(this.state.supplierFactoryFieldName) : '' ;
        if (!supplierFactory) { // 获取不到页面“供应商工厂”Lookup的字段值，取传递过来的props.supplierFactory
            supplierFactory = nextProps.supplierFactory || '';
        }
        if (this.state.supplierFactory !== supplierFactory) {
            if (!supplierFactory) { // 供应商工厂为空，清空数据
                this.setState({
                    supplierFactory: '',
                    defaultDepartmentId: '',
                    treeData: []
                });
                if (!this.state.isCheckSupplierFactory) {
                    this.findDepartmentData(supplierFactory);
                }
            } else {
                this.setState({
                    supplierFactory: supplierFactory,
                });
                this.findDepartmentData(supplierFactory);
            }
            this.clearDefaultDepartmentId(supplierFactory);
        } else {
            // 校验供应商
            if (this.state.isCheckSupplierFactory) {
                // 当传入的供应商不变，但部门改变时，按传入部门渲染
                if (this.state.isCheckSupplierFactory && nextProps.defaultDepartmentId && nextProps.defaultDepartmentId != this.state.defaultDepartmentId) {
                    this.setState({
                        defaultDepartmentId: nextProps.defaultDepartmentId,
                        isFirstMount: false
                    });
                }
            } else {
                if (nextProps.defaultDepartmentId && nextProps.defaultDepartmentId != this.state.defaultDepartmentId && (!this.state.isFirst || this.state.isFirstMount)) {
                    // 第一次渲染（isFirstMount=true）更新部门/ 在组件内部修改部门时不更新(isFirst=false)
                    this.setState({
                        defaultDepartmentId: nextProps.defaultDepartmentId,
                        isFirstMount: false
                    });
                }
            }
        }
    }

    /*适用于弹框中部门组件-弹框重新出现时重置部门的*/
    resetIsFirst = (callback) => {
        this.setState({
            isFirst: false
        }, () => {
            callback && callback();
        });
    }

    clearDefaultDepartmentId = (supplierFactory) => {
        // 是否需要清空部门Id --- 风险作业-审批人员，修改供应商工厂后无需清空
        // 重新选择供应商后,清空部门数据
        if (this.state.isNeedClearDepartment) {
            if (this.state.supplierFactory !== supplierFactory) {
                this.setState({
                    defaultDepartmentId: ''
                })
                // 部门清空时，需要清空form域值，设置isFirst标志，true=> 清空，置isFirst为false。选择部门后，置isFirst为true
                if (this.state.isFirst) {
                    if (this.props.form && this.props.fieldName) { // 如果当前form存在
                        let fieldNames = this.props.fieldName.split(',');
                        for (let i = 0; i < fieldNames.length; i++) {
                            if (fieldNames[i]) {
                                this.props.form.setFieldsValue({[fieldNames[i]]: ''});
                            }
                        }
                    }
                    this.setState({
                        isFirst: false
                    })
                }
            }
        }
    }

    // 查找部门
    findDepartmentData(supplierFactory, nextPropsDefaultDepartmentList) {
        if (!this.props.defaultDepartmentList) {
            axiosForCommon(this.state.action, {'supplierFactory': supplierFactory}, (result) => {
                let treeData = [];
                if (result.departmentList && result.departmentList.length > 0) {
                    // 后台格式为{departmentId:'', departmentName: '', subDepartmentList:[]}, 需要转换
                    treeData = this.formatTreeData(result.departmentList);
                }
                this.setState({
                    treeData
                });
            }, error => {
                LbwJsUtils.notification(error);
            });
        } else {
            this.setState({
                treeData: this.formatTreeData(nextPropsDefaultDepartmentList || this.props.defaultDepartmentList)
            })
        }
    }

    // 验证是否需要选择供应商工厂之后再选择部门，并提示
    checkSupplierFactory = () => {
        if (this.state.isCheckSupplierFactory && isEmpty(this.state.supplierFactory) && isEmpty(this.props.supplierFactory)) {
            this.setState({
                treeData: [],
            });
            return LbwJsUtils.notification(i18n.NotSelectSupplierFactoryPleaseSelectSupplier);
        }
    }

    formatTreeData(dataArray) {
        if (!dataArray) {
            return [];
        }
        return this.recursionTreeData(dataArray);
    }

    recursionTreeData(departmentList) {
        if (LbwJsUtils.getObjectType(departmentList) !== 'array' || departmentList.length === 0) {
            return [];
        }
        let treeArray = [];
        let index = 0;
        for (let departmentData of departmentList) {
            let obj = {};
            let departmentId = departmentData.departmentId;
            obj.disabled = departmentId === null ? true : false;
            obj.title = departmentData.departmentName;
            obj.value = !departmentId ? index : departmentId;
            obj.key = !departmentId ? index : departmentId;
            if (departmentData.subDepartmentList || departmentData.departmentList) {
                let children = this.recursionTreeData(departmentData.subDepartmentList || departmentData.departmentList);
                if (children) {
                    obj.children = children;
                }
            }
            treeArray.push(obj);
            index++;
        }
        return treeArray;
    }

    selectedValue(value, label) {
        this.setState({
            defaultDepartmentId: value,
            isFirst: true,                  // 选择部门后，置isFirst为true,标志是否可以setFieldsValue，否则死循环
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
    }

    render() {
        let styleParam = {
            style: this.props.style || {width: '100%'},
            dropdownStyle: this.props.dropdownStyle || null
        };
        return (
            <TreeSelect showSearch={this.props.showSearch === undefined ? true : this.props.showSearch}
                suffixIcon={this.props.suffixIcon}
                filterTreeNode={(input, treeNode) => {
                    return treeNode.props.title.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }}
                value={this.state.defaultDepartmentId || null}
                treeDefaultExpandedKeys={this.state.defaultDepartmentId ? [this.state.defaultDepartmentId] : ''}
                onChange={this.selectedValue.bind(this)}
                allowClear={this.state.allowClear}
                treeData={this.state.treeData}
                placeholder={i18n.EshCommonPleaseSelect}
                onClick={this.checkSupplierFactory}
                getPopupContainer={this.state.getPopupContainer}
                treeDefaultExpandAll={this.state.treeDefaultExpandAll}
                {...styleParam} />
        )
    }
}
