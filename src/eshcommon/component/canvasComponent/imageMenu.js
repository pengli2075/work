/**
 * @file: 地图导航-切换图纸显示
 * @author: pengli
 * showSearch: true|false 是否显示搜索
 * pageType:
 *      'homemap'-esh&风险作业首页展示厂区图
 *      ''-巡检点位图不展示厂区图
 * pageLevel: 0|1|2 楼层单图｜建筑堆叠图｜厂区图
 * areaDrawingBaseImageInfo: 当前显示的图纸（堆叠图时结构为List）
 * buildInfoAndPicList: 多层结构的图纸列表
 * dataSourceTemp: 不分曾结构的图纸列表
 * pageId: 供应商｜建筑id
 * baseImageId： 图纸标识
 * floorId: 楼层id
 */

import React from 'react';
import {LeftOutlined, SearchOutlined} from '@ant-design/icons';
import {Menu, Input} from 'antd';
import './imageMenu.css';

const {SubMenu} = Menu;

export default class ImageMenu extends React.Component {
    /**
     * 建筑及其楼层下是否有平面图
     * @param  {[type]} key  buildingId | floor
     * @return {[type]}      [description]
     */
    isHaveBaseImage = (value, key, buildingId) => {
        const {dataSourceTemp} = this.props;
        let isHave = false;
        let newList = [];
        if (buildingId) {
            newList = dataSourceTemp.filter(item => (item[key] === value || (!item[key] && !value)) && item.isFloor && item.buildingId === buildingId);
        } else { // 建筑
            newList = dataSourceTemp.filter(item => (item[key] === value && item.isFloor));
        }
        newList.map(temp => {
            // 该建筑下必须有楼层 并且有楼层图纸才可以显示
            if (isNotEmpty(temp.imgList)) {
                isHave = true;
            }
        });
        return isHave;
    }

    handleFocus = (e) => {
        e.stopPropagation();
        e.preventDefault();
    }

    /**
     * 检索区域名称/设备/点位
     * 单层搜索 搜索当前图纸区域 高亮显示 多层搜索 根据建筑楼层 区域名称过滤图纸
     * @param  {[type]} searchText [description]
     * @return {[type]}            [description]
     */
    handleFilter = (e, searchText = this.state.searchText) => {
        e.stopPropagation();
        e.preventDefault();
        if (searchText && this.props.pageLevel === 0) { // 0级时搜索区域后并高亮
            // 从value 中过滤数据
            // areaDrawingAreaInfoList
            const {areaDrawingBaseImageInfo} = this.props;
            let areaDrawingAreaInfoList = areaDrawingBaseImageInfo.areaDrawingAreaInfoList;
            // areaName
            let filterValue = areaDrawingAreaInfoList.filter(item => {
                if (item.areaName && item.areaName.indexOf(searchText) > -1) {
                    return true;
                }
                return false;
            });
            this.props.callBack && this.props.callBack(filterValue);
        } else {
            this.props.getAllLevelData(null, null, searchText);
        }
        if (this.Input) {
            setTimeout(() => {
                this.Input.blur();
            }, 500);
        }
    }

    /**
     * 获取图纸菜单：最多为4级：厂区-建筑-楼层-图纸
     * @param list: 层级列表
     * @param flag: floor|image
     * @param buildingId
     */
    getMenu = (list, flag, buildingId) => {
        const {pageId, baseImageId} = this.props;
        let floorId = this.props.floorId || '';
        return (
            list.map(item => {
                if (flag === 'floor') {
                    if (isNotEmpty(item.imgList)) {
                        return (
                            <SubMenu title={item.floor || 'NA'} key={`floor_${buildingId}_${item.floor || ''}`}
                                onTitleClick={this.handleChangeMenu}
                                style={((item.floor || '').toLocaleLowerCase() === floorId.toLocaleLowerCase() && pageId === buildingId) ? {color: '#108ee9'} : {}}>
                                {this.getMenu(item.imgList, 'image')}
                            </SubMenu>
                        );
                    }
                } else if (flag === 'image') {
                    return <Menu.Item key={'img_' + item.areaDrawingBaseImageId}
                        style={item.areaDrawingBaseImageId === baseImageId ? {color: '#108ee9'} : {}}><span>{item.areaDrawingBaseImageName}</span></Menu.Item>
                } else {
                    if (this.isHaveBaseImage(item.buildingId, 'buildingId')) {
                        if (isNotEmpty(item.buildingFloorInfoList)) {
                            return (
                                <SubMenu title={item.buildingName} key={'build_' + item.buildingId}
                                    onTitleClick={this.handleChangeMenu}
                                    style={item.buildingId === pageId ? {color: '#108ee9'} : {}}>
                                    {this.getMenu(item.buildingFloorInfoList, 'floor', item.buildingId)}
                                </SubMenu>
                            );
                        } else {
                            return <Menu.Item key={'build_' + item.buildingId}
                                style={item.buildingId === pageId ? {color: '#108ee9'} : {}}><span>{item.buildingName}</span></Menu.Item>
                        }
                    }
                }
            })
        );
    }

