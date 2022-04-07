/**
 * @author: pengli
 */

const canvasUtils = {
    /**
     * 获取设备的 pixel ratio 设备物理像素分辨率与CSS像素分辨率的比值
     * 为了提高画布分辨率
     * @param  {[type]} ctx [description]
     * @return {[type]}     [description]
     */
    getPixelRatio: function (ctx) {
        let backingStore = ctx.backingStorePixelRatio ||
            ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
        return (window.devicePixelRatio || 1) / backingStore;
    },
    trackTransforms: function (ctx) {
        let ratio = this.getPixelRatio(ctx);

        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let xform = svg.createSVGMatrix();
        ctx.getTransform = function () {
            return xform;
        };

        let savedTransforms = [];
        let save = ctx.save;
        ctx.save = function () {
            savedTransforms.push(xform.translate(0, 0));
            return save.call(ctx);
        };

        let restore = ctx.restore;
        ctx.restore = function () {
            xform = savedTransforms.pop();
            return restore.call(ctx);
        };

        // 在前一个矩阵上构建
        let transform = ctx.transform;
        ctx.transform = function (a, b, c, d, e, f) {
            let m2 = svg.createSVGMatrix();
            m2.a = a;
            m2.b = b;
            m2.c = c;
            m2.d = d;
            m2.e = e;
            m2.f = f;
            xform = xform.multiply(m2);
            return transform.call(ctx, a, b, c, d, e, f);
        };
        // 重置矩阵后再构建
        let setTransform = ctx.setTransform;
        ctx.setTransform = function (a, b, c, d, e, f) {
            xform.a = a;
            xform.b = b;
            xform.c = c;
            xform.d = d;
            xform.e = e;
            xform.f = f;
            return setTransform.call(ctx, a, b, c, d, e, f);
        };

        ctx._scale = function (sx, sy) {
            xform = xform.scaleNonUniform(sx, sy);
            ctx.scale(sx, sy);
        };

        ctx.getScale = function (scale) {
            let p1 = ctx.transformedPoint(0, 0, false);
            let p2 = ctx.transformedPoint(100, 100, false);
            let zoom = 100 / (p2[0] - p1[0]);
            return zoom;
        };

        ctx._rotate = function (radians) {
            xform = xform.rotate(radians * Math.PI / 180);
            ctx.rotate(radians * Math.PI / 180);
        };

        ctx._translate = function (dx, dy) {
            xform = xform.translate(dx, dy);
            ctx.translate(dx * ratio, dy * ratio);
        };

        let pt2 = svg.createSVGPoint();
        //当前坐标系中的的xy还原到原坐标系坐标值
        ctx.transformedOriginPoint = function (x, y) {
            pt2.x = x;
            pt2.y = y;
            let point = pt2.matrixTransform(xform);
            return [point.x, point.y];
        }

        let pt = svg.createSVGPoint();
        /**
         * 计算原始坐标系中点在当前坐标系的坐标
         * @param withOutTilt 是否包含倾斜值，多张图纸会使用倾斜
         */
        ctx.transformedPoint = function (x, y, withTilt) {
            pt.x = x;
            pt.y = y;

            let _xform = svg.createSVGMatrix();
            _xform.a = xform.a;
            _xform.b = xform.b;
            _xform.c = xform.c;
            _xform.d = xform.d;
            _xform.e = xform.e;
            _xform.f = xform.f;
            // let _xform = xform;
            if (!withTilt) {
                _xform.c = 0; // 计算缩放指数时，不需要使用倾斜值
            }
            let point = pt.matrixTransform(_xform.inverse());
            return [point.x, point.y];
        }

        ctx.setLineWidth = function (w) {
            let zoom = ctx.getScale();
            ctx.lineWidth = w * ratio / zoom;
        }

        ctx.setFont = function (size, align) {
            let zoom = ctx.getScale()
            ctx.textAlign = align || 'center';
            ctx.font = (size * ratio / zoom.toFixed(2)) + 'px Airal';
        }

        let clearRect = ctx.clearRect;
        ctx.clearRect = function (x, y, w, h) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            clearRect.call(ctx, x, y, w * ratio, h * ratio);
            ctx.restore();
        }
        ctx._drawImage = function (img, dx, dy, dwidth, dheight, isIcon) {
            let zoom = ctx.getScale()
            if (isIcon) {
                dwidth = dwidth * ratio / zoom
                dheight = dheight * ratio / zoom
            } else {
                dwidth = dwidth * ratio
                dheight = dheight * ratio
            }
            try {
                ctx.drawImage(img, dx * ratio, dy * ratio, dwidth, dheight);
            } catch (e) {
                console.log(e);
            }
        }

        ctx._moveTo = function (x, y) {
            ctx.moveTo(x * ratio, y * ratio);
        }

        ctx._lineTo = function (x, y) {
            ctx.lineTo(x * ratio, y * ratio);
        }

        ctx._fillText = function (name, x, y, size) {
            ctx.save();
            if (size) {
                ctx.setFont(size);
            }
            ctx.fillText(name || '', x * ratio, y * ratio);
            ctx.restore();
        }

        ctx._strokeRect = function (x, y, dwidth, dheight) {
            let zoom = ctx.getScale();
            ctx.save();
            ctx.strokeRect(x * ratio, y * ratio, dwidth * ratio / zoom, dheight * ratio / zoom);
            ctx.restore();
        }

        /**
         * 画圆
         * @param x 中心点横坐标
         * @param y 中心点纵坐标
         * @param r 圆半径
         * @param bgcolor 填充颜色
         * @param linewidth 边框宽度
         * @param bdcolor 边框颜色
         * @param isScale 是否缩放
         * @private
         */
        ctx._arc = function (x, y, r, bgcolor, linewidth, bdcolor, isScale) {
            let zoom = isScale ? 1 : ctx.getScale();
            ctx.beginPath();
            ctx.arc(x * ratio, y * ratio, r * ratio / zoom, 0 * Math.PI, 2 * Math.PI);
            if (linewidth) {
                ctx.strokeStyle = bdcolor;
                ctx.setLineWidth(linewidth);
                ctx.stroke();
            }
            if (bgcolor) {
                ctx.fillStyle = bgcolor;
                ctx.fill();
            }
        }

        ctx.fillTextVertical = function (name, x, y, size) {
            ctx.save();
            if (size) {
                ctx.setFont(size);
            }
            let arrText = name.split('');
            // 计算每个文字的宽度
            let arrWidth = arrText.map(function (letter) {
                return Number((ctx.measureText(letter).width / ratio).toFixed(2));
            });

            let align = ctx.textAlign;
            let baseline = ctx.textBaseline;

            if (align === 'left') {
                x = x + Math.max.apply(null, arrWidth) / 2;
            } else if (align == 'right') {
                x = x - Math.max.apply(null, arrWidth) / 2;
            } else {
                y -= (arrWidth.reduce((pre, cur) => pre + cur, 0)) / 2;
            }
            if (baseline == 'bottom' || baseline == 'alphabetic' || baseline == 'ideographic') {
                y = y - arrWidth[0] / 2;
            } else if (baseline == 'top' || baseline == 'hanging') {
                y = y + arrWidth[0] / 2;
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 开始逐字绘制
            arrText.forEach(function (letter, index) {
                // 确定下一个字符的纵坐标位置
                let letterWidth = arrWidth[index];
                // 是否需要旋转判断
                let code = letter.charCodeAt(0);
                if (code <= 256) {
                    // 英文字符，旋转90°
                    ctx.save();
                    ctx._translate(x, y);
                    ctx._rotate(90);
                    ctx._translate(-x, -y);
                    ctx.fillText(letter, x * ratio, y * ratio);
                    ctx.restore();
                } else if (index > 0 && name.charCodeAt(index - 1) < 256) {
                    y += arrWidth[index - 1] / 2;
                    ctx.fillText(letter, x * ratio, y * ratio);
                } else {
                    ctx.fillText(letter, x * ratio, y * ratio);
                }
                // 确定下一个字符的纵坐标位置
                y = y + letterWidth;
            });
            // 水平垂直对齐方式还原
            ctx.textAlign = align;
            ctx.textBaseline = baseline;
            ctx.restore();
        }
    },
    /**
     *  十六进制转rgba 颜色
     * @param hex 例如:'#23ff45'
     * @param opacity 透明度 默认0.7
     * @returns 'rgba(0,0,0,0.7)'
     */
    hexToRgba(hex, opacity) {
        opacity = opacity || 0.7;
        let rgba = 'rgba(' + parseInt('0x' + hex.slice(1, 3)) + ',' + parseInt('0x' + hex.slice(3, 5)) + ',' + parseInt('0x' + hex.slice(5, 7)) + ',' + opacity + ')';
        return rgba;
    },
    /**
     * 计算区域重心
     * @param  {[type]} points [description]
     * @return {[type]}        [description]
     */
    getCenterOfGravityPoint: function (points) {
        let area = 0;
        let x = 0, y = 0;
        if (points.length > 2) {
            for (let i = 1; i < points.length; i++) {
                let currentX = points[i % points.length][0];
                let currentY = points[i % points.length][1];
                let nextX = points[i - 1][0];
                let nextY = points[i - 1][1];
                let temp = (currentX * nextY - currentY * nextX) / 2;
                area += temp;
                x += temp * (currentX + nextX) / 3;
                y += temp * (currentY + nextY) / 3;
            }
            x = (x / area).toFixed(2);
            y = (y / area).toFixed(2);
        } else {
            let pt = points[points.length - 1];
            x = pt[0].toFixed(2);
            y = pt[1].toFixed(2);
        }
        return [Number(x), Number(y)];
    },
    /**
     * 多个区域中选取最小的区域
     * @param  {[array]} areas [对比区域]
     * @return {[object]}       [最小的区域]
     */
    getSmallestArea: function (areas) {
        let newAreas = [];
        // 筛选的区域中有图标。则直接返回
        if (areas.some(item => item.type === 'icon')) {
            newAreas = areas.filter(item => item.type === 'icon');
            return newAreas[newAreas.length - 1];
        }
        for (let a = 0; a < areas.length; a++) {
            let itemA = areas[a];
            for (let b = 0; b < areas.length; b++) {
                if (a !== b) {
                    let itemB = areas[b];
                    // 判断当前A、B区域关系，(A是否包含B,B中所有的点都在A中),包含：记录B，否则不操作
                    if (this.isPointInPolyDirectional(JSON.parse(itemA.compareCoordinates || '[]'), JSON.parse(itemB.compareCoordinates || '[]'))) {
                        newAreas.push(itemB);
                    }
                }
            }
        }
        if (newAreas.length === 0) {
            return areas[0];
        } else if (newAreas.length === 1) {
            return newAreas[0];
        } else {
            // 递归-> 需要return,否则返回undefined
            return this.getSmallestArea(newAreas);
        }
    },
    /**
     * 计算点是否在区域内
     * @param {[x, y]} pt   [点]
     * @param {[array]} poly [对比区域]
     * @return {[Boolean]}       [true or false]
     */
    PointInPoly: function (pt, poly) {
        let c = false, l = poly.length, j = l - 1;
        if (l > 2) {
            for (let i = -1; ++i < l; j = i) {
                if (((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) || (poly[j][1] <= pt[1] && pt[1] < poly[i][1]))
                    && (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])) {
                    c = !c;
                }
            }
            return c;
        } else {
            // 点是否在圆内
            let pt1 = poly[0], pt2 = poly[l - 1];
            let r = this.dist(pt1, pt2);
            if (r === 0) return false;
            let dx = pt2[0] - pt[0];
            let dy = pt2[1] - pt[1];
            return dx * dx + dy * dy <= r * r;
        }
    },
    /**
     * 区域A是否包含区域B
     * @param  {[type]}  polyA [对比区域A]
     * @param  {[type]}  polyB [对比区域B]
     * @return {Boolean}       [true or false]
     */
    isPointInPolyDirectional: function (polyA, polyB) {
        // 1. 区域A和B 都是圆
        if (polyA.length <= 2 && polyB.length <= 2) {
            let pA1 = polyA[0], pA2 = polyA[polyA.length - 1];
            let r1 = this.dist(pA1, pA2);
            let pB1 = polyB[0], pB2 = polyB[polyB.length - 1];
            let r2 = this.dist(pB1, pB2);
            return r1 >= r2;
        }
        // 2. 区域B 是圆
        if (polyB.length <= 2) {
            let pB1 = polyB[0], pB2 = polyB[polyB.length - 1];
            let r2 = this.dist(pB1, pB2);
            let poly = [[pB2[0], pB2[1] - r2], [pB2[0] + r2, pB2[1]], [pB2[0], pB2[1] + r2], [pB2[0] - r2, pB2[1]]];
            for (let i = 0; i < poly.length; i++) {
                if (!this.PointInPoly(poly[i], polyA)) {
                    return false;
                }
            }
            return true;
        }
        // 3. 区域A是圆,B不是；A不是,B不是
        for (let i = 0; i < polyB.length; i++) {
            if (!this.PointInPoly(polyB[i], polyA)) {
                return false;
            }
        }
        return true;
    },
    /**
     * 区域内最大&最小坐标
     * @param  {[type]} points [description]
     * @return {[type]}        [description]
     */
    getMaxAndMinXY: function (points) {
        let maxX = points.reduce((pre, next) => {
            return pre[0] > next[0] ? pre : next;
        });
        let minX = points.reduce((pre, next) => {
            return next[0] > pre[0] ? pre : next;
        });
        let maxY = points.reduce((pre, next) => {
            return pre[1] > next[1] ? pre : next;
        });
        let minY = points.reduce((pre, next) => {
            return next[1] > pre[1] ? pre : next;
        });
        return [maxX[0], maxY[1], minX[0], minY[1]];
    },
    /**
     * 获取区域中随机点
     * 在区域内随机生成坐标
     * 找到最大、最小X/Y坐标[maxX, maxY, minX, minY]
     * 在此区域内随机生成坐标 x=random()*(maxX-minX)+minX
     * 判断生成的坐标是否在区域内 否：重新生成，一直到在此区域内为止
     * @param  {[type]} areaCoordinates [点区域]
     * @param  {[type]} count           [获取个数]
     * @return {[type]}                 [array [[x1, y1], [x2, y2]...]]
     */
    getRandomPoint: function (areaCoordinates, count) {
        count = count || 1;
        if (!isNotEmpty(areaCoordinates)) {
            return [[0, 0]];
        }
        let maxAndMinXY = this.getMaxAndMinXY(areaCoordinates);
        let points = [];
        Array(count).fill(null).map(() => {
            // 随机生成坐标
            let tagX = -1, tagY = -1;
            while (!this.PointInPoly([tagX, tagY], areaCoordinates) && !points.some(item => item[0] === tagX && item[1] === tagY)) { // 直到找到的点在区域中&不重复
                tagX = parseInt(Math.random() * (maxAndMinXY[0] - maxAndMinXY[2] + 1) + maxAndMinXY[2]);
                tagY = parseInt(Math.random() * (maxAndMinXY[1] - maxAndMinXY[3] + 1) + maxAndMinXY[3]);
            }
            points.push([tagX, tagY]);
        })
        return points
    },
    /**
     * 两点间距离
     * @param point1
     * @param point2
     */
    dist: function (point1, point2) {
        let a = point2[0] - point1[0];
        let b = point2[1] - point1[1];
        return Math.sqrt(a * a + b * b);
    }
}

module.exports = canvasUtils;
