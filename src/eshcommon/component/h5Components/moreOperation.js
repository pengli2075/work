/**
 * 更多操作
 * @author: pengli
 */

import React from 'react';
import {Modal} from 'antd-mobile';

export default class MoreOperation extends React.Component {
    handleClick = (item) => {
        const {operationData, operationType} = this.props;
        let url = '';
        switch (item.key) {
            case 'copy':    // 复制
                url = operationType === 'consaas' ?
                    `applyConstructionForm?isRepeat=Y&constructionFormId=${operationData.approvalFormId}`
                    :
                    `createOrUpdateSafeWorkPermit?isRepeat=Y&workPermitId=${operationData.approvalFormId}`
                location.href = url;
                break;
            case 'approval':    // 审批
                url = operationType === 'consaas' ?
                    `applyConstructionForm?constructionFormId=${operationData.approvalFormId}`
                    :
                    operationType === 'swpaam' ?
                        `createOrUpdateSafeWorkPermit?workPermitId=${operationData.approvalFormId}`
                        :
                        `approvalHazWasteDisposal?hazaWastDispFormId=${operationData.approvalFormId}`;
                location.replace(url);
                break;
            case 'approvalProcess':  // 审批流程
                let currentApprovalCount = operationData.currentApprovalCount ? `&currentApprovalCount=${operationData.currentApprovalCount}` : '';
                location.href = `detailApprovalProcess?approvalFormId=${operationData.approvalFormId}${currentApprovalCount}`;
                break;
            case 'flow':  // 作业证进程
                location.href = `detailWorkFlow?approvalFormId=${operationData.approvalFormId}`;
                break;
            case 'cancel': // 撤销
            case 'PDF': // pdf导出
            case 'delete': // 删除
            default:
                this.props.callBack(item.key);
                break;
        }
    }

    render() {
        const {visible, handleVisible, operationList = [], operationData, operationType} = this.props;
        let downloadUrl = '';
        if (operationType === 'consaas') {
            downloadUrl = `constructionForm.pdf?constructionFormId=${operationData.approvalFormId}`;
        } else if (operationType === 'swpaam') {
            downloadUrl = `safeWorkPermit.pdf?workPermitId=${operationData.approvalFormId}&workPermitTypeIdList=${operationData.workPermitTypeIdList}`
        }
        return <Modal
            transparent
            visible={visible}
            onClose={() => handleVisible(false)}>
            {
                operationList.map((item, index) => {
                    return (
                        <div key={index} onClick={() => {
                            this.handleClick(item)
                        }}>
                            {
                                item.key === 'PDF' ?
                                    <a style={{display: 'inline-block', width: '100%'}} href={downloadUrl} download>{item.label}</a>
                                    :
                                    <a>{item.label}</a>
                            }
                            {
                                index < operationList.length - 1 &&
                                <div
                                    style={{height: 1, width: '100%', margin: '10px 0px', background: '#e8e8e8'}} />
                            }
                        </div>
                    );
                })
            }
        </Modal>

    }
}