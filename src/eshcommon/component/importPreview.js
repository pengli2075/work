import React from 'react';
import {CloseCircleOutlined, LeftCircleOutlined, RightCircleOutlined, VerticalAlignBottomOutlined, PlusOutlined} from '@ant-design/icons';
import {Icon as LegacyIcon} from '@ant-design/compatible';
import {Card, Popconfirm, Button, Table, Tooltip, Upload} from 'antd';
import LbwJsUtils from 'component/LbwJsUtils';
import {ErrorIcon} from 'component/index';
import axiosForCommon from 'component/axiosForCommon';
import {history} from 'umi';

/*
需要传入的参数
action: 提交调用的url
href: 提交成功后跳转的链接
dataMap: 提交需要的参数
dataSource: table 数据
columns: table 列
columns: [{
    title: '张三',
    dataIndex: 'name',
    key: 'name',
    keyRender: (props) => {
        const { text, record, index } = props;
        return <span>{text}</span>
    },
    editRender: (props) => {
        const { text, record, index } = props;
        return <Input defaultValue={text}/>
    }
}]
keyRender: 详情情况下的列样式
editRender: 编辑情况下的列样式
如果两者有一个或者都没传，显示默认渲染情况
importCardExtra: Card顶部的extra的内容，不传则不显示该项内容
showNotification: 当 href 为 false, 且 showNotification 为 true，保存成功后不跳转，只显示保存成功的提示信息并清空表格数据
*/

