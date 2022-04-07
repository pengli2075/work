/**
 * @file:   报废审批入库-审批意见
 * @author: pengli
 */

import React from 'react';
import {CommonPanel, SubTitleItem, CommonListItem} from 'component/h5Components';
import {DetailSignature} from 'component/h5Components/signatureComponent';
import LbwJsUtilsH5, {CommonDivider} from 'component/LbwJsUtilsH5';
import {getSuggestionData, resetData, formatSuggestionList} from 'component/commonFunctions';
import DetailSwpSiteImprovement from '../../../../swpaam/antdesign/h5/createOrUpdateSafeWorkPermit/detail/detailSwpSiteImprovement';
import moment from 'moment';

const dateFormatStr = 'YYYY-MM-DD HH:mm';

export default class ApprovalSuggestion extends React.Component {
    state = {
        suggestions: []
    }

    componentDidMount() {
        // 获取审批意见
        getSuggestionData(this.props.approvalFormId, this.props.currentApprovalCount).then(result => {
            this.setState({
                suggestions: formatSuggestionList(result || {})
            })
        }).catch(err => {
            LbwJsUtilsH5.UtilToast(err);
        })
    }

    render() {
        const {hiddenSubTitle, correctActionInfoList} = this.props;
        const {suggestions} = this.state;
        let newData = resetData(suggestions);
        // 属于同一组别的审批数据整合
        const contents = newData.length > 0 &&
                newData.map((item, i) => {
                    return <div key={i}>
                        <SubTitleItem title={item.label}/>
                        {
                            item.list.map((sug, sugI) =>
                                <SugListItem
                                    item={sug}
                                    index={sugI}
                                    key={sugI}
                                    showLine={sugI < item.list.length - 1}
                                    currentApprovalCount={this.props.currentApprovalCount}/>
                            )
                        }
                        {
                            i !== newData.length - 1 &&
                            <CommonDivider styles={{height: 1}} />
                        }
                    </div>;
                })
        return hiddenSubTitle ?
            <>
                {contents}
                {
                    isNotEmpty(correctActionInfoList) &&
                        <>
                            {isNotEmpty(newData) && <CommonDivider styles={{height: 5}} />}
                            <DetailSwpSiteImprovement correctActionInfoList={correctActionInfoList}/>
                        </>
                }
            </>
            :
            <CommonPanel title={i18n.approvalSuggestion}>{contents}</CommonPanel>;
    }
}


// 审批意见列表里的一项
function SugListItem({item, showLine, labelStyles = {}, currentApprovalCount, index}) {
    return (
        <div style={{margin: '0px 5px', borderBottom: showLine ? '1px solid #eee' : 'none'}}>
            {
                currentApprovalCount > 1 ?
                    <DetailSignature
                        key={index}
                        item={{
                            signatureImg: item.signatureImg,
                            signatureTime: item.approvalDate
                        }} />
                    :
                    <>
                        <CommonListItem
                            label={item.personName}
                            labelStyles={labelStyles}
                            content={<span style={{color: '#108ee9'}}>{item.approvalStatusName}</span>}
                            rightContent={moment(item.approvalDate).format(dateFormatStr)}/>
                        <CommonListItem
                            label={i18n.SuggestionDescription}
                            labelStyles={labelStyles}
                            content={item.approvalSuggestion}
                            contentStyles={{alignItems: 'normal'}}
                            rightContent={
                                <span className='clear'>
                                    {
                                        item.signatureImg &&
                                        <img src={'stream4imgsrc?contentId=' + item.signatureImg} style={{width: 80, height: 50, border: '1px solid #eee'}} />
                                    }
                                </span>
                            } />
                    </>
            }
        </div>
    );
}
