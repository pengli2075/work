/**
 * @file: 批量上传: 主页面
 * @author: zhangyue
 * @param:
 * uploadConfigMap: 给上传组件 object
 *         accept             需要过滤的文件类型 string
 *         formData           保存方法需要的参数 object
 *         saveServer         保存方法接口 string
 *         validServer        验证方法接口 string
 * uploadInfoMap: 给上传文件的提示信息 object
 *         buttonContent      添加文件的按钮文字 string, 默认为 “添加照片”
 *         uploadInfo         'info' icon 后的文字 string
 *         fileNameFormat     文件名格式 string
 *         fileNameExample    文件名示例 string
 *         uploadNote         "注意"后的文字  string
 * uploadTableColumns: 给表格列 array
 *         targetTitle        要上传的文件对应的数据的表头文字，如: 检查项目 string
 *         fileTitle          上传的文件对应的表头文字，如: 标准照片名称 string
 * form: 传入的表单
 * needValidateFormValues: 是否需要在添加照片前验证表单，string 为 Y 则验证
 * validateFieldNames: 需要验证的字段名称 array ['fieldName1', 'fieldName2']
 * turnToDetailPage: 上传后是否需要在上传成功后跳转至详情页面 string 为 N 则不需跳转
 * detailUrl: 要跳转至的详情页链接
 */
import React from 'react';
import {InfoCircleOutlined} from '@ant-design/icons';
import {Card, Modal, Button, Progress, Spin} from 'antd';
import BatchUploadTable from './batchUploadTable';
import LbwJsUtils from 'component/LbwJsUtils';
import BatchUploader from './batchUploader';