    /**
     * 有下层级的menu点击
     * @param  {[type]} param [description]
     * @return {[type]}       [description]
     */
    handleChangeMenu = (param) => {
        const {pageLevel, pageId, dataSourceTemp} = this.props;
        let key = param.key;
        let keyPath = param.keyPath;
        let _key = '';
        let state = {
            pageLevel,
            pageId
        };

        if (key.indexOf('build') > -1) {    // 点击的是建筑
            _key = key.split('build_')[1]; // buildingId
            // 显示该建筑下所有楼层的总览图（没有总览图的楼层默认取第一张显示）
            let build = dataSourceTemp.filter(item => item.buildingId === _key && item.isBuilding)[0];
            if (build) {
                state.areaDrawingBaseImageInfo = {
                    buildingId: build.buildingId
                };
                state.pageLevel = 1;
                state.pageId = _key;
            }
            // 如果查找结果只有一个楼层并且只有一张图纸，默认跳转到0级
            // 执行到这一步说明建筑下肯定有楼层并且它有图纸
            let floorList = dataSourceTemp.filter(item => item.buildingId === _key && item.isFloor);
            if (floorList.length === 1 && floorList[0].imgList.length === 1) {
                let floor = floorList[0];
                let target = floor.imgList[0];
                state.areaDrawingBaseImageInfo = target;
                state.baseImageId = target.areaDrawingBaseImageId;
                state.pageLevel = 0;
                state.pageId = _key;
                state.floorId = floor.floor || '';
            }
        } else if (key.indexOf('floor') > -1) { // 点击的是楼层
            _key = key.split('_')[2] || ''; // floor
            let buildingId = key.split('_')[1];
            // 显示该楼层的总览图｜图纸
            let floor = dataSourceTemp.filter(item => item.buildingId === buildingId && (item.floor || '').toLocaleLowerCase() === _key.toLocaleLowerCase())[0];
            if (floor) {
                let target = floor.imgList.filter(img => img.isOverview === 'Y')[0];
                if (!target) {
                    target = floor.imgList.filter(img => img.isOverview !== 'Y')[0];
                }
                if (target) {
                    state.areaDrawingBaseImageInfo = target;
                    state.baseImageId = target.areaDrawingBaseImageId;
                    state.pageLevel = 0;
                    state.pageId = buildingId;
                    state.floorId = floor.floor || '';
                }
            }
        } else if (key.indexOf('img') > -1) { // 点击的是图纸名称
            _key = key.split('_')[1];
            // 显示该图纸
            let buildingId = keyPath[1].split('_')[1] || '';
            let floor = keyPath[1].split('_')[2] || '';
            state.floorId = floor;
            state.pageId = buildingId;
            let target = dataSourceTemp.filter(item => item.isFloor && (item.floor || '').toLocaleLowerCase() === floor.toLocaleLowerCase() && item.buildingId === buildingId)[0];
            if (target) {
                state.areaDrawingBaseImageInfo = target.imgList.filter(img => img.areaDrawingBaseImageId === _key)[0];
                state.baseImageId = _key;
                state.pageLevel = 0;
            }
        }
        if (isNotEmpty(state.areaDrawingBaseImageInfo)) {
            this.props.handleChangeBaseImageInfo(state);
        }
    }

    /**
     * 无下层级的menu点击
     * @param  {[type]} param [description]
     * @return {[type]}       [description]
     */
    handleChangeMenuItem = (param) => {
        this.handleChangeMenu(param);
    }

