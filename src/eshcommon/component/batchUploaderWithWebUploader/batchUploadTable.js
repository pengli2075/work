/**
 * @file: 批量上传: 表格
 * @author: zhangyue
 */
import React from 'react';
import {Table, Row, Col} from 'antd';

export default class BatchUploadTable extends React.Component {
    constructor() {
        super();
        this.state = {
            routInspObjectItemTableColumns: [],
        };
    }

    componentDidMount() {
        let uploadTableColumns = this.props.uploadTableColumns;
        if (uploadTableColumns) {
            const commonColumns = [
                {
                    title: i18n.CommonStatus, // 状态
                    dataIndex: 'message',
                    render: (text, record) => <span style={{color: record.status === 'success' ? '#333' : '#f00'}}>{text || i18n.WaitingUpload}</span>
                }, {
                    title: i18n.operation, // 操作
                    width: 70,
                    render: (text, record, index) => (
                        <a
                            onClick={() => this.props.deleteRow(index, record)}
                            style={{
                                color: record.uploaded === 'Y' ? '#909090' : '#108ee9',
                                cursor: record.uploaded === 'Y' ? 'auto' : 'pointer',
                            }}
                        >{i18n.CommonDelete}</a>
                    )
                }
            ];
            this.setState({routInspObjectItemTableColumns: uploadTableColumns.concat(commonColumns)});
        }
    }

    render() {
        return (
            <Row>
                <Col lg={24} xl={16}>
                    <Table
                        bordered
                        rowKey={(record, index) => index}
                        columns={this.state.routInspObjectItemTableColumns}
                        dataSource={this.props.dataSource}
                        pagination={false}
                    />
                </Col>
            </Row>
        );
    }
}