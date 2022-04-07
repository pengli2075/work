/**
 * @file:   文件弹框预览
 * @author: pengli
 * fileList: [{contentId: XXX}]
 * iframe 宽度设置：若内容宽度>屏幕宽度=>屏幕宽度-300px;否则=>内容宽度
 */

import React from 'react';
import {Modal, Spin, Pagination, Button} from 'antd';
import LbwJsUtils from 'component/LbwJsUtils';
import './css/filePreview.css';
import axiosForCommon, {getFileUrl} from 'component/axiosForCommon';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/resizable';

const body = document.documentElement || document.body;
const bodyHeight = body.clientHeight - 100;
const bodyWidth = body.clientWidth;

export default class FilePreview extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            pageOption: {},
            iframBWidth: 900,
            fileList: props.fileList,
            defaultValue: props.fileList,
            fileResult: {},
            fileItem: {}
        };
        this.isScrolled = false;    // 自动滚动时置为true
        this.iframeDoc = null;  // frame document
        this.pageHeight = 0;    // 文件每一页高度 body总高度/锚点个数
    }

    componentDidMount() {
        this.loadFileList();
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (JSON.stringify(nextProps.fileList) !== JSON.stringify(prevState.defaultValue)) {
            return {
                fileList: nextProps.fileList,
                defaultValue: nextProps.fileList
            }
        }
        return null;
    }

    componentDidUpdate(nextProps) {
        if (JSON.stringify(nextProps.fileList) !== JSON.stringify(this.props.fileList)) {
            this.loadFileList();
        }
    }

    /**
     * 根据contentId获取文件权限【预览】【下载】
     * @param  {[type]} fileList [description]
     * @return {[type]}          [description]
     */
    loadFileList = (fileList = this.state.fileList) => {
        let contentIds = fileList.map(item => item.contentId).join(',');
        if (contentIds) {
            axiosForCommon('getPreviewableInfoListByContentIds', {contentIds: contentIds}, result => {
                this.setState({
                    fileList: result.contentPreviewableList
                });
            }, error => {
                LbwJsUtils.notification(error);
            })
        }
    }

    /**
     * 支持转换预览的文件去获取转换好的路径
     * @param  {[type]} item [description]
     * @return {[type]}      [description]
     */
    loadHtmlFile = (item) => {
        // 判断文件类型
        this.setState({
            loading: true,
            visible: true,
            fileItem: item
        });

        let contentId = item.contentId;
        axiosForCommon('getContentPreviewInfoByContentId', {contentId: contentId}, result => {
            if (!result.previewKeyPath && !result.message && !this.isImage(result)) { // 错误
                LbwJsUtils.notification(result);
                return;
            }
            let state = {};
            state.fileResult = result;
            if (result.message || this.isImage(result)) { // 转换中,显示message || 图片直接显示
                state.loading = false;
            }
            this.setState(state, () => {
                $('.preview-modal').each(function () {
                    $(this).find('#preview-box')[0] && $(this).find('#preview-box').resizable();
                    $(this).find('.ant-modal')[0] && $(this).find('.ant-modal').draggable({
                        handle: $(this).find('.ant-modal-header'),
                        // containment，可以通过设置该属性限制拖动范围，但是弹框的宽度（包括蒙版）=屏幕宽度，限制之后不能左右拖动
                        drag: (event, ui) => {
                            if (ui.position.top < 0) {
                                return false;
                            }
                        }
                    })
                })
            });
        }, error => {
            LbwJsUtils.notification(error);
        })
    }

    isImage = (fileResult) => {
        return isNotEmpty(fileResult) ? fileResult.mimeTypeId.indexOf('image') > -1 : false;
    }

    toggleModalVisible = (flag) => {
        this.setState({
            visible: false,
            fileResult: {}, // 清空路径，否则iframe不会再次加载
        })
    }

    onload = () => {
        this.setState({loading: false});
        // 获取iframe内部body宽高并设置
        this.iframeDoc = $(this.iframe).prop('contentWindow').document;
        $(this.iframeDoc).find('body').css({'margin': 0, 'background': '#fff'});
        this.iframeDoc.oncontextmenu = () => {
            return false;
        }

        // 加载完之后设置分页
        // 找到a标签有name 的个数
        let pageOption = {};
        let total = $(this.iframeDoc).find('a[name]').length;
        this.pageHeight = $(this.iframeDoc).find('body').height() / total;
        pageOption.total = total;
        // ifram 宽度由内容而定，取div 宽度，必须有内容
        let width = bodyWidth;
        if (total > 0) {
            width = $(this.iframeDoc).find('body div#page1-div').width();
        }
        this.setState({
            iframBWidth: width,
            pageOption: {
                total: total,
                currentPage: 1
            }
        })

        // 滚动不可视时浮动显示
        $(this.iframeDoc).scroll(() => {
            if (this.isScrolled) {
                this.isScrolled = false;
                return;
            }
            let scroT = $(this.iframeDoc).scrollTop();
            let currentPage = Math.ceil(scroT / this.pageHeight) || 1;
            pageOption.currentPage = currentPage;
            this.setState({
                pageOption
            });
        });
    }

    /**
     * 页数变化回调
     * @param  {[type]} page [description]
     * @return {[type]}      [description]
     */
    changePage = (page) => {
        // 根据滚动高度计算到跳转的页数
        let toScrollH = (page - 1) * this.pageHeight;
        let pageOption = this.state.pageOption;
        pageOption.currentPage = page;
        this.setState({pageOption});
        $(this.iframeDoc).scrollTop(toScrollH);
        this.isScrolled = true;
    }

    downloadFile = (contentId) => {
        // 新打开页面下载
        window.open(`${getFileUrl()}stream?contentId=${contentId}`);
    }

    render() {
        const {fileList, fileResult, fileItem} = this.state;
        const {loading, visible, pageOption, iframBWidth} = this.state;
        const _isImage = this.isImage(fileResult);
        return (
            <div>
                <div>
                    {
                        (fileList || []).map((item, index) => {
                            return (
                                <div key={item.contentId}>
                                    {
                                        item.previewable &&
                                        <a onClick={() => this.loadHtmlFile(item)}>{item.contentName}</a>
                                    }
                                    {
                                        (!item.previewable && item.downloadable) &&
                                        <a href={`${getFileUrl()}stream?contentId=${item.contentId}`}>{item.contentName}</a>
                                    }
                                    {
                                        (!item.previewable && !item.downloadable) &&
                                        <span>{item.contentName}</span>
                                    }
                                </div>
                            );
                        })
                    }
                </div>
                <Modal
                    forceRender={true}
                    style={{top: fileResult.previewKeyPath ? 35 : 100}}
                    wrapClassName={'preview-modal'}
                    onContextmenu={() => {
                        return false;
                    }}
                    className={'modal-with-title'}
                    title={`${i18n.LbwcPreview}   ${fileItem.contentName}`}
                    visible={visible} footer={null} onCancel={() => this.toggleModalVisible(false)}>
                    <Spin spinning={loading} tip={i18n.LoadingDataPleaseWait}>
                        <div id={fileResult.previewKeyPath ? 'preview-box' : 'float-box'} style={fileResult.previewKeyPath ? {
                            width: iframBWidth >= bodyWidth ? bodyWidth - 300 : iframBWidth,
                            height: bodyHeight
                        } : {}}>
                            {
                                _isImage ?
                                    <img src={`${getFileUrl()}stream?contentId=${fileItem.contentId}`}/>
                                    :
                                    fileResult.previewKeyPath ?
                                        <iframe id={'iframe'} ref={component => this.iframe = component}
                                            src={`/previewcontent/${fileResult.previewKeyPath}/index.html`}
                                            style={{opacity: loading ? 0 : 1}} frameBorder='0'
                                            onLoad={this.onload} />
                                        :
                                        <div className='message'>{fileResult.message}</div>
                            }
                            {
                                (fileResult.downloadable && !loading) &&
                                <>
                                    <Button className={fileResult.previewKeyPath ? 'absolute-btn' : 'float-btn'}
                                        type='primary' size='small'
                                        onClick={() => this.downloadFile(fileItem.contentId)}>{i18n.ContentDownload}</Button>
                                    <div className='clear'></div>
                                </>
                            }
                            {
                                (!_isImage && !loading && !fileResult.message && isNotEmpty(pageOption) && pageOption.total !== 0) &&
                                <Pagination simple current={pageOption.currentPage || 0} pageSize={1}
                                    total={pageOption.total || 0} onChange={this.changePage}/>
                            }
                        </div>
                    </Spin>
                </Modal>
            </div>
        );
    }
}