// 一页显示的条数
const pageSize = 10;
window.theAmountSaved = 0;
export default class ImportPreview extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            loading: false,
            data: props.dataSource,
            columns: props.columns,
            pageList: [],
            tableColumns: [],
            tableData: [],
            selectThisPage: 1,
            dataSize: 0,
            tableLoading: true,
            itemSelectIndex: null,  // 选中的数据下标
            fileList: [],
        };
    }

    processingData = (data) => {
        // 如果有传值进来，说明是willRecieveProps调用该方法，使用新值计算，否则使用state中的值
        let dataSource = data ? data : this.state.data;
        let pageList = [];
        let ListSize = Math.ceil(dataSource.length / pageSize);
        let selectThisPage = this.state.selectThisPage;
        let tableData = [];
        for (let i = 1; i <= ListSize; i++) {
            let viewStartSize = (i - 1) * pageSize; // 重新计算开始条数
            let viewEndSize = i * pageSize;
            let pageData = [];
            pageData = dataSource.slice(viewStartSize, viewEndSize);
            pageList.push(this.setButtonPage(pageData, selectThisPage, i));
            if (selectThisPage == i) {
                tableData = dataSource.slice(viewStartSize, viewEndSize);
            }
        }
        let columns = this.state.columns;
        let tableColumns = [];
        tableColumns.push({
            dataIndex: 'key',
            render: (text, record, index) => {
                return (
                    <Popconfirm title={i18n.DeleteConfirmation} onConfirm={() => this.deleteRow(record.key)}
                        okText={i18n.Confirm} onCancel={this.stopPop} cancelText={i18n.CommonCancel}>
                        <a onClick={this.stopPop}>
                            <CloseCircleOutlined className='iconfont' title={i18n.CommonDelete}/>
                        </a>
                    </Popconfirm>
                );
            }
        });
        for (let column of columns) {
            let tabObj = column;
            let KeyRender = column['keyRender']; // 详情情况下的数据渲染,如果没有传，则默认显示文字标签
            let EditRender = column['editRender']; // 编辑情况下的数据渲染,如果没有传，则默认显示文字标签
            tabObj['render'] = (text, record, index) => {
                const editable = this.isEditing(record);
                let tabComponent = '';
                {/* 如果有编辑样式并且是编辑情况，显示编辑样式, 否则显示详情情况或者默认情况 */
                }
                if (editable) {
                    if (EditRender) {
                        tabComponent = <EditRender text={text} record={record} index={index}/>;
                    } else if (KeyRender) {
                        tabComponent = <KeyRender text={text} record={record} index={index}/>;
                    } else {
                        tabComponent = text;
                    }
                } else if (KeyRender) {
                    tabComponent = <KeyRender text={text} record={record} index={index}/>;
                } else {
                    tabComponent = text;
                }
                return (
                    <div className='manager-middle' key={record.key.toString()}>
                        {
                            record[column.dataIndex + 'Error'] &&
                            <ErrorIcon errorMsg={record[column.dataIndex + 'Error']}/>
                        }
                        {tabComponent}
                    </div>
                );
            };
            tableColumns.push(tabObj);
        }
        let stateObj = {
            tableColumns: tableColumns,
            pageList: pageList,
            tableData: tableData,
            dataSize: dataSource.length,
            tableLoading: false,
            selectThisPage: selectThisPage,
        };
        if (data) {
            stateObj.data = data;
        }
        this.setState(stateObj);
    }

    // 处理数据生成table数据，colums
    componentDidMount() {
        this.processingData();
    }

    UNSAFE_componentWillReceiveProps(nextProps) { // 每次数据有改变则调用该方法
        if (nextProps.supplierFactory !== this.props.supplierFactory || (nextProps.dataSource && nextProps.dataSource.length > 0)) {
            this.processingData(nextProps.dataSource);
        }
    }

    // 重置数据
    resetDataSource = () => {
        this.setState({
            data: [],
            pageList: [],
            tableData: [],
            selectThisPage: 1,
            dataSize: 0,
            itemSelectIndex: null
        });
    }

    deleteRow(editingKey) { // 删除一行
        let dataSource = this.state.data;
        let index = dataSource.findIndex(item => editingKey === item.key);
        if (index > -1) {
            let selectThisPage = this.state.selectThisPage;
            dataSource.splice(index, 1);
            let tableData = [];
            let pageList = [];
            let listSize = Math.ceil(dataSource.length / pageSize);
            if (listSize < selectThisPage) {
                selectThisPage = listSize;
            }
            for (let i = 1; i <= listSize; i++) {
                let viewStartSize = (i - 1) * pageSize; // 重新计算开始条数
                let viewEndSize = i * pageSize;
                let pageData = [];
                pageData = dataSource.slice(viewStartSize, viewEndSize);
                pageList.push(this.setButtonPage(pageData, selectThisPage, i));
                if (selectThisPage == i) {
                    tableData = dataSource.slice(viewStartSize, viewEndSize);
                }
            }
            this.setState({
                pageList: pageList,
                dataSize: dataSource.length,
                itemSelectIndex: null,
                tableLoading: false,
                selectThisPage: selectThisPage,
                tableData: tableData,
                editingKey: '',
            })
        }
    }

    // 下一页
    nextPage() {
        let dataSource = this.state.data;
        if (dataSource.length == 0) {
            return;
        }
        let selectThisPage = this.state.selectThisPage;
        let ListSize = Math.ceil(dataSource.length / pageSize);
        if (selectThisPage == ListSize) {
            LbwJsUtils.notification(i18n.EshCommonAlreadyLastPage);
            return;
        } else {
            let viewStartSize = (selectThisPage) * pageSize; // 重新计算开始条数
            let viewEndSize = (selectThisPage + 1) * pageSize;
            let pageList = this.state.pageList;
            let pageData = dataSource.slice(viewStartSize, viewEndSize);
            let selectviewStartSize = (this.state.selectThisPage - 1) * pageSize; // 重新计算开始条数
            let selectviewEndSize = this.state.selectThisPage * pageSize;
            let selectpageData = dataSource.slice(selectviewStartSize, selectviewEndSize);
            pageList.splice(this.state.selectThisPage - 1, 1, this.setButtonPage(selectpageData, selectThisPage + 1, this.state.selectThisPage))
            pageList.splice(selectThisPage, 1, this.setButtonPage(pageData, selectThisPage + 1, selectThisPage + 1))
            this.setState({
                tableData: pageData,
                pageList: pageList,
                selectThisPage: selectThisPage + 1,
                editingKey: '',
                dataSize: dataSource.length,
                tableLoading: true
            }, () => {
                this.setState({
                    tableLoading: false
                })
            })
        }
    }

    // 上一页
    previousPage() {
        let dataSource = this.state.data;
        let selectThisPage = this.state.selectThisPage;
        if (selectThisPage == 1) {
            LbwJsUtils.notification(i18n.EshCommonAlreadyFirstPage);
            return;
        } else {
            let viewStartSize = (selectThisPage - pageSize) * pageSize; // 重新计算开始条数
            let viewEndSize = (selectThisPage - 1) * pageSize;
            let pageList = this.state.pageList;
            let pageData = dataSource.slice(viewStartSize, viewEndSize);
            let selectviewStartSize = (this.state.selectThisPage - 1) * pageSize; // 重新计算开始条数
            let selectviewEndSize = this.state.selectThisPage * pageSize;
            let selectpageData = dataSource.slice(selectviewStartSize, selectviewEndSize);
            pageList.splice(this.state.selectThisPage - 1, 1, this.setButtonPage(selectpageData, selectThisPage - 1, this.state.selectThisPage))
            pageList.splice(selectThisPage - 2, 1, this.setButtonPage(pageData, selectThisPage - 1, selectThisPage - 1))
            this.setState({
                tableData: pageData,
                pageList: pageList,
                selectThisPage: selectThisPage - 1,
                editingKey: '',
                dataSize: dataSource.length,
                tableLoading: true
            }, () => {
                this.setState({
                    tableLoading: false
                })
            })
        }
    }

    pageJump(page) { // 页面跳转
        let dataSource = this.state.data;
        let viewStartSize = (page - 1) * pageSize; // 重新计算开始条数
        let viewEndSize = page * pageSize;
        let pageList = this.state.pageList;
        let pageData = dataSource.slice(viewStartSize, viewEndSize);
        let selectviewStartSize = (this.state.selectThisPage - 1) * pageSize; // 重新计算开始条数
        let selectviewEndSize = this.state.selectThisPage * pageSize;
        let selectpageData = dataSource.slice(selectviewStartSize, selectviewEndSize);
        pageList.splice(this.state.selectThisPage - 1, 1, this.setButtonPage(selectpageData, page, this.state.selectThisPage))
        pageList.splice(page - 1, 1, this.setButtonPage(pageData, page, page));
        this.setState({
            tableData: pageData,
            pageList: pageList,
            selectThisPage: page,
            editingKey: '',
            dataSize: dataSource.length,
            tableLoading: true
        }, () => {
            this.setState({
                tableLoading: false
            }, () => {
                // 把当前所在页数返回给调用该组件的页面
                if (this.props.pageJump) {
                    this.props.pageJump(page);
                }
            });
        });
    }

    setButtonPage(pageData, selectThisPage, page) {
        let hasErrorPageString = this.hasErrorPage(pageData);
        if (selectThisPage == page) { // 当前页没有错， 并且是当前选中页
            let borderStyle = hasErrorPageString ? '1px solid red' : '1px solid green';
            return (
                <Tooltip key={page + 'Tooltip'} title={hasErrorPageString ? hasErrorPageString : ''}>
                    <Button key={page + 'Button'}
                        size='small'
                        style={{marginLeft: '5px', color: hasErrorPageString ? 'red' : 'green', border: borderStyle}}
                        onClick={() => this.pageJump(page)}>
                        <LegacyIcon style={{color: hasErrorPageString ? 'red' : 'green'}}
                            type={hasErrorPageString ? 'close-circle' : 'check-circle'}/>
                        {i18n.EshCommonPage.replace('#0#', page)}
                    </Button>
                </Tooltip>
            );
        } else { // 当前页没有错， 并且不是当前选中页
            return (
                <Tooltip key={page + 'Tooltip'}
                    title={hasErrorPageString ? hasErrorPageString : ''}>
                    <Button key={page + 'Button'}
                        type='primary'
                        size='small'
                        style={{marginLeft: '5px'}}
                        onClick={() => this.pageJump(page)}>
                        <LegacyIcon type={hasErrorPageString ? 'close-circle' : 'check-circle'}
                            style={{color: hasErrorPageString ? 'red' : 'green'}}/>
                        {i18n.EshCommonPage.replace('#0#', page)}
                    </Button>
                </Tooltip>
            );
        }
    }

    // 阻止冒泡行为
    stopPop = (e) => {
        e.preventDefault();
        e.stopPropagation();
    }

    hasErrorPage(pageData) { // 该页是否存在错误数据
        let index = 0;
        for (let pagedataMap of pageData) {
            for (let key in pagedataMap) {
                if (key.indexOf('Error') != -1) {
                    if (pagedataMap[key]) {
                        return `${i18n.EshCommonError_ImportRowNumber.replace('#0#', (index + 1))}${pagedataMap[key]}`
                    }
                }
            }
        }
        return '';
    }

    handleSubmit = () => {
        this.setState({
            loading: true,
            tableLoading: true
        });
        let dataSource = this.state.data;
        let pageData = dataSource.slice(0, pageSize);
        let parameters = this.props.dataMap;
        parameters.jsonString = JSON.stringify(pageData);
        parameters.webappName = 'ehsp';
        axiosForCommon(this.props.action, parameters, (result) => {
            if (isJsonResponseError(result)) {
                this.setState({loading: false, tableLoading: false, selectThisPage: 1});
                if (this.props.callBack) {
                    if (result.validedResultList) {
                        dataSource.splice(0, pageSize);
                        dataSource = result.validedResultList.concat(dataSource);
                        this.props.callBack(dataSource);
                    } else {
                        this.props.callBack(dataSource)
                    }
                }
                let errorMessageList = [];
                if (window.theAmountSaved !== 0) {
                    errorMessageList.push(i18n.TheDataSavedTip.replace('#0#', window.theAmountSaved));
                    window.theAmountSaved = 0;
                }
                errorMessageList.push(result._ERROR_MESSAGE_);
                LbwJsUtils.notification({_ERROR_MESSAGE_LIST_: errorMessageList});
            } else {
                if (result.isError) {
                    let resultData = result.data;
                    LbwJsUtils.notification(i18n.CheckThetEhsPermitData);
                    let pageList = [];
                    dataSource.splice(0, pageSize);
                    for (let map of dataSource) {
                        resultData.push(map);
                    }
                    let selectThisPage = 1;
                    let listSize = Math.ceil(resultData.length / pageSize);
                    let tableData = [];
                    for (let i = 1; i <= listSize; i++) {
                        let viewStartSize = (i - 1) * pageSize; // 重新计算开始条数
                        let viewEndSize = i * pageSize;
                        let pageData = [];
                        pageData = resultData.slice(viewStartSize, viewEndSize);
                        pageList.push(this.setButtonPage(pageData, 1, i));
                        if (selectThisPage == i) {
                            tableData = resultData.slice(viewStartSize, viewEndSize);
                        }
                    }
                    if (this.props.callBack) {
                        this.props.callBack(resultData)
                    }
                    this.setState({
                        loading: false,
                        tableLoading: false,
                        pageList: pageList,
                        tableData: tableData,
                        dataSize: resultData.length,
                        data: resultData,
                        selectThisPage: selectThisPage,
                    });
                } else {
                    window.theAmountSaved += pageSize;
                    dataSource.splice(0, pageSize);
                    this.setState({
                        data: dataSource
                    }, () => {
                        if (dataSource.length > 0) {
                            this.handleSubmit();
                        } else {
                            if (this.props.showInfoAfterSubmit && this.props.href) {
                                LbwJsUtils.notification(result, () => history.push(this.props.href));
                            } else if (this.props.href) {
                                history.push(this.props.href);
                            } else {
                                let stateObj = {
                                    loading: false,
                                    tableLoading: false,
                                };
                                // 当 href 为空, 且 showNotification 为 true，保存成功后不跳转，只显示保存成功的提示信息并清空表格数据
                                if (this.props.showNotification) {
                                    LbwJsUtils.notification(result);
                                    this.processingData();
                                    stateObj.data = [];
                                    stateObj.tableData = [];
                                }
                                this.setState(stateObj);
                            }
                        }
                    });
                }
            }
        }, error => {
            this.setState({loading: false, tableLoading: false});
            LbwJsUtils.notification(error);
        });
    }

    giveUpTheImport = () => {  // 放弃本次导入
        let {href, showModalAfterGiveup, giveupCallback} = this.props;
        if (showModalAfterGiveup && giveupCallback) {
            giveupCallback();
        } else if (href) {
            history.push(href);
        } else {
            this.setState({
                data: [],
                tableData: []
            });
            this.processingData([]);
            if (this.props.compareBeforeLeave) {
                this.props.callBack([]);
            }
        }
    }

    isEditing = record => record.key === this.state.editingKey;

    tableClickEvent = (record, index, e) => {
        e.stopPropagation();
        this.setState({editingKey: record.key, itemSelectIndex: index});
    }

    render() {
        const {tableData, tableColumns, tableLoading, fileList} = this.state;
        let uploadProps = {
            showUploadList: false,
            fileList: fileList,
            onRemove: file => {
                this.setState(state => {
                    const index = state.fileList.indexOf(file);
                    const newFileList = state.fileList.slice();
                    newFileList.splice(index, 1);
                    return {
                        fileList: newFileList,
                    };
                });
            },
            beforeUpload: file => {
                // 上传之前限制上传文件大小
                let fileSize = file.size;
                if (fileSize > 16 * 1024 * 1024) {  // 限制16M
                    LbwJsUtils.notification('error', i18n.EshFileMustSmallerThan + '16MB!');
                    return false;
                }
                this.setState({fileList: [file]}, () => {
                    this.props.handleImport(this.state.fileList);
                });
                return false;
            },
        };
        return (
            <div>
                <Card extra={this.props.importCardExtra || null} className='esh-antd-card-5'>
                    <div style={{lineHeight: '28px'}}>
                        <Button ghost
                            size='small'
                            style={{color: '#1890FF', border: '1px solid #1890FF'}}
                            onClick={() => this.previousPage()}>
                            <LeftCircleOutlined/>
                            {i18n.EshCommonPreviousPage}
                        </Button>
                        <Button ghost
                            size='small'
                            style={{marginLeft: '5px', color: '#1890FF', border: '1px solid #1890FF'}}
                            onClick={() => this.nextPage()}>
                            {i18n.EshCommonNextPage}
                            <RightCircleOutlined/>
                        </Button>
                        <span key='pageList'>{this.state.pageList}</span>
                        <div style={{float: 'right'}}>
                            <Button ghost size='small'
                                style={{marginRight: '5px', color: '#1890FF', border: '1px solid #1890FF', marginTop: '2px'}}>
                                <VerticalAlignBottomOutlined className='iconfont' style={{fontSize: '13px'}}/>
                                <a href='/ehsp/images/EhsPermitRecordTemplate.xlsx'>{i18n.downloadTemplate}</a>
                            </Button>
                            <Button type='primary' size='small' style={{marginTop: '2px', display: this.props.supplierFactory ? '' : 'none'}}>
                                <Upload {...uploadProps}>
                                    <PlusOutlined  className='iconfont' style={{fontSize: '13px', color: '#FFFFFF', marginRight: '2px'}}/>{i18n.EshCommonImport}
                                </Upload>
                            </Button>
                        </div>
                    </div>
                    <div style={{marginTop: 5}} key='tableList'>
                        <Table
                            className={tableData.length == 0 ? 'scroll-body' : ''}
                            loading={tableLoading}
                            dataSource={tableData}
                            columns={tableColumns}
                            scroll={this.props.hideScroll ? {} : {x: 1900}}
                            pagination={false}
                            rowKey={record => record.key}
                            rowClassName={(record, index) => this.state.itemSelectIndex == index ? 'ehsPermitRecordRow' : ''}
                            onRow={(record, index, event) => {
                                return {
                                    onClick: (event) => this.tableClickEvent(record, index, event)     // 点击行
                                };
                            }}/>
                    </div>
                    <div style={{marginTop: '20px', lineHeight: '32px'}}>
                        <span >{i18n.EshBatchImportNumber}<span style={{color: '#1890FF'}}>{this.state.dataSize}</span></span>
                        <span style={{float: 'right'}}>
                            <Button size='middle' type='primary' style={{marginRight: 5}}
                                loading={this.state.loading} disabled={tableData.length < 1}
                                onClick={() => this.handleSubmit()}>{i18n.Confirm}{i18n.EshCommonImport}</Button>
                            <Button size='middle' style={{color: '#1890FF', border: '1px solid #1890FF'}}
                                onClick={this.giveUpTheImport}>{i18n.EshCommonGiveUpTheImport}</Button>
                        </span>
                    </div>
                    
                </Card>
            </div>
        );
    }
}
