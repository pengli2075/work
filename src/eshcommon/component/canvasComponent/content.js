/**
 * 地图绘制
 * @author: pengli
 * @param  {[function]} f [description]
 * @return {[type]}   [description]
 * 1.设置canvas
 * 2.设置地图并开始绘制区域、标记 beginDraw
 * 如果有一个需要闪动的区域就要执行动画
 */
const canvasUtils = require('./canvasUtils');
const CommonFunction = require('./index');
const default_bg_image_name = '../images/default-map.png';
const yScale = 0.5; // y轴缩放值
const tan = -0.5;    // x轴倾斜值 tanX = 0.5
const imgSpace = 100;    // 多层底部预留空间
const imgOffset = 200;    // 图片间距

// export default const f =() => {
//     return 
// }
const content = (function (f) {
    // 利用屏幕刷新率刷新
    window.requestAnimation = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.msquestAnimationFrame ||
            function(callback) {
                setTimeout(callback, 1000/60);
            }
    })();
    return {
        f: f(),
        CanvasJs: function () {
            return f().apply(this, arguments);
        }
    }
    // module.exports = f();
    // module.exports.canvasJs = function () {
    //     return f().apply(this, arguments);
    // };
})(function () {
    function CanvasJs(obj) {
        _setCanvas.call(this, obj);

        this.currentCanvasPoints = [];
        this.movePoints = [];
        this.mousePressed = false;
        this.areaIndex = -1;
        this.canvasStep = 0;
        this.pagePushArray = '[]';
        this.default_bg_image = new Image();
        this.tempStamp = 0;
        this.defaultBlur = 30;
        this.blur = this.defaultBlur;
        this.add = false;

        this._options = {
            value: {},
            contentId: '',
            isTrack: true,
            isNeedScale: true,
            isIconTrack: true,  // 鼠标上是否跟踪图标
            isNeedDrag: true,   // 是否可以拖动false:（图纸、区域、图标）都不能拖动
            isShowArea: true,   // 是否显示区域
            isShowAreaName: true,   // 是否显示区域名称
            isShowMark: true,   // 是否显示标记
            iconSize: 26,
            areaLineColor: '#000000',
            areaNameSize: 20,
            areaNameColor: '#000000',
            fillColor: '#000000',
            selectLineColor: '#000000',
            drawType: 'select',
            imgPath: 'stream?contentId=',
            MARK_ICON: {},
            embedIcons: {},
            listKey: 'areaDrawingAreaDataList',
            iconKey: 'iconId',
            isSearching: false,
            filterValue: [],
            selectIconInfo: {},
            areaNameVertical: 'N', // N: 文字横版 Y: 文字竖版（排列时文字垂直居中显示）
        };
    }

    function _setCanvas(obj) {
        this.canvas = obj;
        this.canvas_context = obj.getContext('2d');
        canvasUtils.trackTransforms(this.canvas_context);
    }

    // 开始绘制
    function _beginDraw(flag) {
        // 判断数据中是否有报警
        const {listKey, value} = this._options;
        // 存放整个操作下来的数据源，为了跟撤销重做操作平行
        this.pagePushArray = JSON.stringify(this._options.value ? [this._options.value] : []);
        _setValueAndBgImage.call(this, flag);
        // addListener
        if (flag) {
            _addListener.call(this);
        }
        setTimeout(() => {
            if (isNotEmpty(value[listKey]) && value[listKey].some(item => item.status && item.type !== 'icon')) {
                loop.call(this);
            }
        }, 1000);
    }

    /**
     * 绘制
     * @param {[type]} flag true:初始化，需要设置底图
     */
    function _setValueAndBgImage(flag) {
        // 初次绘制才需要设置初始背景图
        let value = JSON.parse(JSON.stringify(this._options.value || {}));

        if (this._options.isAllLayer) { // 多楼层堆叠图
            this._options.contentId = value[value.length - 1].contentId;
        } else {
            this._options.contentId = value.contentId;
        }

        if (flag) {
            _setDefaultImg.call(this, this._options.contentId);
        } else {
            _redraw.call(this, null, null, true);
        }
    }

    /**
     * 最后一张图片中的区域不通过克隆canvas绘制
     * @param imgInfo
     * @param flag 是否是最后一张图
     */
    function _loadImage(imgInfo, flag) {
        return new Promise(resolve => {
            let img = new Image();
            if (flag) {
                img.onload = () => {
                    resolve({
                        img,
                        contentId: imgInfo.contentId
                    });
                }
                img.src = !imgInfo.contentId ? default_bg_image_name : `${this._options.imgPath}${imgInfo.contentId}`;
            } else {
                img.onload = () => {
                    let newImg = new Image();
                    newImg.onload = () => {
                        resolve({
                            img: newImg,
                            contentId: imgInfo.contentId
                        });
                    };
                    newImg.src = _getBgImageByCloneCanvas.call(this, img, imgInfo);
                }
                img.src = !imgInfo.contentId ? default_bg_image_name : `${this._options.imgPath}${imgInfo.contentId}`;
            }
        })
    }

    /**
     * 通过克隆canvas获取并设置底图及区域
     * @param img 图片 new image
     * @param imgInfo 图纸及区域信息
     */
    function _getBgImageByCloneCanvas(img, imgInfo) {
        const {listKey, isShowArea, isShowAreaName} = this._options;
        // 克隆canvas，为底图大小
        let newCanvas = document.createElement('canvas');
        let context = newCanvas.getContext('2d');
        canvasUtils.trackTransforms(context);
        let W = img.naturalWidth;
        let H = img.naturalHeight;

        let ratio = canvasUtils.getPixelRatio(context);
        newCanvas.width = W * ratio;
        newCanvas.height = H * ratio;
        context._drawImage(img, 0, 0, W, H);

        // 绘制区域
        let areaDes = _getInitConfig.call(this);
        let list = imgInfo[listKey] || [];
        list.map(item => {
            if (isShowArea) {
                let areaCoordinates = JSON.parse(item.areaCoordinates || '[]');
                context.beginPath();
                if (areaCoordinates.length > 2) {
                    areaCoordinates.map((sub, i) => {
                        if (i === 0) {
                            context._moveTo(sub[0], sub[1]);
                        } else {
                            context._lineTo(sub[0], sub[1]);
                        }
                    });
                } else {
                    areaCoordinates = areaCoordinates.map((sub, i) => {
                        return [sub[0], sub[1]];
                    })
                    let pt001 = areaCoordinates[0], pt002 = areaCoordinates[1];
                    let r = canvasUtils.dist(pt001, pt002);
                    context.arc(pt002[0] * ratio, pt002[1] * ratio, r * ratio, 0 * Math.PI, 2 * Math.PI);
                }
                context.save();
                context.setLineWidth(2);
                let fillColor = '';
                let isStroke = true;
                if (item.status) {
                    context.fillStyle = item.color;
                    context.shadowBlur = this.blur;
                    context.shadowColor = item.color;
                    context.strokeStyle = item.color;
                    fillColor = item.color;
                } else {
                    if (areaDes.fillColorKey) {
                        fillColor = item[areaDes.fillColorKey];
                    } else {
                        fillColor = item.fillColor || areaDes.fillColor;
                    }
                    if (fillColor) {
                        context.fillStyle = canvasUtils.hexToRgba(fillColor);
                        if (areaDes.fillColorKey && item[areaDes.fillColorKey]) { // 不画线了
                            isStroke = false;
                        }
                    }
                }
                context.closePath();
                fillColor && context.fill();
                isStroke && context.stroke();
                context.restore();
            }
            if (item.areaName) {
                let areaNameCoordinate = JSON.parse(item.areaNameCoordinate);
                if (isShowAreaName) {
                    if (item.status) {
                        context.fillStyle = areaDes.areaNameColor;
                    } else {
                        context.fillStyle = item.areaNameColor || areaDes.areaNameColor;
                    }
                    if (item.areaNameVertical === 'Y' || areaDes.areaNameVertical === 'Y') {
                        context.fillTextVertical(item.areaName, areaNameCoordinate[0], areaNameCoordinate[1], item.areaNameSize || areaDes.areaNameSize);
                    } else {
                        context._fillText(item.areaName, areaNameCoordinate[0], areaNameCoordinate[1], item.areaNameSize || areaDes.areaNameSize);
                    }
                }
            }
        })
        // 转为图片格式并缓存
        return newCanvas.toDataURL();
    }

    function _setDefaultImg(contentId) {
        const {isAllLayer, value} = this._options;
        if (isAllLayer) {
            this.default_bg_image = [];
            let promiseImg = [];
            value.forEach((obj, index) => {
                promiseImg.push(_loadImage.call(this, obj, index === value.length - 1));
            });
            Promise.all(promiseImg).then(result => {
                // 图片加载完成再绘制，保证图片unload的顺序跟数据源保持一致
                this.default_bg_image = result;
                _redraw.call(this, '', value, true);
            }).catch(error => {
                console.log(error);
            })
        } else {
            this.default_bg_image.onload = () => {
                _redraw.call(this, '', value, true);
            }
            this.default_bg_image.onerror = () => {
                if (typeof (this._onOverEvent) === 'function') {
                    this._onOverEvent.call(this, {
                        mode: 'img load error'
                    })
                }
            }
            this.default_bg_image.src = !contentId ? default_bg_image_name : `${this._options.imgPath}${contentId}`;
        }
    }

    function canvasClick(e) {
        //写单击事件要干的事
        const {drawType, selectIconInfo} = this._options;
        const {canvas_context, canvas} = this;
        let point = [e.offsetX, e.offsetY];
        let pt = canvas_context.transformedPoint(point[0], point[1]);

        let clickArea = _getClickArea.call(this, pt);
        if (clickArea) {
            if (typeof (this._onOverEvent) === 'function') {
                this._onOverEvent.call(this, {
                    mode: 'click',
                    option: clickArea,
                    point: point,
                    drawType: drawType
                })
            }
        }
        switch (drawType) {
            case 'beeline':
                this.currentCanvasPoints.push(pt);
                _drawChart.call(this, 1);
                break;
            case 'mark':
                // add mark
                if (isNotEmpty(selectIconInfo)) {
                    let areaCoordinates = _getIconAreaCoordinates.call(this, point);
                    let item = {
                        type: 'icon',
                        xCoordinate: parseInt(pt[0]),
                        yCoordinate: parseInt(pt[1]),
                        areaCoordinates: JSON.stringify(areaCoordinates),
                        insPointList: []
                    };
                    item = Object.assign({}, selectIconInfo, item);
                    _addMark.call(this, item);
                    if (typeof (this._onCompleteMark) === 'function') {
                        this._onCompleteMark.call(this, {
                            option: item
                        }, () => {
                            // 标记完后绘制一个鼠标上的图标
                            _drawTemp.call(this, pt);
                        });
                    } else {
                        // 标记完后绘制一个鼠标上的图标
                        _drawTemp.call(this, pt);
                    }
                } else {
                    if (typeof (this._onOverEvent) === 'function') {
                        this._onOverEvent.call(this, {
                            mode: 'unselect',
                            drawType
                        });
                    }
                }
                break;
            case 'config':
                // 可拖动后不进行配置
                // if (dragged) {
                //     return;
                // }
                // 判断当前点击的点是否在所画区域内 在，所在区域是否设置过名称 是，编辑。 否，添加。 不在，不去设置名称
                // 逻辑修改后绘制完区域立即设置名称，所以此处肯定是有名称的，即编辑
                if (clickArea) {
                    this.areaIndex = clickArea.i;
                    if (clickArea.type !== 'icon') {
                        // config area
                        let param = {
                            pageType: 'edit',
                            type: 'area',
                            points: [parseInt(pt[0]), parseInt(pt[1])]
                        }
                        param = Object.assign(_getInitConfig.call(this), param, clickArea);
                        if (typeof (this._onAreaConfiguration) === 'function') {
                            this._onAreaConfiguration.call(this, param, (newParam) => {});
                        }
                    } else {
                        // 根据点击的点获取在原始坐标系上的坐标
                        let _pt = canvas_context.transformedOriginPoint(clickArea.xCoordinate, clickArea.yCoordinate);
                        let canvasOffset = $(canvas).offset();
                        // config mark
                        // 传出绑定信息及点位,点位是在图纸上的相对坐标
                        if (typeof (this._onMarkConfiguration) === 'function') {
                            this._onMarkConfiguration.call(this, {...[clickArea, [_pt[0] + canvasOffset.left, _pt[1] + canvasOffset.top]]});
                        }
                    }
                } else {
                    // 取消选中
                    _redraw.call(this, 'clear');
                    if (typeof (this._onOverEvent) === 'function') {
                        this._onOverEvent.call(this, {mode: 'unselect'});
                    }
                }
                break;
            case 'curve':
            case 'circle':
                break;
            default:
                // select area or mark
                let isSelect = false;
                // 判断是否选择某个元素,高亮选中的块
                // 区域：块高亮；标记：边框选中
                if (clickArea) {
                    isSelect = true;
                    this.areaIndex = clickArea.i;

                    // 选中后当作有筛选条件高亮
                    this.setOptions.call(this, {
                        isSearching: true,
                        filterValue: [clickArea]
                    });
                    _redraw.call(this);
                }

                if (!isSelect) { // 取消选中
                    _redraw.call(this, 'clear');
                }
                break;
        }
    }

    function _addListener() {
        // 按 Esc 结束绘制
        $(this.canvas).off('keydown').on('keydown', e => {
            let event = e || window.event;
            if (event && event.keyCode === 27) {
                const {drawType} = this._options;
                if (drawType === 'beeline' || drawType === 'curve' || drawType === 'mark' || drawType === 'circle') {
                    // 绘制时，直接结束
                    _redraw.call(this, 'esc');
                    if (typeof (this._onOverEvent) === 'function') {
                        this._onOverEvent.call(this, {
                            mode: 'keydown',
                            drawType
                        })
                    }
                }
            }
        });
        const {isNeedScale} = this._options;
        if (isNeedScale) {
            this.canvas.addEventListener('DOMMouseScroll', (e) => _handleScroll.call(this, e), false);
            this.canvas.addEventListener('mousewheel', (e) => _handleScroll.call(this, e), false);
        }

        $(this.canvas).off('contextmenu').on('contextmenu', e => {
            e = e || window.event;
            e.preventDefault();
            const {drawType} = this._options;
            // 当在绘制时右键可取消
            if (drawType === 'beeline' || drawType === 'curve' || drawType === 'mark' || drawType === 'circle') {
                // 绘制时，直接结束
                _redraw.call(this, 'esc');
                if (typeof (this._onOverEvent) === 'function') {
                    this._onOverEvent.call(this, {
                        mode: 'contextmenu',
                        drawType
                    })
                }
            }
        });

        // 每一个canvas添加监听事件
        // let lastX = 0, lastY = 0;
        let dragStart, dragged, draggedEle;
        let timeoutID = null;
        $(this.canvas).off('dblclick').on('dblclick', e => {
            clearTimeout(timeoutID);
            const {drawType, isAllLayer} = this._options;
            const {canvas_context} = this;
            let point = [e.offsetX, e.offsetY];
            let pt = canvas_context.transformedPoint(point[0], point[1]);
            let clickArea = null;
            if (isAllLayer) {
                clickArea = _getClickImage.call(this, pt);
            } else {
                clickArea = _getClickArea.call(this, pt);
            }
            if (clickArea) {
                if (typeof (this._onOverEvent) === 'function') {
                    this._onOverEvent.call(this, {
                        mode: 'dblclick',
                        option: clickArea,
                        point: point,
                        drawType: drawType
                    })
                }
            }
        })
        $(this.canvas).off('click').on('click', e => {
            if (!this._options.isNeedDrag) return;
            clearTimeout(timeoutID);
            if (this._options.drawType === 'beeline') {
                canvasClick.call(this, e);
            } else {
                timeoutID = window.setTimeout(() => {
                    canvasClick.call(this, e);
                }, 200);
            }
        });

        $(this.canvas).off('mousedown').on('mousedown', e => {
            if (!this._options.isNeedDrag) return;
            const {canvas_context, areaIndex} = this;
            const {drawType, mode, listKey, value} = this._options;
            let point = [e.offsetX, e.offsetY];
            let pt = canvas_context.transformedPoint(point[0], point[1]);
            switch (drawType) {
                case 'beeline':
                    if (!this.mousePressed) {
                        this.mousePressed = true;
                    }
                    break;
                case 'curve':
                    this.mousePressed = true;
                    this.currentCanvasPoints = [];
                    canvas_context.beginPath();
                    this.currentCanvasPoints.push(pt);
                    break;
                case 'circle':
                    this.mousePressed = true;
                    this.currentCanvasPoints = [];
                    this.currentCanvasPoints.push(pt);
                    break;
                default:
                    if (areaIndex > -1 && mode !== 'statistics') { // 有选中的元素&鼠标位置在选中元素中
                        let areaCoordinates = JSON.parse(value[listKey][areaIndex].areaCoordinates || '[]');
                        if (canvasUtils.PointInPoly(pt, areaCoordinates)) {
                            dragStart = pt;
                            draggedEle = true;
                            dragged = false;
                        }
                    } else {
                        // lastX = point[0];
                        // lastY = point[1];
                        dragStart = pt;
                        dragged = false;
                    }
                    break;
            }
        });

        $(this.canvas).off('mousemove').on('mousemove', e => {
            const {canvas_context, areaIndex} = this;
            const {drawType, isTrack, selectIconInfo, selectLineColor, isIconTrack, iconKey, listKey, isAllLayer} = this._options;
            // 计算鼠标是否在一块区域或标记上
            let point = [e.offsetX, e.offsetY];
            let pt = canvas_context.transformedPoint(point[0], point[1]);
            let clickArea = null;
            if (isAllLayer) {
                // clickArea = _getClickImage.call(this, pt);
            } else {
                clickArea = _getClickArea.call(this, pt);
            }
            if (clickArea) {
                if (typeof (this._onOverEvent) === 'function') {
                    this._onOverEvent.call(this, {
                        mode: 'move',
                        option: clickArea,
                        point: point,
                        drawType
                    })
                }
                $(this.canvas).css({cursor: 'pointer'});
            } else {
                $(this.canvas).css({cursor: 'default'});
            }
            if (isTrack) {
                let trackDiv = null;
                if (!document.getElementById('track-div')) {
                    trackDiv = document.createElement('div');
                    trackDiv.id = 'track-div';
                    document.body.appendChild(trackDiv);
                }

                trackDiv = document.getElementById('track-div');
                trackDiv.style.top = (e.pageY + 10) + 'px';
                trackDiv.style.left = (e.pageX + 10) + 'px';
                trackDiv.style.padding = '5px';
                trackDiv.innerHTML = (e.offsetX >= 0 && e.offsetY >= 0) ? e.offsetX + ', ' + e.offsetY : '';
            }
            // 离开后清空
            this.canvas.addEventListener('mouseout', ev => {
                let trackDiv = document.getElementById('track-div');
                if (trackDiv && !isNotEmpty(selectIconInfo)) {
                    trackDiv.innerHTML = '';
                    trackDiv.style.padding = '0px';
                }
            });

            let areaDes = _getInitConfig.call(this);
            switch (drawType) {
                case 'beeline':
                    _redraw.call(this);
                    if(this.mousePressed) {
                        // 绘制的点也需要根据指数缩放
                        if (this.currentCanvasPoints.length > 0) {
                            this.movePoints = this.currentCanvasPoints.slice();
                            this.movePoints.push(pt);
                            _drawChart.call(this, 2);
                        }
                    } else {
                        canvas_context._arc(pt[0], pt[1], 5, selectLineColor || areaDes.areaLineColor);
                    }
                    break;
                case 'curve':
                    _redraw.call(this);
                    if(this.mousePressed) {
                        // 绘制线
                        this.currentCanvasPoints.push(pt);
                        let points = this.currentCanvasPoints;
                        canvas_context.beginPath();
                        canvas_context._moveTo(points[0][0], points[0][1]);
                        for (let i = 1; i < points.length; i++) {
                            canvas_context._lineTo(points[i][0], points[i][1]);
                        }
                        canvas_context.setLineWidth(2);
                        canvas_context.strokeStyle = selectLineColor || areaDes.areaLineColor;
                        canvas_context.stroke();
                    }
                    canvas_context._arc(pt[0], pt[1], 5, selectLineColor || areaDes.areaLineColor);
                    break;
                case 'circle':
                    _redraw.call(this);
                    if(this.mousePressed) {
                        // 绘制的点也需要根据指数缩放
                        if (this.currentCanvasPoints.length > 0) {
                            this.movePoints = this.currentCanvasPoints.slice();
                            this.movePoints.push(pt);
                            let r = canvasUtils.dist([this.movePoints[this.movePoints.length - 1][0], this.movePoints[this.movePoints.length - 1][1]], [this.currentCanvasPoints[0][0], this.currentCanvasPoints[0][1]])
                            canvas_context._arc(pt[0], pt[1], r, null, 2, selectLineColor || areaDes.areaLineColor, true);
                        }
                    }
                    canvas_context._arc(pt[0], pt[1], 5, selectLineColor || areaDes.areaLineColor);
                    break;
                case 'mark':
                    // 在鼠标位置绘制已选择图标
                    if (isNotEmpty(selectIconInfo) && isIconTrack) {
                        _redraw.call(this);
                        _drawTemp.call(this, pt);
                    }
                    break;
                default:
                    if (draggedEle) {
                        if (dragged === false) {dragged = true}
                        if (dragStart) {
                            // 去掉拖动的这个icon绘制
                            let value = JSON.parse(JSON.stringify(this._options.value));
                            let item = value[listKey][areaIndex];
                            value[listKey].splice(areaIndex, 1);
                            _redraw.call(this, '', value);

                            if (item.type === 'icon') {
                                draggedEle = 'icon';
                                // icon 一半宽度在当前坐标系大小
                                let _item = {
                                    xCoordinate: parseInt(pt[0]),
                                    yCoordinate: parseInt(pt[1]),
                                    [iconKey]: item[iconKey]
                                };
                                _drawMark.call(this, Object.assign({}, item, _item));
                            } else {
                                draggedEle = 'area';
                                _drawArea.call(this, item, pt[0] - dragStart[0], pt[1] - dragStart[1]);
                            }
                        }
                    } else {
                        if (dragged === false) {dragged = true}
                        if (dragStart) {
                            canvas_context._translate(pt[0] - dragStart[0], pt[1] - dragStart[1]);
                            _redraw.call(this);
                        }
                    }
                    break;
            }
        });

        $(this.canvas).off('mouseup').on('mouseup', e => {
            const {canvas_context} = this;
            const {drawType, selectLineColor, listKey} = this._options;
            let point = [e.offsetX, e.offsetY];
            let pt = canvas_context.transformedPoint(point[0], point[1]);
            if (drawType === 'curve') {
                if (this.mousePressed && this.currentCanvasPoints.length > 10) {
                    this.currentCanvasPoints.push(this.currentCanvasPoints[0]);
                    this.mousePressed = false;

                    let param = {
                        pageType: 'create',
                        type: 'area',
                        points: this.currentCanvasPoints.map(item => {
                            return [parseInt(item[0]), parseInt(item[1])];
                        }),
                        areaLineColor: selectLineColor
                    }
                    param = Object.assign(_getInitConfig.call(this), param);
                    if (typeof (this._onAreaConfiguration) === 'function') {
                        this._onAreaConfiguration.call(this, param, (newParam) => {});
                    }
                }
                if (this.currentCanvasPoints.length <= 10) {
                    // 结束
                    _redraw.call(this, 'esc');
                }
            } else if (drawType === 'circle') {
                if (this.mousePressed && this.currentCanvasPoints.length > 0 && this.movePoints.length > 0) {
                    this.currentCanvasPoints.push(pt);
                    // 两点之间距离>10
                    let r = canvasUtils.dist([this.movePoints[this.movePoints.length - 1][0], this.movePoints[this.movePoints.length - 1][1]], [this.currentCanvasPoints[0][0], this.currentCanvasPoints[0][1]])
                    this.mousePressed = false;
                    if (r > 10) {
                        let param = {
                            pageType: 'create',
                            type: 'area',
                            points: this.currentCanvasPoints.map(item => {
                                return [parseInt(item[0]), parseInt(item[1])];
                            }),
                            areaLineColor: selectLineColor
                        }
                        param = Object.assign(_getInitConfig.call(this), param);
                        if (typeof (this._onAreaConfiguration) === 'function') {
                            this._onAreaConfiguration.call(this, param, (newParam) => {});
                        }
                    }
                } else {
                    // 结束
                    _redraw.call(this, 'esc');
                }
            } else {
                if (draggedEle && JSON.stringify(dragStart) !== JSON.stringify(point)) {
                    let value = JSON.parse(JSON.stringify(this._options.value));
                    let obj = value[listKey][this.areaIndex];
                    if (draggedEle === 'icon') {
                        let areaCoordinates = _getIconAreaCoordinates.call(this, point);
                        obj.xCoordinate = parseInt(pt[0]);
                        obj.yCoordinate = parseInt(pt[1]);
                        obj.areaCoordinates = JSON.stringify(areaCoordinates);
                    } else {
                        let oldNameC = JSON.parse(obj.areaNameCoordinate || '[]');
                        let oldAreaC = JSON.parse(obj.areaCoordinates);
                        let translate = [pt[0] - dragStart[0], pt[1] - dragStart[1]];
                        obj.areaNameCoordinate = JSON.stringify([parseInt(oldNameC[0] + translate[0]), parseInt(oldNameC[1] + translate[1])]);
                        obj.areaCoordinates = JSON.stringify(oldAreaC.map(item => {
                            return [parseInt(item[0] + translate[0]), parseInt(item[1] + translate[1])];
                        }));
                    }
                    value[listKey][this.areaIndex] = obj;
                    _setValue.call(this, value, true, true);
                } else {
                    // if (!dragged && !manager_this.mousePressed) manager_this.canvas_helper.zoom(e.shiftKey ? -1 : 1, lastX, lastY);
                }
                this.areaIndex = -1;
            }
            dragStart = null;
            draggedEle = false;
        });
    }

    /**
     * [new area]
     * @param  {[type]} area [description]
     * @return {[type]}      [description]
     */
    function _addArea(area) {
        // 添加区域时默认将名称位置确定为区域重心显示
        area.areaNameCoordinate = JSON.stringify(canvasUtils.getCenterOfGravityPoint(JSON.parse(area.areaCoordinates)));
        const {listKey} = this._options;
        let value = JSON.parse(JSON.stringify(this._options.value));
        if (value[listKey]) {
            value[listKey].push(area);
        } else {
            value[listKey] = [area];
        }
        // 重绘时为了清空鼠标上的点-正在绘制的状态
        _setValue.call(this, value, true, true);
        // 清空数据点
        _clearPoints.call(this);
    }

    /**
     * [new mark]
     * @param  {[type]} mark [description]
     * @return {[type]}      [description]
     */
    function _addMark(mark) {
        const {listKey} = this._options;
        let value = JSON.parse(JSON.stringify(this._options.value));
        if (value[listKey]) {
            value[listKey].push(mark);
        } else {
            value[listKey] = [mark];
        }
        // 重绘时为了清空鼠标上的点-正在绘制的状态
        _setValue.call(this, value, true, true);
    }

    function _updateArea(area) {
        const {listKey} = this._options;
        let value = JSON.parse(JSON.stringify(this._options.value));
        let list = value[listKey] || [];
        let currentArea = list[this.areaIndex];
        area.areaNameCoordinate = JSON.stringify(area.points);
        Object.assign(currentArea, area);
        delete currentArea.points;
        delete currentArea.pageType;

        _setValue.call(this, value, true, true);
    }

    /**
     * 配置区域|标记
     * @return {[type]} [description]
     */
    function _handleConfig(areaIndex) {
        areaIndex = areaIndex === undefined ? this.areaIndex : areaIndex;
        const {listKey} = this._options;
        // let areaIndex = this.areaIndex;
        let value = JSON.parse(JSON.stringify(this._options.value));
        let currentArea = value[listKey][areaIndex];
        if (currentArea.type === 'icon') {
            let _pt = this.canvas_context.transformedOriginPoint(currentArea.xCoordinate, currentArea.yCoordinate);
            let canvasOffset = $(this.canvas).offset();

            // 传出绑定信息及点位,点位是在图纸上的相对坐标
            if (typeof (this._onMarkConfiguration) === 'function') {
                this._onMarkConfiguration.call(this, {...[currentArea, [_pt[0] + canvasOffset.left, _pt[1] + canvasOffset.top]]});
            }
        } else {
            // 计算重心
            let pt = canvasUtils.getCenterOfGravityPoint(JSON.parse(currentArea.areaCoordinates));
            let param = {
                pageType: 'edit',
                type: 'area',
                points: pt
            }
            param = Object.assign(_getInitConfig.call(this), param, currentArea);
            if (typeof (this._onAreaConfiguration) === 'function') {
                this._onAreaConfiguration.call(this, param, (newParam) => {});
            }
        }
    }

    /**
     * 绘制直线
     * @param  {[number]} t [1:line 2:move]
     */
    function _drawChart(t) {
        const {canvas_context} = this;
        const {selectLineColor} = this._options;
        let areaDes = _getInitConfig.call(this);
        canvas_context.beginPath();
        let points = [];
        let isFinish = false;
        let zoom = canvas_context.getScale();
        if (t === 1) { // 点击
            points = this.currentCanvasPoints;
            // 当点击的点在绘制第一个点周围10px位置时，将最后一个点位置坐标设置为第一个点坐标
            if (points.length > 3 && Math.abs(points[0][0] - points[points.length - 1][0]) <= 10 / zoom && Math.abs(points[0][1] - points[points.length - 1][1]) <= 10 / zoom) {
                isFinish = true; // 结束绘制
                points[points.length - 1] = this.currentCanvasPoints[0];
            } else {
                canvas_context._arc(points[points.length - 1][0], points[points.length - 1][1], 5, selectLineColor || areaDes.areaLineColor);
            }
        } else {
            points = this.movePoints;
            // 当移动位置的点在绘制第一个点周围10px位置时自动闭合
            if (this.currentCanvasPoints.length > 2 && Math.abs(this.currentCanvasPoints[0][0] - points[points.length - 1][0]) <= 10 / zoom && Math.abs(this.currentCanvasPoints[0][1] - points[points.length - 1][1]) <= 10 / zoom) {
                points[points.length - 1] = this.currentCanvasPoints[0];
                // 自动闭合
            }
            canvas_context._arc(points[points.length - 1][0], points[points.length - 1][1], 5, selectLineColor || areaDes.areaLineColor);
        }
        // 绘制线
        canvas_context._moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            canvas_context._lineTo(points[i][0], points[i][1]);
        }
        // canvas_context.closePath();
        canvas_context.setLineWidth(2);
        canvas_context.strokeStyle = selectLineColor || areaDes.areaLineColor;
        canvas_context.stroke();

        if (t === 1) {
            // 当当前绘制的点超过三个（至少三点一个面） 并且最后一个点跟第一个点的左边相差10个像素就可以闭合路径了
            if (points.length > 3 && isFinish) { // 在附近
                // 区域绘制完成,显示弹框, 返回绘制类型，点，
                let param = {
                    pageType: 'create',
                    type: 'area',
                    points: this.currentCanvasPoints.map(item => {
                        return [parseInt(item[0]), parseInt(item[1])];
                    }),
                    areaLineColor: selectLineColor
                }
                param = Object.assign({}, areaDes, param);
                if (typeof (this._onAreaConfiguration) === 'function') {
                    this._onAreaConfiguration.call(this, param, (newParam) => {});
                }
            }
        }
    }

    /**
     * 设置数据源
     * @param {[type]}  value    [数据源]
     * @param {Boolean} isRedraw [是否需要重绘]
     * @param {Boolean} isPush   [是否需要新增一步]
     */
    function _setValue(value, isRedraw, isPush) {
        // 判断数据中是否有报警
        const {listKey} = this._options;
        if (isNotEmpty(value[listKey]) && value[listKey].some(item => item.status && item.type !== 'icon')) {
            loop.call(this);
        }
        this._options.value = value;
        isRedraw && _redraw.call(this, 'esc');
        if (isPush) {
            _canvasPush.call(this);
            _resetPagePushArray.call(this, value);
        }
        if (typeof (this._onResetDataSource) === 'function') {
            this._onResetDataSource.call(this, value);
        }
    }

    function loop(stamp) {
        window.requestAnimation((time) => loop.call(this, time));
        this.tempStamp = stamp;
        update.call(this);
    }

    function update() {
        if (this.add) {
            if (this.blur > this.defaultBlur) {
                this.add = false;
                this.blur--;
            } else {
                this.blur++;
            }
        } else {
            if (this.blur < 5) {
                this.add = true;
                this.blur++;
            } else {
                this.blur--;
            }
        }
        _redraw.call(this);
    }

    /**
     * 重绘
     * @param  {[type]}  flag    [是否清空绘制时设置的缺省值：点坐标等]
     * @param  {[type]}  value   [需重绘使用到的数据源]
     * @param  {Boolean} isFirst [是否第一次绘制]
     * @return {[type]}          [description]
     */
    function _redraw(isClear, value, isFirst, point) {
        const {listKey, drawType, selectIconInfo, selectLineColor, isAllLayer} = this._options;
        if (isAllLayer) { // 多楼层堆叠图
            value = JSON.parse(JSON.stringify(value || this._options.value));
            for (let i = 0; i < value.length; i++) {
                let _value = value[i];
                _drawBgImage.call(this, isFirst, i);
                if (i === value.length - 1) {
                    _value = JSON.parse(JSON.stringify(_value));

                    (_value[listKey] || []).map((item) => {
                        if (item.type === 'icon') {
                            _drawMark.call(this, item, isFirst);
                        } else {
                            _drawArea.call(this, item);
                        }
                        return item;
                    });
                }
            }
        } else {
            // 开始绘制时操作
            if (typeof (this._onStartDrawing) === 'function') {
                this._onStartDrawing.call(this, isFirst);
            }
            if (isClear) {
                _clearPoints.call(this);
                this.setOption('isSearching', false);
            }
            _drawBgImage.call(this, isFirst);
            value = JSON.parse(JSON.stringify(value || this._options.value));

            (value[listKey] || []).map((item) => {
                if (item.type === 'icon') {
                    _drawMark.call(this, item, isFirst);
                } else {
                    _drawArea.call(this, item);
                }
                return item;
            });

            // 缩放时，保留绘制和标记
            if (isNotEmpty(point) && (drawType === 'beeline' || drawType === 'curve' || drawType === 'circle')) {
                // 缩放时，保留绘制和标记
                if (drawType === 'circle') {
                    let newPt = this.movePoints[this.movePoints.length - 1];
                    if (newPt && newPt.length > 0) {
                        let r = canvasUtils.dist([newPt[0], newPt[1]], [this.currentCanvasPoints[0][0], this.currentCanvasPoints[0][1]])
                        this.canvas_context._arc(newPt[0], newPt[1], r, null, 2, selectLineColor);
                    }
                } else {
                    let points = drawType === 'beeline' ? this.movePoints : this.currentCanvasPoints;
                    if (points.length > 0) {
                        this.canvas_context.beginPath();
                        this.canvas_context._moveTo(points[0][0], points[0][1]);
                        for (let i = 1; i < points.length; i++) {
                            this.canvas_context._lineTo(points[i][0], points[i][1]);
                        }
                        this.canvas_context.setLineWidth(2);
                        this.canvas_context.strokeStyle = selectLineColor;
                        this.canvas_context.stroke();
                    }
                }
                this.canvas_context._arc(point[0], point[1], 5, selectLineColor);
            }
            if (isNotEmpty(selectIconInfo) && drawType === 'mark' && isNotEmpty(point)) {
                _drawTemp.call(this, point);
            }
        }
        // 绘制完成回调
        if (typeof (this._onCompleteDrawing) === 'function') {
            this._onCompleteDrawing.call(this, isFirst);
        }
    }

    /**
     * 绘制鼠标跟踪的图标
     * @param  {[type]} item [object {type: 'icon'|'area'}]
     * @return {[type]}      [description]
     */
    function _drawTemp(point) {
        const {selectIconInfo, iconKey} = this._options;
        let factor = this.canvas_context.getScale();
        let mark = {
            xCoordinate: parseInt(point[0]) + 2 / factor,
            yCoordinate: parseInt(point[1]) + 2 / factor,
            [iconKey]: selectIconInfo[iconKey]
        };
        _drawMark.call(this, mark);
    }

    function _drawMark(item) {
        const {iconKey, iconSize, embedIcons, isSearching, filterValue, MARK_ICON, mode, isShowMark} = this._options;
        const {canvas_context} = this;
        let pt = [item.xCoordinate, item.yCoordinate];

        // 不绘制标记，但是支持根据标记位置自定义
        if (isShowMark) {
            // icon 一半宽度在当前坐标系大小
            let scale = canvas_context.getScale();
            let newIconOffset = iconSize / 2 / scale;

            // 正在搜索状态&有搜索条件（否则就会高亮所有块【区域和标记】）
            if (isSearching && isNotEmpty(filterValue) && filterValue.some(filter => filter.areaCoordinates === item.areaCoordinates)) {
                // 填充颜色
                canvas_context.save();
                // 图标不缩放，绘制时不根据缩放点坐标绘制
                // 高亮选中的图标
                canvas_context._arc(item.xCoordinate, item.yCoordinate, (iconSize + 10) / 2, '#fff', 3, canvasUtils.hexToRgba('#20bee5'));
                canvas_context.restore();
            }
            if ((mode === 'statistics' && item.isShow) || mode !== 'statistics') {
                // 不区分是否是第一次，先判断embedIcons中是否有图，没有则转换保存
                if (!!embedIcons[`${item[iconKey]}${item.iconColor || ''}`]) {
                    canvas_context._drawImage(embedIcons[`${item[iconKey]}${item.iconColor || ''}`], pt[0] - newIconOffset, (pt[1] - newIconOffset), iconSize, iconSize, true);
                } else {
                    let iconImg = new Image();
                    iconImg.onload = () => {
                        // 加载完了之后,同一个图标可能有不同颜色，存放字段区分：加上对应的颜色，否则会被覆盖掉
                        embedIcons[`${item[iconKey]}${item.iconColor || ''}`] = iconImg;
                        canvas_context._drawImage(iconImg, pt[0] - newIconOffset, (pt[1] - newIconOffset), iconSize, iconSize, true);
                    }
                    iconImg.src = CommonFunction.loadMapointImgSrcWithColor(MARK_ICON[item[iconKey]], item.iconColor);
                }
            }
        }
        let point = this.canvas_context.transformedOriginPoint(pt[0], pt[1]);
        if (typeof (this._onCompleteDrawingMark) === 'function') {
            this._onCompleteDrawingMark.call(this, {
                option: item,
                point
            });
        }
    }

    function _drawArea(item, translateX, translateY) {
        const {isSearching, filterValue, isShowArea, isShowAreaName} = this._options;
        translateX = translateX || 0;
        translateY = translateY || 0;
        let areaDes = _getInitConfig.call(this);
        // 区域颜色和区域名称（有可能标记，和名称同步绘制）的绘制分开，每一块区域都是先绘制区域颜色再绘制区域名称
        // 1.区域块颜色
        if (isShowArea) {
            let areaCoordinates = JSON.parse(item.areaCoordinates || '[]');
            this.canvas_context.beginPath();
            if (areaCoordinates.length > 2) {
                areaCoordinates.map((sub, i) => {
                    if (i === 0) {
                        this.canvas_context._moveTo(sub[0] + translateX, sub[1] + translateY);
                    } else {
                        this.canvas_context._lineTo(sub[0] + translateX, sub[1] + translateY);
                    }
                    return sub;
                });
            } else {
                let ratio = canvasUtils.getPixelRatio(this.canvas_context);
                areaCoordinates = areaCoordinates.map((sub, i) => {
                    return [sub[0] + translateX, sub[1] + translateY];
                })
                let pt001 = areaCoordinates[0], pt002 = areaCoordinates[1];
                let r = canvasUtils.dist(pt001, pt002);
                this.canvas_context.arc(pt002[0] * ratio, pt002[1] * ratio, r * ratio, 0 * Math.PI, 2 * Math.PI);
            }
            this.canvas_context.save();
            this.canvas_context.setLineWidth(2);
            let fillColor = '', isStroke = true;
            if (item.status) {
                this.canvas_context.fillStyle = item.color;
                this.canvas_context.shadowBlur = this.blur;
                this.canvas_context.shadowColor = item.color;
                this.canvas_context.strokeStyle = item.color;
            } else {
                if (areaDes.fillColorKey) {
                    fillColor = item[areaDes.fillColorKey];
                } else {
                    fillColor = item.fillColor || areaDes.fillColor;
                }
                if (fillColor) {
                    this.canvas_context.fillStyle = canvasUtils.hexToRgba(fillColor);
                    if (areaDes.fillColorKey && item[areaDes.fillColorKey]) { // 不画线了
                        isStroke = false;
                    }
                }
                this.canvas_context.strokeStyle = item.areaLineColor || areaDes.areaLineColor;
            }
            this.canvas_context.closePath();
            // 正在搜索状态&有搜索条件（否则就会高亮所有块【区域和标记】）
            if (isSearching && isNotEmpty(filterValue) && filterValue.some(filter => filter.areaCoordinates === item.areaCoordinates)) {
                this.canvas_context.strokeStyle = canvasUtils.hexToRgba('#20bee5');
                this.canvas_context.setLineWidth(3);
            }
            fillColor && this.canvas_context.fill();
            isStroke && this.canvas_context.stroke();
            this.canvas_context.restore();
        }

        // 2.区域名称和标记点位，标记的点位绘制到名称下面
        if (item.areaName) {
            let areaNameCoordinate = JSON.parse(item.areaNameCoordinate).map((coor, i) => {
                coor = i === 0 ? (coor + translateX) : (coor + translateY);
                return parseInt(coor);
            });
            if (isShowAreaName) {
                if (item.status) {
                    this.canvas_context.fillStyle = areaDes.areaNameColor;
                } else {
                    this.canvas_context.fillStyle = item.areaNameColor || areaDes.areaNameColor;
                }
                if (item.areaNameVertical === 'Y' || areaDes.areaNameVertical === 'Y') {
                    this.canvas_context.fillTextVertical(item.areaName, areaNameCoordinate[0], areaNameCoordinate[1], item.areaNameSize || areaDes.areaNameSize);
                } else {
                    this.canvas_context._fillText(item.areaName, areaNameCoordinate[0], areaNameCoordinate[1], item.areaNameSize || areaDes.areaNameSize);
                }
            }
            let point = this.canvas_context.transformedOriginPoint(areaNameCoordinate[0], areaNameCoordinate[1]);
            if (typeof (this._onCompleteDrawingArea) === 'function') {
                this._onCompleteDrawingArea.call(this, {
                    option: item,
                    point
                });
            }
        }
    }

    function _getFactorWH(imgW, imgH) {
        const {isAllLayer} = this._options;
        let canvasW = $(this.canvas).width();
        let canvasH = $(this.canvas).height();
        let offsetW = 10;
        let factorW = 0, factorH = 0;
        if (imgW < canvasW && imgH < canvasH) {
            // 只移动
            factorW = imgW;
            factorH = imgH;
        } else {
            // 原图片宽高比例 大于 图片框宽高比例
            if (imgW / imgH > canvasW / canvasH) {
                // 以框的宽度为标准
                factorW = canvasW;
                factorH = canvasW * (imgH / imgW);
            } else {
                // 原图片宽高比例 小于 图片框宽高比例
                factorW = canvasH * (imgW / imgH);
                // 以框的高度为标准
                factorH = canvasH;
            }
        }
        if (isAllLayer) {
            // 要确保缩放倾斜后canvas在视图范围内，即去掉倾斜所增加的宽度
            while (factorW + factorH * Math.abs(tan) + 100 > canvasW) {
                factorW -= offsetW;
                factorH = factorW * (imgH / imgW);
            }
        }
        return [factorW, factorH];
    }

    function _setDefaultPoint() {
        let currentFactor = this.canvas_context.getScale();
        let defaultPoint = this.canvas_context.transformedPoint(0, 0);
        // 第一次绘制完成后，将原点在当前坐标系中的坐标保存；在缩放｜平移时计算
        this.setOptions.call(this, {
            defaultAttribute: {
                factor: currentFactor,
                point: defaultPoint
            }
        });
    }

    function _drawBgImage(isFirst, imgIndex) {
        const {isAllLayer, value} = this._options;
        let count = value.length;
        let p1 = [0, 0];
        let p2 = [this.canvas.width, this.canvas.height];
        // 堆叠图：绘制第一张之前清空 ｜ 非堆叠图：绘制前都要清空
        if (!isAllLayer || (isAllLayer && imgIndex === 0)) {
            this.canvas_context.clearRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
        }
        // 图片居中显示
        let canvasW = $(this.canvas).width();
        let canvasH = $(this.canvas).height();
        let imgW;
        let imgH;
        if (isAllLayer) {
            imgW = this.default_bg_image[count - 1].img.naturalWidth;
            imgH = this.default_bg_image[count - 1].img.naturalHeight;
        } else {
            imgW = this.default_bg_image.naturalWidth;
            imgH = this.default_bg_image.naturalHeight;
        }
        let translateX = 0, translateY = 0, factor = 1, factorW = 0, factorH = 0;

        // 将图纸缩放到画布中间初始缩放系数
        let _factorWH = _getFactorWH.call(this, imgW, imgH);
        factorW = _factorWH[0];
        factorH = _factorWH[1];
        let initOffset = canvasH - factorH * yScale - imgSpace;
        if (isFirst) {
            factor = factorW / imgW;
            translateX = (canvasW - factorW) / 2;
            translateY = (canvasH - factorH) / 2;
            let currentFactor = 1;
            if (!isAllLayer || (isAllLayer && imgIndex === 0)) {
                if (isAllLayer) {
                    translateX = (canvasW - factorW + factorH * Math.abs(tan) + 50) / 2;
                    // translateY = initOffset - imgOffset * (count - 1);
                    translateY = 0;
                }
                this.canvas_context._translate(translateX, translateY);
                this.canvas_context._scale(factor, factor);

                // 第一次缩放到可视范围内，记录缩放指数和原点在当前坐标系坐标
                currentFactor = this.canvas_context.getScale();
                // if (!isAllLayer) {
                _setDefaultPoint.call(this);
                // }
            } else {
                currentFactor = this._options.defaultAttribute.factor;
            }
            if (!isAllLayer || (isAllLayer && imgIndex === count - 1)) {
                if (typeof (this._onCompleteZoom) === 'function') {
                    this._onCompleteZoom.call(this, currentFactor);
                }
            }
        }
        if (isAllLayer) {
            let zoom = this.canvas_context.getScale();
            let _imgIndex = count - 1 - imgIndex;
            if (isFirst) {
                if (imgIndex === 0) {
                    // canvas 按照图片宽高等比缩放后，y轴再缩小一倍（这是固定值）
                    // 偏移量固定，留白固定后，从下往上绘制，此时y轴的偏移量不为0
                    this.canvas_context._translate(0, initOffset / zoom);
                    this.canvas_context.transform(1, 0, tan, yScale, 0, 0);
                } else {
                    let offsetH = (0 - imgOffset) / zoom;
                    this.canvas_context.transform(1, 0, 0, 1, 0, 0);
                    this.canvas_context._translate(offsetH * Math.abs(tan), offsetH);

                    if (imgIndex === count - 1) {   // 绘制最后一张底图时记录当前坐标系的偏移量
                        _setDefaultPoint.call(this);
                    }
                }
            } else {
                let offsetH = 0;
                if (imgIndex === 0) {
                    offsetH = _imgIndex * imgOffset / zoom;
                } else {
                    offsetH = (0 - imgOffset) / zoom;
                }
                this.canvas_context.transform(1, 0, 0, 1, 0, 0);
                this.canvas_context._translate(offsetH * Math.abs(tan), offsetH);
            }
            // 绘制图片及周围的阴影
            this.canvas_context.save();
            this.canvas_context.shadowBlur = 30;
            this.canvas_context.shadowOffsetX = 3;
            this.canvas_context.shadowOffsetY = 3;
            this.canvas_context.shadowColor = '#40a9ff'; // #d9d9d9
            this.canvas_context._drawImage(this.default_bg_image[imgIndex].img, 0, 0, imgW, imgH);
            this.canvas_context.restore();

            // 绘制楼层
            this.canvas_context.save();
            this.canvas_context.transform(1, 0, 1, 2, 0, 0); // 在当前坐标系上构建，恢复默认
            this.canvas_context.setFont(15, 'right');
            this.canvas_context.fillStyle = 'rgba(0, 0, 0, 0.65)';
            this.canvas_context._fillText(value[imgIndex].floor, imgH * tan - (10 / zoom), imgH * yScale);
            this.canvas_context.restore();
        } else {
            this.canvas_context._drawImage(this.default_bg_image, 0, 0, imgW, imgH);
        }
    }

    /**
     * 根据点击坐标判断是否在各层图纸范围内
     * @param pt
     * @private
     */
    function _getClickImage(pt) {
        pt[1] = pt[1] * yScale;
        let value = this._options.value;
        let count = value.length;
        let returnValue = {};
        let imgW = this.default_bg_image[count - 1].img.naturalWidth;
        let imgH = this.default_bg_image[count - 1].img.naturalHeight;

        let zoom = this.canvas_context.getScale();
        for (let i = count - 1; i >= 0; i--) {
            let newPointArray = [];
            let _i = count - 1 - i;
            let offsetY = imgOffset * _i * yScale / zoom;
            let pt1 = [0, offsetY];
            let pt2 = [imgW, offsetY];
            let indexOffsetH = (imgH * yScale + offsetY);
            let pt3 = [imgW - (imgH * Math.abs(tan)), indexOffsetH];
            let pt4 = [0 - (imgH * Math.abs(tan)), indexOffsetH];
            newPointArray = [pt1, pt2, pt3, pt4];
            if (canvasUtils.PointInPoly(pt, newPointArray)) {
                let item = value[i];
                let obj = {
                    index: i,
                    baseImageId: item.areaDrawingBaseImageId,
                    areaDrawingBaseImageInfo: item
                }
                returnValue = obj;
                break;
            }
        }
        return returnValue;
    }

    /**
     * 根据点坐标获取所在区域||标记范围内
     * @param  {[x, y]} pt [点坐标]
     * @return {[object]}    [所在区域|标记内信息]
     */
    function _getClickArea(pt) {
        const {listKey, value, iconSize} = this._options;
        // 判断点在哪个区域内（点击的点有可能在多个区域内）,找到所在区域，分别两两比较区域的关系（包含或相交）包含关系：找到最小的区域 相交关系：默认点击先绘制的区域
        let newAreas = [];
        let zoom = this.canvas_context.getScale();
        (value[listKey] || []).map((item, i) => {
            let compareCoordinates = JSON.parse(item.areaCoordinates || '[]');
            if (item.type === 'icon') {
                // 因为标记大小不缩放，判断点击范围时比较的应是iconSize范围内区域大小
                let newIconOffset = iconSize / 2 / zoom;
                let p1 = [item.xCoordinate - newIconOffset - 5, item.yCoordinate - newIconOffset - 5];
                let p2 = [item.xCoordinate - newIconOffset - 5, item.yCoordinate + newIconOffset + 5];
                let p3 = [item.xCoordinate + newIconOffset + 5, item.yCoordinate + newIconOffset + 5];
                let p4 = [item.xCoordinate + newIconOffset + 5, item.yCoordinate - newIconOffset - 5];
                compareCoordinates = [p1, p2, p3, p4];
            }
            if (canvasUtils.PointInPoly(pt, compareCoordinates)) {
                let obj = JSON.parse(JSON.stringify(item));
                obj.compareCoordinates = JSON.stringify(compareCoordinates);
                obj.i = i;
                newAreas.push(obj);
            }
            return item;
        });
        // 判断A区域是否包含B,B是否包含A
        let clickArea = newAreas.length === 1 ? newAreas[0] : canvasUtils.getSmallestArea(newAreas);
        return clickArea;
    }

    /**
     * 鼠标滚动事件-> 控制缩放
     * @param  {[object]} evt
     * firefox. evt.detail 放大-1 缩小1
     * google safari  evt.wheelDelta 放大3... 缩小-3...
     */
    function _handleScroll(evt) {
        let delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
        if (delta && evt.ctrlKey) {
            _zoom.call(this, delta, [evt.offsetX, evt.offsetY]);
            // 当canvas滚动生效后阻止页面滚动
            return evt.preventDefault() && false;
        }
        return true;
    }

    /**
     * [缩放]
     * @param  {[type]} clicks [out or in]
     * @param  {[type]} point  [以该点坐标为中心缩放,缺省画布中心点]
     * @param  {[type]} factor [缩放系数]
     * @return {[type]}        [description]
     */
    function _zoom(clicks, point, factor) {
        let _point = point;
        if (!_point) {
            let canvasW = $(this.canvas).width();
            let canvasH = $(this.canvas).height();
            _point = [(canvasW / 2).toFixed(0), (canvasH / 2).toFixed(0)];
        }
        const {canvas_context} = this;
        let pt = canvas_context.transformedPoint(_point[0], _point[1]);
        let offsetY = this._options.isAllLayer ? pt[1] * Math.abs(tan) : 0;
        canvas_context._translate(pt[0] + offsetY, pt[1]);
        factor = factor || (clicks > 0 ? 1.01 : 0.99);
        canvas_context._scale(factor, factor);
        offsetY = this._options.isAllLayer ? -pt[1] * Math.abs(tan) : 0;
        canvas_context._translate(-pt[0] + offsetY, -pt[1]);
        _redraw.call(this, false, null, false, pt);

        if (typeof (this._onCompleteZoom) === 'function') {
            this._onCompleteZoom.call(this, canvas_context.getScale());
        }
    }
    /**
     * 将画布还原到原始比例
     * @return {[type]} [description]
     */
    function _restoreRatio() {
        // 设置为首次绘制，会将图纸缩放到可视范围内
        const {defaultAttribute, isAllLayer} = this._options;
        const {canvas_context} = this;
        let defaultFactor = defaultAttribute.factor;
        let point = defaultAttribute.point;
        // 原点在当前坐标系中的坐标
        let defaultPoint = canvas_context.transformedPoint(0, 0);
        // 平移缩放到初次可视范围内
        let offsetH = defaultPoint[1] - point[1];
        let offsetY = isAllLayer ? offsetH * Math.abs(tan) : 0;
        canvas_context._translate(defaultPoint[0] - point[0] + offsetY, offsetH);
        _zoom.call(this, 0, [0, 0], defaultFactor / canvas_context.getScale());
    }

    function _getScale() {
        return this.canvas_context.getScale();
    }

    function _getInitConfig() {
        const {areaLineColor, areaNameSize, areaNameColor, fillColor, areaNameVertical, fillColorKey} = this._options;
        return {
            areaLineColor,
            areaNameSize,
            areaNameColor,
            fillColor,
            areaNameVertical,
            fillColorKey
        }
    }

    /**
     * 根据中心点计算图标所在区域
     * @param  {[x, y]} pt [description]
     * @return {[array]}    []
     */
    function _getIconAreaCoordinates(pt) {
        const {iconSize} = this._options;
        let newIconOffset = iconSize / 2;
        let p1 = this.canvas_context.transformedPoint(pt[0] - newIconOffset - 5, pt[1] - newIconOffset - 5);
        let p2 = this.canvas_context.transformedPoint(pt[0] - newIconOffset - 5, pt[1] + newIconOffset + 5);
        let p3 = this.canvas_context.transformedPoint(pt[0] + newIconOffset + 5, pt[1] + newIconOffset + 5);
        let p4 = this.canvas_context.transformedPoint(pt[0] + newIconOffset + 5, pt[1] - newIconOffset - 5);
        return [p1, p2, p3, p4];
    }

    /**
     * 保存数据源操作 this.pagePushArray的长度应该与this.canvasPushArray保持一致
     * @param dataSource
     * @param currentIndex
     */
    function _resetPagePushArray(dataSource) {
        const {canvasStep} = this;
        let pagePushArray = JSON.parse(this.pagePushArray);
        if (canvasStep < pagePushArray.length) {
            pagePushArray.length = canvasStep;
        }
        pagePushArray.push(dataSource);
        this.pagePushArray = JSON.stringify(pagePushArray);
    }

    /**
     * 保存画布操作，每绘制一步执行一次
     */
    function _canvasPush() {
        let canvasStep = this.canvasStep;
        canvasStep++;
        this.canvasStep = canvasStep;
    }

    /**
     * 撤销 flag->true：点击重新绘制
     * @param flag
     */
    function _canvasUndo(flag) {
        let canvasStep = this.canvasStep;
        let _dataSource = JSON.parse(JSON.stringify(this._options.value));
        if (this.mousePressed) {
            this.mousePressed = true;
        }
        if (canvasStep > 0) {
            canvasStep--;

            if (flag !== 'reset') {
                let data = JSON.parse(this.pagePushArray);
                _dataSource = data[this.canvasStep - 1];
            }
        }
        this.canvasStep = canvasStep;
        _setValue.call(this, _dataSource, true);
    }

    /**
     * 恢复
     */
    function _canvasRedo() {
        let canvasStep = this.canvasStep;
        let data = JSON.parse(this.pagePushArray);
        if (canvasStep < data.length - 1) {
            canvasStep++;
            let _dataSource = data[canvasStep];
            _setValue.call(this, _dataSource, true);
        }
        this.canvasStep = canvasStep;
    }

    /**
     * 是否禁用撤销
     * @returns {boolean}
     */
    function _isCanUndo() {
        return this.canvasStep === 0 || this.mousePressed || !isNotEmpty(this._options.value);
    }

    /**
     * 是否禁用重做
     * @returns {boolean}
     */
    function _isCanRedo() {
        let length = JSON.parse(this.pagePushArray).length;
        if (!isNotEmpty(this._options.value)) {
            return true;
        }
        if (this.canvasStep === 0 && length === 1) {
            return true;
        }
        if (this.canvasStep !== 0 && length !== 0) {
            return this.canvasStep >= (length - 1) || this.mousePressed;
        }
    }

    function _clearPoints() {
        this.mousePressed = false;
        this.currentCanvasPoints = [];
        this.movePoints = [];
    }

    function _mergeOptions(obj1, obj2) {
        let obj3 = {}, attrname;
        for (attrname in obj1) {
            obj3[attrname] = obj1[attrname];
        }
        for (attrname in obj2) {
            obj3[attrname] = obj2[attrname];
        }
        return obj3;
    }

    let canvasJs = function (canvas) {
        let instance;
        if (typeof (targetElm) === 'object') {
            instance = new CanvasJs(targetElm);
        } else if (typeof (targetElm) === 'string') {
            let targetElement = document.querySelector(targetElm);
            if (targetElement) {
                instance = new CanvasJs(targetElement);
            } else {
                throw new Error('There is no element');
            }
        } else {
            instance = new CanvasJs(canvas);
        }
        return instance;
    };

    canvasJs.instances = {};

    //Prototype
    canvasJs.fn = CanvasJs.prototype = {
        /**
         * 合并单个参数
         * @param {[type]} option [key]
         * @param {[type]} value  [value]
         */
        setOption: function (option, value) {
            this._options[option] = value;
            return this;
        },
        /**
         * 合并默认参数设置
         * @param {[type]} options [{key: value, ...}]
         */
        setOptions: function (options) {
            this._options = _mergeOptions(this._options, options);
            return this;
        },
        /**
         * 重新生成画布上下文，window.resize 时用到，重置canvas宽高后重绘
         * @param {[type]} obj [description]
         */
        setCanvas: function (obj) {
            _setCanvas.call(this, obj);
            return this;
        },
        /**
         * 开始绘制
         * @param  {Boolean} isFirst [是否初次，第一次要监听事件，缓存底图]
         */
        beginDraw: function (isFirst) {
            _beginDraw.call(this, isFirst);
            return this;
        },
        /**
         * 配置状态下修改区域上的参数回调
         * @param  {Function} callback [description]
         */
        onAreaConfiguration: function (callback) {
            if (typeof (callback) === 'function') {
                this._onAreaConfiguration = callback;
            } else {
                throw new Error('onAreaConfiguration callback was not a function');
            }
            return this;
        },
        /**
         * 配置状态下修改标记上的参数回调
         * @param  {Function} callback [description]
         */
        onMarkConfiguration: function (callback) {
            if (typeof (callback) === 'function') {
                this._onMarkConfiguration = callback;
            } else {
                throw new Error('onMarkConfiguration callback was not a function');
            }
            return this;
        },
        onResetDataSource: function (callback) {
            if (typeof (callback) === 'function') {
                this._onResetDataSource = callback;
            } else {
                throw new Error('onResetDataSource callback was not a function');
            }
            return this;
        },
        /**
         * 单个区域绘制完回调
         * @param  {Function} callback [description]
         */
        onCompleteDrawingArea: function (callback) {
            if (typeof (callback) === 'function') {
                this._onCompleteDrawingArea = callback;
            } else {
                throw new Error('onCompleteDrawingArea callback was not a function');
            }
            return this;
        },
        /**
         * 单个标记绘制完回调
         * @param  {Function} callback [description]
         */
        onCompleteDrawingMark: function (callback) {
            if (typeof (callback) === 'function') {
                this._onCompleteDrawingMark = callback;
            } else {
                throw new Error('onCompleteDrawingMark callback was not a function');
            }
            return this;
        },
        /**
         * 成功标记完成回调
         * @param  {Function} callback [description]
         */
        onCompleteMark: function (callback) {
            if (typeof (callback) === 'function') {
                this._onCompleteMark = callback;
            } else {
                throw new Error('onCompleteMark callback was not a function');
            }
            return this;
        },
        /**
         * 画布绘制完成回调
         * @param  {Function} callback [description]
         */
        onCompleteDrawing: function (callback) {
            if (typeof (callback) === 'function') {
                this._onCompleteDrawing = callback;
            } else {
                throw new Error('onCompleteDrawing callback was not a function');
            }
            return this;
        },
        /**
         * 画布开始绘制回调
         * @param  {Function} callback [description]
         */
        onStartDrawing: function (callback) {
            if (typeof (callback) === 'function') {
                this._onStartDrawing = callback;
            } else {
                throw new Error('onStartDrawing callback was not a function');
            }
            return this;
        },
        /**
         * 画布执行完一次缩放操作回调
         * @param  {Function} callback [description]
         */
        onCompleteZoom: function (callback) {
            if (typeof (callback) === 'function') {
                this._onCompleteZoom = callback;
            } else {
                throw new Error('onCompleteZoom callback was not a function');
            }
            return this;
        },
        /**
         * 时间回调：地图上单击（取消或选中区域｜标记，）、双击、右击、键盘、鼠标移动、底图加载失败，都会触发onOverEvent事件
         * @param  {Function} callback [description]
         */
        onOverEvent: function (callback) {
            if (typeof (callback) === 'function') {
                this._onOverEvent = callback;
            } else {
                throw new Error('onOverEvent callback was not a function');
            }
            return this;
        },
        handleConfig: function (areaIndex) {
            _handleConfig.call(this, areaIndex);
            return this;
        },
        handleFilter: function (options) {
            this._options = _mergeOptions(this._options, options);
            _restoreRatio.call(this);
            return this;
        },
        /**
         * 缩放画布
         * @param  {[type]} clicks [>0:放大0.01倍；<0:缩小0.01倍]
         * @param  {[type]} point  [缩放坐标：在该点为中心缩放]
         * @param  {[type]} factor [缩放指数：当clicks为空有效；>1|<1:放大|缩小指数（factor）倍]
         */
        zoom: function (clicks, point, factor) {
            _zoom.call(this, clicks, point, factor);
            return this;
        },
        /**
         * 还原画布：将画布还原到初始时可视范围内的状态，并不是底图大小的状态
         */
        restoreRatio: function () {
            _restoreRatio.call(this);
            return this;
        },
        setValue: function (value, isRedraw, isPush) {
            _setValue.call(this, value, isRedraw, isPush);
            return this;
        },
        redraw: function (flag, value, isFirst) {
            _redraw.call(this, flag, value, isFirst);
            return;
        },
        /**
         * 是否可以做恢复操作
         * @return {Boolean} [description]
         */
        isCanRedo: function () {
            return _isCanRedo.call(this);
        },
        /**
         * 是否可以做撤销操作
         * @return {Boolean} [description]
         */
        isCanUndo: function () {
            return _isCanUndo.call(this);
        },
        /**
         * 获取缩放指数
         */
        getScale: function () {
            return _getScale.call(this);
        },
        /**
         * 撤销画布（到上一步）
         */
        canvasUndo: function () {
            _canvasUndo.call(this);
            return this;
        },
        /**
         * 恢复画布
         */
        canvasRedo: function () {
            _canvasRedo.call(this);
            return this;
        },
        /**
         * 添加区域
         * @param {[type]} area [description]
         */
        addArea: function (area) {
            _addArea.call(this, area);
            return this;
        },
        /**
         * 更新区域
         * @param  {[type]} area [description]
         */
        updateArea: function (area) {
            _updateArea.call(this, area);
            return this;
        },
        /**
         * 添加标记
         * @param {[type]} mark [description]
         */
        addMark: function (mark) {
            _addMark.call(this, mark);
            return this;
        }
    };

    return canvasJs;
});
export default content;
