/**
 * @file:   加载所有svg
 * @author: pengli
 */

import React from 'react';
import XMLParser from 'react-xml-parser';
import 'isomorphic-fetch';
import LbwJsUtils from 'component/LbwJsUtils';
import axiosForCommon from 'component/axiosForCommon';
const MAPOINT_ICON = {};

/**
 * 加载svg图标
 * @param  {Function} callback [加载成功回调]
 * @param  {[type]}   type    [返回类型： img:图片Image,svg:svg标签] 缺省svg
 * @return {[type]}            [description]
 */
export let loadMapointIcons = (callback, type, path = '../images/') => {
    let loadedCount = 0;
    fetch(`${path}mapoint_icons.svg`).then(res => res.text()).then(res => {
        let xmlParser =  new XMLParser();
        let jsonDataFromXml = xmlParser.parseFromString(res);
        // 每一个图标只有一个g标签
        let elems = jsonDataFromXml.getElementsByTagName('g');
        // g标签个数为图标个数
        let iconCount = elems.length;
        elems.forEach(element => {
            // 将g标签存储,有可能在此基础上修改颜色
            if (type) {
                MAPOINT_ICON[element.attributes.id] = element;
            } else {
                let pathEle = element.getElementsByTagName('path');
                let pathStr = '';
                if (pathEle && pathEle.length > 0) {
                    pathEle.forEach(path => {
                        path.attributes.fill = '#696969';
                        pathStr += xmlParser.toString(path);
                    });
                }

                let src = 'data:image/svg+xml;base64,' +
                    window.btoa(('<svg class="icon" width="200px" height="200.00px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">' +
                        pathStr +
                        '</svg>').replace(/"/g, "'"));
                // MAPOINT_ICON[element.attributes.id] = src;

                let iconImg = new Image();
                iconImg.onload = function() {
                    MAPOINT_ICON[element.attributes.id] = this;
                    loadedCount++;
                    if (loadedCount === iconCount) {
                        callback && callback({
                            code: 1,
                            icons: MAPOINT_ICON
                        });
                    }
                }
                iconImg.src = src;
            }
        });
        if (type) {
            callback && callback({
                code: 1,
                icons: MAPOINT_ICON
            });
        }
    }, error => callback && callback({
        code: 0
    }));
}

/**
 * 加载有颜色的base64 img src
 * @param  {[type]} element [<g>]
 * @param  {[type]} color   [颜色]
 * @return {[type]}         [description]
 */
export let loadMapointImgSrcWithColor = (element, color) => {
    if (!element) {
        return '';
    }
    let xmlParser =  new XMLParser();
    let pathEle = element.getElementsByTagName('path');
    let pathStr = '';
    if (pathEle && pathEle.length > 0) {
        pathEle.forEach(path => {
            path.attributes.fill = color || '#696969';
            pathStr += xmlParser.toString(path);
        });
    }
    return 'data:image/svg+xml;base64,' +
        window.btoa(('<svg class="icon" width="200px" height="200.00px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">' +
            pathStr +
            '</svg>').replace(/"/g, "'"));
}

function toImage(src) {
    return new Promise((resolve) => {
        let iconImg = new Image();
        iconImg.onload = function() {
            resolve(iconImg);
        }
        iconImg.src = src;
    })
}

/**
 * 根据供应商获取图纸
 * @param supplierFactory
 * @param searchText
 * @param flag： esh:esh首页 swpaam: 风险作业首页
 */
export const getAllPageImageData = (_supplierFactory, searchText, flag, isFirstLoad) => {
    return new Promise((resolve, reject) => {
        let param = {};
        if (_supplierFactory) {
            param.supplierFactory = _supplierFactory;
        }
        if(searchText) {
            param.searchText = searchText;
        }
        let url = (flag === 'esh' || flag === 'riskcc') ?
            'getCfiBuildAndWsaaImgInfoListBySupplierFactory' :
            flag === 'consaas' ?
                'getAreaBasicImageAndConAppFormInfoListBySupplier'
                :
                'getAreaBasicImageInfoListBySupplierFactory';
        let state = {
            loading: false,
            loadCompeleted: true,
            isFirstLoad: !!isFirstLoad
        };
        axiosForCommon(url, param, result => {
            let cfiBuildAndWsaaBaseImgInfo = (flag === 'esh' || flag === 'riskcc') ? (result.cfiBuildAndWsaaBaseImgInfo || {}) : result;
            let buildInfoAndPicList = isNotEmpty(cfiBuildAndWsaaBaseImgInfo) ? [cfiBuildAndWsaaBaseImgInfo] : [];
            if (cfiBuildAndWsaaBaseImgInfo.supplierFactory) {
                state.supplierFactory = cfiBuildAndWsaaBaseImgInfo.supplierFactory;
            }
            let _result = formatInfoList(buildInfoAndPicList);
            // 处理数据 id name list
            state.buildInfoAndPicList = buildInfoAndPicList;
            state.dataSourceTemp = _result.dataSourceTemp;
            Object.assign(state, _result.state);
            // 根据当前图纸查询统计数据
            resolve(state);
        }, error => {
            reject(state);
            LbwJsUtils.notification(error);
        })
    })
}

/**
 * 楼层级别整合数据and2级->1级->0级图纸查找
 * @param  {[type]} list [description]
 * @return {[type]}      [description]
 */
export const formatInfoList = (list) => {
    let dataSourceTemp = [];
    let areaDrawingBaseImageInfo = {};
    let state = {};
    // 直接传入层级，2:从建筑群下开始查找；1:从建筑下开始查找
    list.map(supp => {
        if (!isNotEmpty(areaDrawingBaseImageInfo) && isNotEmpty(supp.imgList)) {
            areaDrawingBaseImageInfo = supp.imgList[0];
            state.baseImageId = areaDrawingBaseImageInfo.areaDrawingBaseImageId;
            state.pageLevel = 2;
            state.pageId = supp.supplierFactory;
        }
        dataSourceTemp.push({
            supplierFactoryName: supp.supplierFactoryName,
            supplierFactory: supp.supplierFactory,
            imgList: supp.imgList || [],
            isComplex: true
        });
        supp.buildingInfoList.map(building => {
            if (!isNotEmpty(areaDrawingBaseImageInfo) && isNotEmpty(building.buildingFloorInfoList)) {
                areaDrawingBaseImageInfo = {
                    buildingId: building.buildingId
                }
                state.pageLevel = 1;
                state.pageId = building.buildingId;
            }
            dataSourceTemp.push({
                supplierFactory: supp.supplierFactory,
                supplierFactoryName: supp.supplierFactoryName,
                buildingId: building.buildingId,
                buildingName: building.buildingName,
                imgList: building.imgList,
                isBuilding: true
            });
            building.buildingFloorInfoList.map(floor => {
                floor.floor = floor.floor || '';
                if (!isNotEmpty(areaDrawingBaseImageInfo) && floor.imgList.some(img => img.isOverview === 'Y')) { // 总览图
                    let img = floor.imgList.filter(pic => pic.isOverview === 'Y')[0];
                    areaDrawingBaseImageInfo = img || {};
                    state.baseImageId = img.areaDrawingBaseImageId;
                    state.pageLevel = 0;
                    state.pageId = building.buildingId;
                    state.floorId = floor.floor || '';
                }
                if (!isNotEmpty(areaDrawingBaseImageInfo) && floor.imgList.some(img => img.isOverview === 'N')) {
                    let img = floor.imgList.filter(pic => pic.isOverview === 'N')[0];
                    areaDrawingBaseImageInfo = img || {};
                    state.baseImageId = img.areaDrawingBaseImageId;
                    state.pageLevel = 0;
                    state.pageId = building.buildingId;
                    state.floorId = floor.floor || '';
                }
                dataSourceTemp.push({
                    supplierFactory: supp.supplierFactory,
                    supplierFactoryName: supp.supplierFactoryName,
                    buildingId: building.buildingId,
                    buildingName: building.buildingName,
                    floor: floor.floor || '',
                    imgList: floor.imgList || [],
                    isFloor: true
                });
                return floor;
            });
            return building;
        });
        return supp;
    });
    state.areaDrawingBaseImageInfo = areaDrawingBaseImageInfo;
    return {
        dataSourceTemp,
        state
    }
}

/**
 * 双击区域跳转到对应图纸
 * 前提有关联：建筑群平面图区域进入关联建筑的楼层（该建筑下第一个有总览图的楼层）总览图；总览图上区域进入关联的平面图
 * @param  {[type]} area [description]
 * @return {[type]}      [description]
 */
export const handleToBaseImageInfo = (option, _this) => {
    if (option.baseImageId) { // 图纸点击跳转
        let target = option.areaDrawingBaseImageInfo;
        _this.imageMenu && _this.imageMenu.handleChangeMenuItem({
            key: `img_${target.areaDrawingBaseImageId}`,
            keyPath: ['', `floor_${target.buildingId}_${target.floor || ''}`]
        })
    } else {
        // 判断areaRelInfoList为空，则没有关联
        if (isNotEmpty(option.areaRelInfoList)) {
            let target = option.areaRelInfoList[0].buildingId;
            if (target) {
                // 跳转到图纸区域关联的建筑图纸（默认第一张）
                _this.imageMenu && _this.imageMenu.handleChangeMenuItem({
                    key: `build_${target}`,
                })
                return;
            }
            target = option.areaRelInfoList[0].areaDrawingBaseImageId;
            if (target) {
                // 跳转到关联的同层图纸
                _this.imageMenu && _this.imageMenu.handleChangeMenuItem({
                    key: `img_${target}`,
                    keyPath: ['', `floor_${_this.state.pageId}_${_this.state.floorId || ''}`]
                })
            }
        }
    }
}

/**
 * 点击切换到相应图纸
 * @param state
 * @param currentState 当前state
 * @param flag 'esh':esh首页展示
 */
export const handleChangeBaseImageInfo = (state, currentState, flag, callBack) => {
    let areaDrawingBaseImageInfo = state.areaDrawingBaseImageInfo;
    if (!isNotEmpty(areaDrawingBaseImageInfo)) {
        callBack(state);
        return;
    }
    // 图纸未改变,有可能数据也没有改变，直接将loading置为false
    if ((isNotEmpty(currentState.baseImageId) && currentState.baseImageId === state.baseImageId)
        || (isNotEmpty(currentState.pageId) && currentState.pageId === state.pageId && state.pageLevel === 1 && currentState.pageLevel === 1)
    ) {
        state.loading = false;
    } else {
        callBack({loading: true});
    }
    // state.pageLevel === 1 点击建筑 找到对应建筑
    if (state.pageLevel === 1) {
        let buildingId = areaDrawingBaseImageInfo.buildingId;
        let buildInfoAndPicList = state.buildInfoAndPicList || currentState.buildInfoAndPicList;
        let buildingInfoList = buildInfoAndPicList[0].buildingInfoList;
        let buildingInfoItem = buildingInfoList.filter(obj => obj.buildingId === buildingId)[0] || {};
        let buildingFloorInfoList = buildingInfoItem.buildingFloorInfoList || [];
        let allPromise = [];
        for (let floor of buildingFloorInfoList) {
            let imgList = floor.imgList  || [];
            // 如果该建筑下楼层imgList有值 直接取楼层图纸显示 若没有直接显示默认图
            if (imgList.length) {
                let newImg = {};
                for (let img of imgList) {
                    if (img.isOverview === 'Y') {
                        newImg = img;
                        break;
                    } else {
                        newImg = imgList[0];
                    }
                }
                let param = {
                    areaDrawingBaseImageId: newImg.areaDrawingBaseImageId,
                    supplierFactory: currentState.supplierFactory
                };
                allPromise.push(getInfo(param, flag));
            }
        }
        Promise.all(allPromise).then(promiseResult => {
            // 记录查出来的结果如果只有一个楼层中并且只有一张图片，则转到0级
            if (promiseResult.length === 1) {
                state.areaDrawingBaseImageInfo = promiseResult[0];
                state.baseImageId = promiseResult[0].areaDrawingBaseImageId;
                state.pageLevel = 0;
                state.pageId = promiseResult[0].buildingId;
                state.floorId = promiseResult[0].floor || '';
            } else {
                state.areaDrawingBaseImageInfo = promiseResult;
            }
            callBack(state);
        }).catch(() => {
            callBack(state);
        })
    } else {
        let param = {
            areaDrawingBaseImageId: state.baseImageId,
            supplierFactory: currentState.supplierFactory
        };
        if (flag === 'esh') {
            axiosForCommon('getAreaDrawBaseImgStatisInfoByAreaDrawBaseImgId', param, result => {
                state.areaDrawingBaseImageInfo = isNotEmpty(result.areaDrawingBaseImageInfo) ? result.areaDrawingBaseImageInfo : state.areaDrawingBaseImageInfo;
                callBack(state);
            }, error => {
                callBack(state);
                LbwJsUtils.notification(error);
            })
        } else if (flag === 'riskcc') {
            axiosForCommon('getRiskAreaLevelStatisticsByBasicImgId', param, result => {
                state.areaDrawingBaseImageInfo = isNotEmpty(result.areaDrawBaseImgInfoMap) ? result.areaDrawBaseImgInfoMap : state.areaDrawingBaseImageInfo;
                callBack(state);
            }, error => {
                callBack(state);
                LbwJsUtils.notification(error);
            })
        } else {
            axiosForCommon('getSafeWorkPermitStatisticsInfoByAreaBaseImgId', param, result => {
                state.areaDrawingBaseImageInfo = isNotEmpty(result.areaDrawBaseImgInfoMap) ? result.areaDrawBaseImgInfoMap : state.areaDrawingBaseImageInfo;
                callBack(state);
            }, error => {
                callBack(state);
                LbwJsUtils.notification(result);
            })
        }
    }
}

/**
 * 获取单张图纸详细信息（包括区域标记）
 * @param param
 * @param flag 'esh':esh首页
 * @returns {Promise<any>}
 */
const getInfo = (param, flag) => {
    return new Promise((resolve, reject) => {
        if (flag === 'esh') {
            axiosForCommon('getAreaDrawBaseImgStatisInfoByAreaDrawBaseImgId', param, result => {
                resolve(result.areaDrawingBaseImageInfo);
            }, error => {
                reject();
                LbwJsUtils.notification(error);
            });
        } else if (flag === 'riskcc') {
            axiosForCommon('getRiskAreaLevelStatisticsByBasicImgId', param, result => {
                resolve(result.areaDrawBaseImgInfoMap);
                callBack(state);
            }, error => {
                reject();
                LbwJsUtils.notification(error);
            })
        } else {
            axiosForCommon('getSafeWorkPermitStatisticsInfoByAreaBaseImgId', param, result => {
                resolve(result.areaDrawBaseImgInfoMap);
            }, error => {
                reject();
                LbwJsUtils.notification(error);
            });
        }
    })
}
export function closeMarkInfo(id) {
    $('#mark-info-block-' + id).fadeOut();
}
export function showMarkInfo(id) {
    // 当前点击的信息显示，同级元素的信息消失
    $('#mark-info-block-' + id).fadeIn().siblings('.mark-info-block').fadeOut();
}
export function removeAllMarkIconInfo() {
    $('.mark-icon-block').remove();
    $('.mark-info-block').remove();
}
export function closeAllMarkInfo() {
    $('.mark-info-block').fadeOut();
}

