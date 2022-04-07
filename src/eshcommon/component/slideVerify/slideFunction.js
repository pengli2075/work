(function (window) {
    const l = 42, // 滑块边长
        r = 9, // 滑块半径
        w = 350, // canvas宽度
        h = 140, // canvas高度
        PI = Math.PI
    const L = l + r * 2 + 3 // 滑块实际边长

    function getRandomNumberByRange(start, end) {
        return Math.round(Math.random() * (end - start) + start)
    }

    function createCanvas(width, height) {
        const canvas = createElement('canvas')
        canvas.width = width
        canvas.height = height
        return canvas
    }

    function createImg(onload) {
        const img = createElement('img')
        img.crossOrigin = 'Anonymous'
        img.onload = onload
        img.onerror = () => {
            let name = getRandomNumber();
            img.src = require(`@/assets/slideVerify/${name}.jpg`)
        }
        let name = getRandomNumber();
        img.src = require(`@/assets/slideVerify/${name}.jpg`)
        return img
    }
  
    function createElement(tagName) {
        return document.createElement(tagName)
    }

    function addClass(tag, className) {
        tag.classList.add(className)
    }

    function removeClass(tag, className) {
        tag.classList.remove(className)
    }
  
    function getRandomNumber() {
        return getRandomNumberByRange(1, 5);
    }

    function draw(ctx, x, y, operation) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.arc(x + l / 2, y - r + 2, r, 0.72*PI, 2.26 * PI)
        ctx.lineTo(x + l, y)
        ctx.arc(x + l + r - 2, y + l / 2, r, 1.21*PI, 2.78 * PI)
        ctx.lineTo(x + l, y + l)
        ctx.lineTo(x, y + l)
        ctx.arc(x + r - 2, y + l / 2, r + 0.4, 2.76 * PI, 1.24 * PI, true)
        ctx.lineTo(x, y)
        ctx.lineWidth = 2
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.stroke()
        ctx[operation]()
        ctx.globalCompositeOperation = 'destination-over'
    }

    function sum(x, y) {
        return x + y
    }

    function square(x) {
        return x * x
    }

    class verifyCanvas {
        constructor({el, sliderTip, onSuccess, onFail, onRefresh}) {
            el.style.position = el.style.position || 'relative'
            this.el = el
            this.onSuccess = onSuccess
            this.onFail = onFail
            this.onRefresh = onRefresh
            this.sliderTip = sliderTip;
        }

        init() {
            this.isSupportClassList();
            this.initDOM()
            this.initImg()
            this.bindEvents()
        }

        isSupportClassList(){
    	if (!('classList' in document.documentElement)) {
    	    Object.defineProperty(HTMLElement.prototype, 'classList', {
    	        get: function() {
    	            var self = this;
    	            function update(fn) {
    	                return function(value) {
    	                    var classes = self.className.split(/\s+/g),
    	                        index = classes.indexOf(value);

    	                    fn(classes, index, value);
    	                    self.className = classes.join(' ');
    	                }
    	            }

    	            return {
    	                add: update(function(classes, index, value) {
    	                    if (!~index) classes.push(value);
    	                }),

    	                remove: update(function(classes, index) {
    	                    if (~index) classes.splice(index, 1);
    	                }),

    	                toggle: update(function(classes, index, value) {
    	                    if (~index)
    	                        classes.splice(index, 1);
    	                    else
    	                        classes.push(value);
    	                }),

    	                contains: function(value) {
    	                    return !!~self.className.split(/\s+/g).indexOf(value);
    	                },

    	                item: function(i) {
    	                    return self.className.split(/\s+/g)[i] || null;
    	                }
    	            };
    	        }
    	    });
    	}
        }

        initDOM() {
            const canvas = createCanvas(w, h) // 画布
            const block = canvas.cloneNode(true) // 滑块
            const sliderContainer = createElement('div')
            const refreshIcon = createElement('div')
            const sliderMask = createElement('div')
            const slider = createElement('div')
            const sliderIcon = createElement('span')
            const text = createElement('span')

            block.className = 'block'
            sliderContainer.className = 'sliderContainer'
            refreshIcon.className = 'refreshIcon'
            sliderMask.className = 'sliderMask'
            slider.className = 'slider'
            sliderIcon.className = 'sliderIcon'
            text.innerHTML = this.sliderTip
            text.className = 'sliderText'

            const el = this.el
            el.appendChild(canvas)
            el.appendChild(refreshIcon)
            el.appendChild(block)
            slider.appendChild(sliderIcon)
            sliderMask.appendChild(slider)
            sliderContainer.appendChild(sliderMask)
            sliderContainer.appendChild(text)
            el.appendChild(sliderContainer)

            Object.assign(this, {
                canvas,
                block,
                sliderContainer,
                refreshIcon,
                slider,
                sliderMask,
                sliderIcon,
                text,
                canvasCtx: canvas.getContext('2d'),
                blockCtx: block.getContext('2d')
            })
        }

        initImg() {
            const img = createImg(() => {
                this.draw()
                this.canvasCtx.drawImage(img, 0, 0, w, h)
                this.blockCtx.drawImage(img, 0, 0, w, h)
                const y = this.y - r * 2 - 1
                const ImageData = this.blockCtx.getImageData(this.x - 3, y, L, L)
                this.block.width = L
                this.blockCtx.putImageData(ImageData, 0, y)
            })
            this.img = img
        }

        draw() {
            // 随机创建滑块的位置
            this.x = getRandomNumberByRange(L + 10, w - (L + 10))
            this.y = getRandomNumberByRange(10 + r * 2, h - (L + 10))
            draw(this.canvasCtx, this.x, this.y, 'fill')
            draw(this.blockCtx, this.x, this.y, 'clip')
        }

        clean() {
            this.canvasCtx.clearRect(0, 0, w, h)
            this.blockCtx.clearRect(0, 0, w, h)
            this.block.width = w
        }

        bindEvents() {
            this.el.onselectstart = () => false
            this.refreshIcon.onclick = () => {
                this.reset()
                typeof this.onRefresh === 'function' && this.onRefresh()
            }

            let originX, originY, trail = [], isMouseDown = false
            this.slider.addEventListener('mousedown', function (e) {
                originX = e.clientX, originY = e.clientY
                isMouseDown = true
            })
            document.addEventListener('mousemove', (e) => {
                if (!isMouseDown) return false
                const moveX = e.clientX - originX
                const moveY = e.clientY - originY
                if (moveX < 0 || moveX + 38 >= w) return false
                this.slider.style.left = moveX + 'px'
                var blockLeft = (w - 40 - 20) / (w - 40) * moveX
                this.block.style.left = blockLeft + 'px'

                addClass(this.sliderContainer, 'sliderContainer_active')
                this.sliderMask.style.width = moveX + 'px'
                trail.push(moveY)
            })
            document.addEventListener('mouseup', (e) => {
                if (!isMouseDown) return false
                isMouseDown = false
                if (e.x == originX) return false
                removeClass(this.sliderContainer, 'sliderContainer_active')
                this.trail = trail
                const {spliced, verified} = this.verify()
                if (spliced) {
                    if (verified) {
                        addClass(this.sliderContainer, 'sliderContainer_success')
                        typeof this.onSuccess === 'function' && this.onSuccess(this)
                    } else {
                        addClass(this.sliderContainer, 'sliderContainer_fail')
                        this.text.innerHTML = 'try again'
                        this.reset()
                    }
                } else {
                    addClass(this.sliderContainer, 'sliderContainer_fail')
                    typeof this.onFail === 'function' && this.onFail()
                    setTimeout(() => {
                        this.reset()
                    }, 500)
                }
            })
        }
    
        reduceSum(arr) {
    	let rsult = 0;
    	for (let i of arr) {
    		rsult += i;
    	}
    	return rsult;
        }

        verify() {
    	const arr = this.trail // 拖动时y轴的移动距离
            const average = this.reduceSum(arr) / arr.length
            const deviations = arr.map(x => x - average)
            const stddev = Math.sqrt(this.reduceSum(deviations.map(square)) / arr.length)
            const left = parseInt(this.block.style.left)
            return {
                spliced: Math.abs(left - this.x) < 10,
                verified: stddev !== 0 , // 简单验证下拖动轨迹，为零时表示Y轴上下没有波动，可能非人为操作
            }
        }

        reset() {
            this.sliderContainer.className = 'sliderContainer'
            this.slider.style.left = 0
            this.block.style.left = 0
            this.sliderMask.style.width = 0
            this.clean()
            let name = getRandomNumber();
            this.img.src = require(`@/assets/slideVerify/${name}.jpg`)
        }
    }

    window.verifyCanvas = {
        init: function (opts) {
            return new verifyCanvas(opts).init()
        }
    }
}(window))
