/**
 * table列表数据状态改变-添加标记
 * xuniwei
 */
import React from 'react';
import {Table} from 'antd';

export default class TableDataMarkerStatus extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            uniqueKey: props.uniqueKey || 'sequenceId',
        }
    }

    /**
     * 公用标记方法
     * @param dataMarkerStatus  CREATE/UPDATE/NOT_UPDATE/DELETE
     * @param newDataStr        JSON字符串改变后的数据源
     * @param originalDataStr   JSON字符串原始数据源
     * @param uniqueValue       标识
     * @returns {any}
     */
    handleChangeDataMarkerStatus = (dataMarkerStatus, newDataStr, originalDataStr, uniqueValue) => {
        let newData = JSON.parse(newDataStr);
        let originalData = JSON.parse(originalDataStr);
        const {uniqueKey} = this.state;
        const newTarget = newData.filter(item => (item[uniqueKey] || item[this.props.tempUniqueKey]) == uniqueValue)[0];
        const oriTarget = originalData.filter(item => (item[uniqueKey] || item[this.props.tempUniqueKey]) == uniqueValue)[0];
        if (newTarget) {
            // 新创建的数据删除，物理删除
            if (newTarget.dataMarkerStatus == 'CREATE' && dataMarkerStatus == 'DELETE') {
                newData = newData.filter(item => (item[uniqueKey] || item[this.props.tempUniqueKey]) !== uniqueValue);
                return newData;
            }
            // 新建的数据更改，还是标记为CREATE
            if (newTarget.dataMarkerStatus == 'CREATE' && dataMarkerStatus == 'UPDATE') {
                return newData;
            }
            if (dataMarkerStatus == 'UPDATE' && oriTarget) {
                // 比较当前这条数据是否有改变，对最原始数据进行比较
                // 比较之前将新数据的dataMarkerStatus置为原始数据的dataMarkerStatus，否则一直不一致
                newTarget.dataMarkerStatus = oriTarget.dataMarkerStatus;
                newTarget.dataMarkerStatus = JSON.stringify(newTarget) !== JSON.stringify(oriTarget) ? dataMarkerStatus : 'NOT_UPDATE';
                return newData;
            }
            newTarget.dataMarkerStatus = dataMarkerStatus;
        }
        return newData;
    }

    render() {
        const {pagination, bordered, columns, onRow, rowClassName, data, scroll, loading, onChange, locale, className, uniqueKey} = this.props;
        // 过滤掉已删除数据
        let dataSource = data.filter((item) => item.dataMarkerStatus !== 'DELETE');
        return (
            <Table rowKey={record => record[uniqueKey] || record[this.props.tempUniqueKey]}
                loading={loading}
                dataSource={dataSource}
                onChange={onChange}
                size='middle'
                pagination={pagination}
                bordered={bordered}
                columns={columns}
                onRow={onRow}
                rowClassName={rowClassName}
                scroll={scroll}
                locale={locale}
                className={className}
            />
        );
    }
}

