/**
 * @file:   施工申请-审批
 * @author: pengli
 */

import React, {useState, useEffect, useRef} from 'react';
import {PersonTagContent, CommonListItem, HiddenInputItem, SubTitleItem} from 'component/h5Components/index';
import LookupCompanyPerson from 'lookup/h5/lookupCompanyPerson';
import Signature from 'component/h5Components/signatureComponent';
import CommonEshIcon from 'component/commonEshIcon';
import {Checkbox, Row, Tag} from 'antd';
import {Button, TextareaItem} from 'antd-mobile';
import {createForm} from 'rc-form';
import {getAfApprovalPersonOfPendingInfoByApprovalFormId} from 'component/commonFunctions';
import DelegateForApprovalLookup from 'lookup/h5/lookupDelegateForApproval';
import axiosForCommon from 'component/axiosForCommon';
import DetailSwpSiteImprovement from '../../../../swpaam/antdesign/h5/createOrUpdateSafeWorkPermit/detail/detailSwpSiteImprovement';
import LbwJsUtilsH5, {CommonDivider} from 'component/LbwJsUtilsH5';

function ApprovalItem(props) {
    const {getFieldProps, getFieldsValue, setFieldsValue} = props.form;
    const [visible, setVisible] = useState(false);
    const [notifPersonList, setNotifPersonList] = useState([]);
    const [delegateVisible, setDelegateVisible] = useState(false);
    const [approvalPersonMap, setApprovalPersonMap] = useState({});
    const [approvalPersonRespList, setApprovalPersonRespList] = useState([]);
    const btnDisabled = useRef(null);

    useEffect(() => {
        getAfApprovalPersonOfPendingInfoByApprovalFormId(props.approvalFormId).then(result => {
            let _approvalPersonMap = result.approvalPersonMap || {};
            setApprovalPersonRespList(_approvalPersonMap.approvalPersonRespList || []);
            setApprovalPersonMap(_approvalPersonMap);
        }).catch(error => {
            LbwJsUtilsH5.UtilToast(error);
        })
    }, []);

    function handleDeletePersonTag(person) {
        let newData = [...notifPersonList];
        newData = newData.filter(item => item.personId !== person.personId);

        setNotifPersonList(newData);
        setFieldsValue({
            noticeRelatedPersonIdList: JSON.stringify(newData.map(temp => temp.personId))
        })
    }

    function handleSelectPerson() {
        setVisible(!visible);
    }

    function handleAddPerson(newData) {
        let _newData = newData.map(item => {
            item.personId = item.employeeId || item.personId || item.partyId;
            item.personName = item.employeeName || item.personName || item.partyName;
            return item;
        })
        _newData = notifPersonList.concat(_newData);

        // 数组去重
        let personObj = {};
        _newData = _newData.reduce(function (item, next) {
            personObj[next.personId] ? '' : personObj[next.personId] = true && item.push(next);
            return item;
        }, []);

        setNotifPersonList(_newData);
        setFieldsValue({
            noticeRelatedPersonIdList: JSON.stringify(_newData.map(person => person.personId))
        })
    }

    /**
     * 审批
     * @param key
     * 拒绝&退回：验证意见
     * 拒绝&同意：验证签字
     */
    function handleApproval(key) {
        let fieldsValue = getFieldsValue();
        if (key === 'delegate') {
            setDelegateVisible(!delegateVisible);
        } else if (key === 'improve') {
            // 现场改善
            let url = `createOrUpdateSwpSiteImprovement?workPermitId=${props.approvalFormId}&swpApprovalPersonId=${approvalPersonMap.swpApprovalPersonId}`;
            url += props.workPermitInfo.isConductedByOurself === 'Y' ? '' : `&workContractor=${props.workPermitInfo.workContractor}`;
            url += props.partyId ? `&partyId=${props.partyId}` : '';
            location.href = url;
        } else {
            if (btnDisabled.current) return;
            btnDisabled.current = true;
            if (!props.isThrprc) {
                LbwJsUtilsH5.UtilToast('loading', '保存中...');
            }
            if ((key === 'reject' || key === 'return') && !fieldsValue.approvalSuggestion) {
                btnDisabled.current = false;
                LbwJsUtilsH5.UtilToast(`${i18n.EshCommonPleaseEnter}${i18n.approvalSuggestion}`);
                return;
            }
            if (!fieldsValue.signatureImageContentId && key !== 'return') {
                btnDisabled.current = false;
                LbwJsUtilsH5.UtilToast('请签字');
                return;
            }
            let url = '';
            if (key === 'return') {
                url = 'returnApprovalOfSafeWorkPermit';
            } else if (key === 'reject') {
                url = props.pageStatus === 'SWPAAM' ? 'rejectApprovalOfSafeWorkPermit' : 'rejectApprovalOfConstructionApplicationForm';
            } else {
                url = props.pageStatus === 'SWPAAM' ? 'approveApprovalOfSafeWorkPermit' : 'approveApprovalOfConstructionApplicationForm';
            }

            if (props.validatePageData && props.isThrprc) {
                props.validatePageData('submit', null, null, params => {
                    if (!params) {
                        btnDisabled.current = false;
                        return;
                    }
                    fieldsValue = {...fieldsValue, ...params};
                    submitData(url, fieldsValue);
                })
            } else {
                submitData(url, fieldsValue);
            }
        }
    }

    function submitData(url, fieldsValue) {
        axiosForCommon(url, fieldsValue, result => {
            LbwJsUtilsH5.UtilToast(result, () => {
                // 上个页面从列表页面跳转过来
                if (document.referrer.includes('findSafeWorkPermits') || document.referrer.includes('findConstructionForms') || document.referrer.includes('main') || document.referrer.includes('weComHome')) {
                    history.back(-1);
                } else {
                    // 跳转到列表页面
                    location.replace(props.pageStatus === 'SWPAAM' ? 'findSafeWorkPermits' : 'findConstructionForms');
                }
            });
        }, error => {
            btnDisabled.current = false;
            LbwJsUtilsH5.UtilToast(error);
        })
    }

    function getResComponent() {
        return (
            <div style={{padding: '5px 10px'}}>
                <Checkbox.Group {...getFieldProps('checkRes')} style={{display: 'block'}}>
                    {
                        approvalPersonRespList.map((res, resI) => {
                            return (
                                <Row key={resI}>
                                    {
                                        resI !== 0 &&
                                            <CommonDivider styles={{marginBottom: 5}} />
                                    }
                                    <Checkbox value={res.responsibilitylId || resI}>
                                        <span>
                                            {res.responsibility}&nbsp;&nbsp;
                                            {
                                                isNotEmpty(res.approvalGroupAndRoleNameList) &&
                                                        res.approvalGroupAndRoleNameList.map((role, roleI) => (
                                                            <Tag key={roleI}>{role}</Tag>
                                                        ))
                                            }
                                        </span>
                                    </Checkbox>
                                </Row>

                            );
                        })
                    }
                </Checkbox.Group>
            </div>
        );
    }

    return (
        <div>
            {
                isNotEmpty(approvalPersonRespList) &&
                    <>{getResComponent()}</>
            }
            {
                (props.pageStatus === 'SWPAAM' && isNotEmpty(props.correctActionInfoList)) &&
                    <>
                        <DetailSwpSiteImprovement correctActionInfoList={props.correctActionInfoList}/>
                        <CommonDivider styles={{height: 5}} />
                    </>
            }
            <HiddenInputItem {...getFieldProps('approvalFormId', {initialValue: props.approvalFormId})} />
            <HiddenInputItem {...getFieldProps('signatureImageContentId')} />
            <HiddenInputItem {...getFieldProps('approvalPersonRespIdList', {initialValue: JSON.stringify(approvalPersonRespList.filter(item => !!item.responsibilitylId).map(res => res.responsibilitylId))})} />
            <HiddenInputItem {...getFieldProps('noticeRelatedPersonIdList', {initialValue: '[]'})} />
            {
                props.isThrprc &&
                <SubTitleItem title={approvalPersonMap.approvalRoleName}/>
            }
            {
                !props.isThrprc &&
                    <CommonListItem label={'通知相关人员'} content={
                        <PersonTagContent
                            closable={true}
                            list={notifPersonList}
                            handleDelete={handleDeletePersonTag} />
                    } rightContent={
                        <a onClick={handleSelectPerson}><CommonEshIcon type={'icon-ehs-add-people'} style={{fontSize: 18}}/></a>
                    } />
            }
            {/*热加工职责在顶部显示*/}
            {
                (isNotEmpty(approvalPersonRespList) && !props.isThrprc) &&
                    <>{getResComponent()}</>
            }
            {
                (props.pageStatus === 'SWPAAM' && !props.isThrprc) &&
                <CommonListItem
                    label='现场连线'
                    content={
                        <a onClick={() => location.href = `createFaceTime?approvalFormId=${props.approvalFormId}`}>
                            <CommonEshIcon type={'icon-ehs-video-call'} style={{fontSize: 18}} />
                        </a>
                    }/>
            }
            <CommonListItem
                label={i18n.approvalSuggestion}
                content={
                    <TextareaItem
                        prefixListCls={'em-border'}
                        {...getFieldProps('approvalSuggestion')}
                        rows={3}
                        maxLength={1000}
                        count={1000}
                        placeholder={i18n.EshCommonPleaseEnter}/>
                }/>
            <Signature
                form={props.form}
                fieldName={'signatureImageContentId'}
                contentStyles={{alignItems: 'normal'}}
                hideDivider={true}/>
            <div className='bottom-btn-box'>
                {
                    approvalPersonMap.allowDelegation &&
                    <BtnItem icon={<CommonEshIcon type='icon-ehs-entrust' />} label='委托' onClick={() => handleApproval('delegate')} />
                }
                {
                    props.isThrprc &&
                    <Button onClick={() => handleApproval('return')}>{'退回'}</Button>
                }
                {
                    (props.pageStatus === 'SWPAAM' && !props.isThrprc) &&
                    <Button onClick={() => handleApproval('improve')}>{'改善'}</Button>
                }
                <Button onClick={() => handleApproval('reject')}>{i18n.EshCommonReject}</Button>
                <Button onClick={() => (!approvalPersonRespList.length || (getFieldProps('checkRes').value && getFieldProps('checkRes').value.length === approvalPersonRespList.length)) ? handleApproval(null) : null}
                    className={(!approvalPersonRespList.length || (getFieldProps('checkRes').value && getFieldProps('checkRes').value.length === approvalPersonRespList.length)) ? 'active' : 'disabled'} type='primary'>{i18n.Agree}</Button>
            </div>

            <LookupCompanyPerson
                form={props.form}
                needUserLogin={'Y'}
                isCanSelectOtherCompany={hasMultipleSupplierFactories}
                visibility={visible}
                supplierFactory={props.partyId}
                isMultipleChoice={true}
                defaultList={notifPersonList}
                defaultSupplierFactory={{
                    supplierFactory: props.workPermitInfo.supplierFactory,
                    supplierFactoryName: props.workPermitInfo.supplierFactoryName
                }}
                setVisible={handleSelectPerson}
                callBack={handleAddPerson} />
            <DelegateForApprovalLookup
                pageStatus={props.pageStatus}
                supplierFactory={props.partyId}
                approvalFormId={props.approvalFormId}
                visible={delegateVisible}
                setVisible={() => {setDelegateVisible(!delegateVisible)}}/>
        </div>
    );
}

export default createForm()(ApprovalItem);

function BtnItem(props) {
    return (
        <div className={'btn-vertical-box'} onClick={props.onClick}>
            {props.icon}
            <div>{props.label}</div>
        </div>
    );
}