export default class BatchUploadWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            routInspObjectItemList: [],
            doneFileCount: 0,  // 已成功上传的文件数
            totalFiles: 0,     // 待上传的全部文件数
            progressVisible: false, // 是否显示进度条弹框
            uploadBtnDisabled: false, // 是否禁用添加照片按钮
        };
    }

    componentDidMount() {
        // 添加离开事件
        LbwJsUtils.isDataChangedBeforePageUnload(this.handleWindowClose);
        this.validateAddBtnDisabled(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        // 判断：如果需要在添加文件前验证表单数据，当表单数据有变化时要重新判断按钮是否可用
        if (nextProps.needValidateFormValues === 'Y' && JSON.stringify(nextProps.uploadConfigMap.formData) !== JSON.stringify(this.props.uploadConfigMap.formData)) {
            this.validateAddBtnDisabled(nextProps);
        }
    }

    // 判断是否可以点击"添加照片"
    validateAddBtnDisabled = (props) => {
        const {needValidateFormValues, validateFieldNames = []} = props;
        // 判断：如果需要在添加文件前验证表单数据，要进行下列操作 －－ 如果有必须字段为空，要显示验证信息，并禁用上传按钮
        if (needValidateFormValues === 'Y' && validateFieldNames.some(fieldName => !props.form.getFieldValue(fieldName))) {
            props.form.validateFields(); // 触发表单控件的验证方法，显示验证信息
            this.setState({uploadBtnDisabled: true});
        } else {
            this.setState({uploadBtnDisabled: false});
        }

    }

    handleWindowClose = () => {
        const {routInspObjectItemList} = this.state;
        // 若待上传文件列表中有未上传成功的数据则弹出离开提示
        if (routInspObjectItemList.length > 0 && routInspObjectItemList.some(file => file.uploaded !== 'Y')) {
            return false;
        }
        return true;
    }

    // 上传回调
    handleUploadPhotos = (fileList) => {
        // 将拼好的表格数据排序：先排有序号的，从小到大，后排匹配失败的
        let newList = this.state.routInspObjectItemList.concat(fileList);
        newList.sort((itemA, itemB) => {
            if (!itemA.sequenceId) {
                return 1;
            } else if (!itemB.sequenceId) {
                return -1;
            } else {
                return itemA.sequenceId - itemB.sequenceId;
            }
        });
        // 将处理过的数据写入表格中
        this.setState({
            routInspObjectItemList: newList
        });
    }

    // 删除一行数据
    deleteRow = (rIndex, record) => {
        // 如果已成功上传，不可删除
        if (record.uploaded === 'Y') {
            return;
        }
        let routInspObjectItemList = this.state.routInspObjectItemList;
        routInspObjectItemList.splice(rIndex, 1);
        this.setState({
            routInspObjectItemList: [...routInspObjectItemList]
        });
        // 需要删除上传组件队列中的文件，让其中的文件列表与表格数据同步
        this.batchUploader.state.uploader.cancelFile(record.originId);
    }

    // 最底部的“开始上传”（保存）事件
    handleSavePhotos = (routInspObjectItemList) => {
        // 经过验证方法，status 全都为 success 才可以上传
        let isWaitingCount = 0;
        if (routInspObjectItemList.length > 0) {
            if (routInspObjectItemList.every(file => {
                if (file.uploaded !== 'Y') {
                    isWaitingCount++;
                }
                return file.status === 'success';
            })) {
                this.setState({progressVisible: true, doneFileCount: 0, isWaitingCount: isWaitingCount});
                this.batchUploader.state.uploader.upload();
            } else {
                LbwJsUtils.notification(i18n.PleaseCheckDataInfo); // 信息有误请再次核对
            }
        } else {
            LbwJsUtils.notification(i18n.NoAvaliableFile); // 没有文件
        }
    }

    // 每次上传成功的回调: 更新进度条，更新表格数据
    afterUploadSuccess = (newDoneFileCount, routInspObjectItemList) => {
        this.setState({
            doneFileCount: newDoneFileCount,
            routInspObjectItemList
        });
    }

    // 关闭上传（保存）进度弹框
    handleCancel = () => {
        // 如果有未上传成功的，不跳转页面
        if (this.state.routInspObjectItemList.every(file => file.status === 'success') && this.props.turnToDetailPage !== 'N') {
            location.href = this.props.detailUrl;
        } else {
            this.setState({progressVisible: false});
        }
    }

    // 设置加载动画
    setLoading = (flag) => {
        this.setState({loading: flag});
    }

    render() {
        const {routInspObjectItemList, doneFileCount, progressVisible, loading, isWaitingCount, uploadBtnDisabled} = this.state;
        const {uploadConfigMap, uploadInfoMap, uploadTableColumns, title} = this.props;
        const {uploadInfo, fileNameFormat, fileNameExample, uploadNote} = uploadInfoMap;
        let currentListLength = routInspObjectItemList.length;
        return (
            <div>
                <Spin spinning={loading}>
                    <Card>
                        <BatchUploader
                            ref={(component) => this.batchUploader = component}
                            {...uploadConfigMap}
                            doneFileCount={doneFileCount}
                            currentList={routInspObjectItemList}
                            onAfterAdd={this.handleUploadPhotos}
                            afterUploadSuccess={this.afterUploadSuccess}
                            setLoading={this.setLoading}
                            {...this.props}
                            uploadBtnDisabled={uploadBtnDisabled}
                        />
                        <div style={{paddingTop: 10}}>
                            <p>
                                <InfoCircleOutlined
                                    className='iconfont'
                                    style={{color: '#108ee9', marginRight: 10, verticalAlign: 'middle'}}/>
                                <span style={{verticalAlign: 'middle'}}>{uploadInfo}</span> {/* 请将所有照片统一命名 */}
                            </p>
                            <p className='tip-message'>{fileNameFormat}<span
                                style={{marginLeft: 20}}>{fileNameExample}</span></p>
                            <p className='tip-message'>{uploadNote}</p> {/* 注意 */}
                        </div>
                    </Card>
                    <Card title={title} style={{paddingBottom: 10}}>
                        <BatchUploadTable dataSource={routInspObjectItemList} uploadTableColumns={uploadTableColumns}
                            deleteRow={this.deleteRow}/>
                    </Card>
                    <div>
                        <Button type='primary'
                            onClick={() => this.handleSavePhotos(routInspObjectItemList)}>{i18n.StartUpload}</Button> {/* 开始上传 */}
                        <span
                            style={{marginLeft: 10}}>{i18n.SomePhotosHaveBeenAdded.replace('#0#', currentListLength)}</span>
                    </div>
                </Spin>
                <Modal
                    title=''
                    visible={progressVisible}
                    closable={false}
                    maskClosable={false}
                    footer={<Button onClick={this.handleCancel}
                        disabled={doneFileCount < isWaitingCount}>{i18n.Confirm}</Button>}
                >
                    <p>{i18n.UploadProgress}</p> {/* 上传进度 */}
                    <Progress percent={Math.round(doneFileCount / isWaitingCount * 100)}/>
                </Modal>
            </div>
        );
    }
}