    /**
     * 返回上一级图纸
     * @return {[type]} [description]
     * 如果上一级没有图纸则再往上一级
     */
    handleBackComplex = () => {
        const {dataSourceTemp} = this.props;
        let state = {
            pageLevel: 2
        }
        let target = dataSourceTemp.filter(item => item.isComplex)[0];
        if (target && isNotEmpty(target.imgList)) {
            state.areaDrawingBaseImageInfo = target.imgList[0] || {};
            state.baseImageId = target.imgList[0].areaDrawingBaseImageId;
            state.pageId = target.supplierFactory;
        }
        if (isNotEmpty(state.areaDrawingBaseImageInfo)) {
            this.props.handleChangeBaseImageInfo(state);
        }
    }

    handleBackPreLevel = () => {
        const {pageLevel, pageId, dataSourceTemp} = this.props;
        if (pageLevel === 1) {
            this.handleBackComplex();
        } else {
            // 回到1级
            let state = {
                pageLevel,
                pageId
            };

            // 显示该建筑下所有楼层的总览图（没有总览图的楼层默认取第一张显示）
            let build = dataSourceTemp.filter(item => item.buildingId === pageId && item.isBuilding)[0];
            if (build) {
                state.areaDrawingBaseImageInfo = {
                    buildingId: build.buildingId
                };
                state.pageLevel = 1;
            }
            // 如果查找结果只有一个楼层并且只有一张图纸，默认回到2级
            // 执行到这一步说明建筑下肯定有楼层并且它有图纸
            let floorList = dataSourceTemp.filter(item => item.buildingId === pageId && item.isFloor);
            if (floorList.length === 1) {
                this.handleBackComplex();
            } else {
                if (isNotEmpty(state.areaDrawingBaseImageInfo)) {
                    this.props.handleChangeBaseImageInfo(state);
                }
            }
        }
    }

    handleBlur = (e) => {
        // 失去焦点时当查找条件为空重新查询数据
        if (!e.target.value) {
            this.props.getAllLevelData(null, null, '');
        }
    }

    render() {
        const {buildInfoAndPicList, pageLevel, showSearch = true, pageType = '', styles = {}} = this.props;
        let currentDiagramInfo = isNotEmpty(buildInfoAndPicList) ? buildInfoAndPicList[0] : {};
        return (
            <div style={{position: 'absolute', top: 5, left: 10, zIndex: 1, ...styles}}>
                <Menu selectedKeys={[]} className={'map-menu-wrapper'} onClick={this.handleChangeMenu}>
                    {
                        showSearch &&
                        <SubMenu className={'search-content'} title={<a><SearchOutlined/></a>} key={'disabled'}>
                            <Menu.Item className={'disabled-item'}>
                                <Input
                                    ref={com => this.Input = com}
                                    placeholder={pageLevel === 0 ? i18n.areaName : `${i18n.BuildingName} ${i18n.areaName}`}
                                    className={'input-search'}
                                    onClick={this.handleFocus}
                                    onBlur={this.handleBlur}
                                    onPressEnter={(e) => this.handleFilter(e, e.target.value)}
                                    onChange={(e) => {
                                        this.setState({searchText: e.target.value})
                                    }}
                                    suffix={<SearchOutlined
                                        onClick={(e) => this.handleFilter(e)}/>}/>
                            </Menu.Item>
                        </SubMenu>
                    }
                    {
                        pageType ?
                            <SubMenu popupClassName={'sub-menu-wrapper'}
                                title={
                                    <a>
                                        <i style={{fontSize: 14, margin: '0px 6px'}}
                                            className={'esh-common icon-ehs-plan'} />
                                    </a>
                                }
                                key={currentDiagramInfo.supplierFactory}
                                onTitleClick={this.handleBackComplex}>
                                {this.getMenu(currentDiagramInfo.buildingInfoList || [])}
                            </SubMenu>
                            :
                            this.getMenu(currentDiagramInfo.buildingInfoList)
                    }
                </Menu>
                {
                    ((!pageType && pageLevel === 0) || (pageLevel !== 2 && pageType)) &&
                    <Menu className={'map-menu-wrapper'} onClick={this.handleBackPreLevel}>
                        <Menu.Item><LeftOutlined style={{color: '#108ee9'}}/></Menu.Item>
                    </Menu>
                }

            </div>
        );
    }
}
