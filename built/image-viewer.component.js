"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var react_native_1 = require("react-native");
var react_native_image_pan_zoom_1 = require("react-native-image-pan-zoom");
var image_viewer_style_1 = require("./image-viewer.style");
var image_viewer_type_1 = require("./image-viewer.type");
var ImageViewer = /** @class */ (function (_super) {
    __extends(ImageViewer, _super);
    function ImageViewer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            show: false,
            currentShowIndex: 0,
            prevIndexProp: 0,
            imageLoaded: false,
            imageSizes: [],
            isShowMenu: false,
            containerDimensions: { width: 0, height: 0 },
        };
        // 背景透明度渐变动画
        _this.fadeAnim = new react_native_1.Animated.Value(0);
        // 当前基准位置
        _this.standardPositionX = 0;
        // 整体位移，用来切换图片用
        _this.positionXNumber = 0;
        _this.positionX = new react_native_1.Animated.Value(0);
        _this.styles = image_viewer_style_1.default(0, 0, 'transparent');
        // 记录已加载的图片 index
        _this.loadedIndex = new Map();
        _this.handleLongPressWithIndex = new Map();
        _this.imageRefs = [];
        /**
         * reset Image scale and position
         */
        _this.resetImageByIndex = function (index) {
            var imageRef = _this.imageRefs[index];
            if (imageRef)
                imageRef.reset();
        };
        /**
         * 预加载图片
         */
        _this.preloadImage = function (index) {
            if (index < _this.state.imageSizes.length) {
                _this.loadImage(index + 1);
            }
        };
        /**
         * 触发溢出水平滚动
         */
        _this.handleHorizontalOuterRangeOffset = function (offsetX) {
            if (offsetX === void 0) { offsetX = 0; }
            _this.positionXNumber = _this.standardPositionX + offsetX;
            _this.positionX.setValue(_this.positionXNumber);
            var offsetXRTL = !react_native_1.I18nManager.isRTL ? offsetX : -offsetX;
            if (offsetXRTL < 0) {
                if (_this.state.currentShowIndex || 0 < _this.props.imageUrls.length - 1) {
                    _this.loadImage((_this.state.currentShowIndex || 0) + 1);
                }
            }
            else if (offsetXRTL > 0) {
                if (_this.state.currentShowIndex || 0 > 0) {
                    _this.loadImage((_this.state.currentShowIndex || 0) - 1);
                }
            }
        };
        /**
         * 手势结束，但是没有取消浏览大图
         */
        _this.handleResponderRelease = function (vx) {
            if (vx === void 0) { vx = 0; }
            var vxRTL = react_native_1.I18nManager.isRTL ? -vx : vx;
            var isLeftMove = react_native_1.I18nManager.isRTL
                ? _this.positionXNumber - _this.standardPositionX < -(_this.props.flipThreshold || 0)
                : _this.positionXNumber - _this.standardPositionX > (_this.props.flipThreshold || 0);
            var isRightMove = react_native_1.I18nManager.isRTL
                ? _this.positionXNumber - _this.standardPositionX > (_this.props.flipThreshold || 0)
                : _this.positionXNumber - _this.standardPositionX < -(_this.props.flipThreshold || 0);
            if (vxRTL > 0.7) {
                // 上一张
                _this.goBack.call(_this);
                // 这里可能没有触发溢出滚动，为了防止图片不被加载，调用加载图片
                if (_this.state.currentShowIndex || 0 > 0) {
                    _this.loadImage((_this.state.currentShowIndex || 0) - 1);
                }
                return;
            }
            else if (vxRTL < -0.7) {
                // 下一张
                _this.goNext.call(_this);
                if (_this.state.currentShowIndex || 0 < _this.props.imageUrls.length - 1) {
                    _this.loadImage((_this.state.currentShowIndex || 0) + 1);
                }
                return;
            }
            if (isLeftMove) {
                // 上一张
                _this.goBack.call(_this);
            }
            else if (isRightMove) {
                // 下一张
                _this.goNext.call(_this);
                return;
            }
            else {
                // 回到之前的位置
                _this.resetPosition.call(_this);
                return;
            }
        };
        /**
         * 到上一张
         */
        _this.goBack = function () {
            if (_this.state.currentShowIndex === 0) {
                // 回到之前的位置
                _this.resetPosition.call(_this);
                return;
            }
            var width = _this.state.containerDimensions.width;
            _this.positionXNumber = !react_native_1.I18nManager.isRTL ? _this.standardPositionX + width : _this.standardPositionX - width;
            _this.standardPositionX = _this.positionXNumber;
            react_native_1.Animated.timing(_this.positionX, {
                toValue: _this.positionXNumber,
                duration: _this.props.pageAnimateTime,
                useNativeDriver: !!_this.props.useNativeDriver,
            }).start();
            var nextIndex = (_this.state.currentShowIndex || 0) - 1;
            _this.setState({
                currentShowIndex: nextIndex,
            }, function () {
                if (_this.props.onChange) {
                    _this.props.onChange(_this.state.currentShowIndex);
                }
            });
        };
        /**
         * 到下一张
         */
        _this.goNext = function () {
            if (_this.state.currentShowIndex === _this.props.imageUrls.length - 1) {
                // 回到之前的位置
                _this.resetPosition.call(_this);
                return;
            }
            var width = _this.state.containerDimensions.width;
            _this.positionXNumber = !react_native_1.I18nManager.isRTL ? _this.standardPositionX - width : _this.standardPositionX + width;
            _this.standardPositionX = _this.positionXNumber;
            react_native_1.Animated.timing(_this.positionX, {
                toValue: _this.positionXNumber,
                duration: _this.props.pageAnimateTime,
                useNativeDriver: !!_this.props.useNativeDriver,
            }).start();
            var nextIndex = (_this.state.currentShowIndex || 0) + 1;
            _this.setState({
                currentShowIndex: nextIndex,
            }, function () {
                if (_this.props.onChange) {
                    _this.props.onChange(_this.state.currentShowIndex);
                }
            });
        };
        /**
         * 长按
         */
        _this.handleLongPress = function (image) {
            if (_this.props.saveToLocalByLongPress) {
                // 出现保存到本地的操作框
                _this.setState({ isShowMenu: true });
            }
            if (_this.props.onLongPress) {
                _this.props.onLongPress(image);
            }
        };
        /**
         * 单击
         */
        _this.handleClick = function () {
            if (_this.props.onClick) {
                _this.props.onClick(_this.handleCancel, _this.state.currentShowIndex);
            }
        };
        /**
         * 双击
         */
        _this.handleDoubleClick = function () {
            if (_this.props.onDoubleClick) {
                _this.props.onDoubleClick(_this.handleCancel);
            }
        };
        /**
         * 退出
         */
        _this.handleCancel = function () {
            if (_this.props.onCancel) {
                _this.props.onCancel();
            }
        };
        /**
         * 完成布局
         */
        _this.handleLayout = function (event) {
            if (event.nativeEvent.layout.width !== _this.state.containerDimensions.width) {
                var _a = event.nativeEvent.layout, width = _a.width, height = _a.height;
                _this.styles = image_viewer_style_1.default(width, height, _this.props.backgroundColor || 'transparent');
                _this.setState({ containerDimensions: { width: width, height: height } });
                // 强制刷新
                _this.forceUpdate();
                _this.jumpToCurrentImage();
            }
        };
        /**
         * 保存当前图片到本地相册
         */
        _this.saveToLocal = function () {
            if (!_this.props.onSave) {
                react_native_1.CameraRoll.saveToCameraRoll(_this.props.imageUrls[_this.state.currentShowIndex || 0].url);
                _this.props.onSaveToCamera(_this.state.currentShowIndex);
            }
            else {
                _this.props.onSave(_this.props.imageUrls[_this.state.currentShowIndex || 0].url);
            }
            _this.setState({ isShowMenu: false });
        };
        _this.handleLeaveMenu = function () {
            _this.setState({ isShowMenu: false });
        };
        _this.handleSwipeDown = function () {
            if (_this.props.onSwipeDown) {
                _this.props.onSwipeDown();
            }
            _this.handleCancel();
        };
        return _this;
    }
    ImageViewer.prototype.componentDidMount = function () {
        this.init(this.props);
    };
    ImageViewer.getDerivedStateFromProps = function (nextProps, prevState) {
        if (nextProps.index !== prevState.prevIndexProp) {
            return { currentShowIndex: nextProps.index, prevIndexProp: nextProps.index };
        }
        return null;
    };
    ImageViewer.prototype.componentDidUpdate = function (prevProps) {
        if (prevProps.index !== this.props.index) {
            // 立刻预加载要看的图
            this.loadImage(this.props.index || 0);
            this.jumpToCurrentImage();
            // 显示动画
            react_native_1.Animated.timing(this.fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: !!this.props.useNativeDriver,
            }).start();
        }
    };
    /**
     * props 有变化时执行
     */
    ImageViewer.prototype.init = function (nextProps) {
        var _this = this;
        if (nextProps.imageUrls.length === 0) {
            // 隐藏时候清空
            this.fadeAnim.setValue(0);
        }
        // 给 imageSizes 塞入空数组
        var imageSizes = [];
        nextProps.imageUrls.forEach(function (imageUrl) {
            imageSizes.push({
                width: imageUrl.width || 0,
                height: imageUrl.height || 0,
                status: 'loading',
            });
        });
        this.setState({
            currentShowIndex: nextProps.index,
            prevIndexProp: nextProps.index || 0,
            imageSizes: imageSizes,
        }, function () {
            // 立刻预加载要看的图
            _this.loadImage(nextProps.index || 0);
            _this.jumpToCurrentImage();
            // 显示动画
            react_native_1.Animated.timing(_this.fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: !!nextProps.useNativeDriver,
            }).start();
        });
    };
    /**
     * 调到当前看图位置
     */
    ImageViewer.prototype.jumpToCurrentImage = function () {
        // 跳到当前图的位置
        var width = this.state.containerDimensions.width;
        var newPositionXNumber = width * (this.state.currentShowIndex || 0) * (react_native_1.I18nManager.isRTL ? 1 : -1);
        // 如果已经到位了，不要重复。会打扰现有的 Animation
        // If the position we'd like to set it to is the same, don't set it.
        // It may interfere with an existing Animation
        if (newPositionXNumber === this.positionXNumber)
            return;
        this.positionXNumber = newPositionXNumber;
        this.standardPositionX = this.positionXNumber;
        this.positionX.setValue(this.positionXNumber);
    };
    /**
     * 加载图片，主要是获取图片长与宽
     */
    ImageViewer.prototype.loadImage = function (index) {
        var _this = this;
        if (!this.state.imageSizes[index]) {
            return;
        }
        if (this.loadedIndex.has(index)) {
            return;
        }
        this.loadedIndex.set(index, true);
        var image = this.props.imageUrls[index];
        var imageStatus = __assign({}, this.state.imageSizes[index]);
        // 保存 imageSize
        var saveImageSize = function () {
            // 如果已经 success 了，就不做处理
            if (_this.state.imageSizes[index] && _this.state.imageSizes[index].status !== 'loading') {
                return;
            }
            var imageSizes = _this.state.imageSizes.slice();
            imageSizes[index] = imageStatus;
            _this.setState({ imageSizes: imageSizes });
        };
        if (this.state.imageSizes[index].status === 'success') {
            // 已经加载过就不会加载了
            return;
        }
        // 如果已经有宽高了，直接设置为 success
        if (this.state.imageSizes[index].width > 0 && this.state.imageSizes[index].height > 0) {
            imageStatus.status = 'success';
            saveImageSize();
            return;
        }
        // 是否加载完毕了图片大小
        // 是否加载完毕了图片
        var imageLoaded = false;
        // Tagged success if url is started with file:, or not set yet(for custom source.uri).
        if (!image.url || image.url.startsWith("file:")) {
            imageLoaded = true;
        }
        // 如果已知源图片宽高，直接设置为 success
        if (image.width && image.height) {
            if (this.props.enablePreload && imageLoaded === false) {
                react_native_1.Image.prefetch(image.url);
            }
            imageStatus.width = image.width;
            imageStatus.height = image.height;
            imageStatus.status = 'success';
            saveImageSize();
            return;
        }
        if (image.url) {
            react_native_1.Image.getSize(image.url, function (width, height) {
                imageStatus.width = width;
                imageStatus.height = height;
                imageStatus.status = 'success';
                saveImageSize();
            }, function () {
                // Give up..
                imageStatus.status = 'fail';
                saveImageSize();
            });
        }
        else if (image.props && image.props.source) {
            // require('./someImage.png') image
            var data = react_native_1.Image.resolveAssetSource(image.props.source);
            imageStatus.width = data.width;
            imageStatus.height = data.height;
            imageStatus.status = 'success';
            saveImageSize();
        }
        else {
            // Give up..
            imageStatus.status = 'fail';
            saveImageSize();
        }
    };
    /**
     * 回到原位
     */
    ImageViewer.prototype.resetPosition = function () {
        this.positionXNumber = this.standardPositionX;
        react_native_1.Animated.timing(this.positionX, {
            toValue: this.standardPositionX,
            duration: 150,
            useNativeDriver: !!this.props.useNativeDriver,
        }).start();
    };
    /**
     * 获得整体内容
     */
    ImageViewer.prototype.getContent = function () {
        var _this = this;
        // 获得屏幕宽高
        var _a = this.state.containerDimensions, screenWidth = _a.width, screenHeight = _a.height;
        var ImageElements = this.props.imageUrls.map(function (image, index) {
            if ((_this.state.currentShowIndex || 0) > index + 1 || (_this.state.currentShowIndex || 0) < index - 1) {
                return <react_native_1.View key={index} style={{ width: screenWidth, height: screenHeight }}/>;
            }
            if (!_this.handleLongPressWithIndex.has(index)) {
                _this.handleLongPressWithIndex.set(index, _this.handleLongPress.bind(_this, image));
            }
            var imageSizes = _this.state.imageSizes;
            var imageInfo = imageSizes && imageSizes[index];
            if (!imageInfo || !imageInfo.status) {
                return <react_native_1.View key={index} style={{ width: screenWidth, height: screenHeight }}/>;
            }
            var width = imageInfo.width;
            var height = imageInfo.height;
            // 如果宽大于屏幕宽度,整体缩放到宽度是屏幕宽度
            if (width > screenWidth) {
                var widthPixel = screenWidth / width;
                width *= widthPixel;
                height *= widthPixel;
            }
            // 如果此时高度还大于屏幕高度,整体缩放到高度是屏幕高度
            if (height > screenHeight) {
                var HeightPixel = screenHeight / height;
                width *= HeightPixel;
                height *= HeightPixel;
            }
            var Wrapper = function (_a) {
                var children = _a.children, others = __rest(_a, ["children"]);
                return (<react_native_image_pan_zoom_1.default cropWidth={screenWidth} cropHeight={screenHeight} maxOverflow={_this.props.maxOverflow} horizontalOuterRangeOffset={_this.handleHorizontalOuterRangeOffset} responderRelease={_this.handleResponderRelease} onMove={_this.props.onMove} onLongPress={_this.handleLongPressWithIndex.get(index)} onClick={_this.handleClick} onDoubleClick={_this.handleDoubleClick} enableSwipeDown={_this.props.enableSwipeDown} swipeDownThreshold={_this.props.swipeDownThreshold} onSwipeDown={_this.handleSwipeDown} pinchToZoom={_this.props.enableImageZoom} enableDoubleClickZoom={_this.props.enableImageZoom} doubleClickInterval={_this.props.doubleClickInterval} useNativeDriver={_this.props.useNativeDriver} {...others}>
          {children}
        </react_native_image_pan_zoom_1.default>);
            };
            switch (imageInfo.status) {
                case 'loading':
                    return (<Wrapper key={index} style={react_native_1.StyleSheet.flatten([_this.styles.modalContainer, _this.styles.loadingContainer])} imageWidth={screenWidth} imageHeight={screenHeight}>
              <react_native_1.View style={_this.styles.loadingContainer}>{_this.props.loadingRender()}</react_native_1.View>
            </Wrapper>);
                case 'success':
                    if (!image.props) {
                        image.props = {};
                    }
                    if (!image.props.style) {
                        image.props.style = {};
                    }
                    image.props.style = [
                        _this.styles.imageStyle,
                        image.props.style,
                        {
                            width: width,
                            height: height,
                        },
                    ];
                    if (typeof image.props.source === 'number') {
                        // source = require(..), doing nothing
                    }
                    else {
                        if (!image.props.source) {
                            image.props.source = {};
                        }
                        image.props.source = __assign({ uri: image.url }, image.props.source);
                    }
                    if (_this.props.enablePreload) {
                        _this.preloadImage(_this.state.currentShowIndex || 0);
                    }
                    return (<react_native_image_pan_zoom_1.default key={index} ref={function (el) { return (_this.imageRefs[index] = el); }} cropWidth={screenWidth} cropHeight={screenHeight} maxOverflow={_this.props.maxOverflow} horizontalOuterRangeOffset={_this.handleHorizontalOuterRangeOffset} responderRelease={_this.handleResponderRelease} onMove={_this.props.onMove} onLongPress={_this.handleLongPressWithIndex.get(index)} onClick={_this.handleClick} onDoubleClick={_this.handleDoubleClick} imageWidth={width} imageHeight={height} enableSwipeDown={_this.props.enableSwipeDown} swipeDownThreshold={_this.props.swipeDownThreshold} onSwipeDown={_this.handleSwipeDown} panToMove={!_this.state.isShowMenu} pinchToZoom={_this.props.enableImageZoom && !_this.state.isShowMenu} enableDoubleClickZoom={_this.props.enableImageZoom && !_this.state.isShowMenu} doubleClickInterval={_this.props.doubleClickInterval} minScale={_this.props.minScale} maxScale={_this.props.maxScale} useNativeDriver={_this.props.useNativeDriver}>
              {_this.props.renderImage(image.props)}
            </react_native_image_pan_zoom_1.default>);
                case 'fail':
                    return (<Wrapper key={index} style={react_native_1.StyleSheet.flatten(_this.styles.modalContainer)} imageWidth={_this.props.failImageSource ? _this.props.failImageSource.width : screenWidth} imageHeight={_this.props.failImageSource ? _this.props.failImageSource.height : screenHeight}>
              {_this.props.failImageSource &&
                        _this.props.renderImage({
                            source: {
                                uri: _this.props.failImageSource.url,
                            },
                            style: {
                                width: _this.props.failImageSource.width,
                                height: _this.props.failImageSource.height,
                            },
                        })}
            </Wrapper>);
            }
        });
        var _b = this.props, renderHeader = _b.renderHeader, renderArrowLeft = _b.renderArrowLeft, renderArrowRight = _b.renderArrowRight;
        return (<react_native_1.Animated.View style={{ zIndex: 9 }}>
        <react_native_1.Animated.View style={[this.styles.container, { opacity: this.fadeAnim }]}>
          {renderHeader ? renderHeader(this.state.currentShowIndex) : null}

          <react_native_1.View style={this.styles.arrowLeftContainer}>
            <react_native_1.TouchableWithoutFeedback onPress={this.goBack}>
              <react_native_1.View>{renderArrowLeft ? renderArrowLeft() : null}</react_native_1.View>
            </react_native_1.TouchableWithoutFeedback>
          </react_native_1.View>

          <react_native_1.View style={this.styles.arrowRightContainer}>
            <react_native_1.TouchableWithoutFeedback onPress={this.goNext}>
              <react_native_1.View>{renderArrowRight ? renderArrowRight() : null}</react_native_1.View>
            </react_native_1.TouchableWithoutFeedback>
          </react_native_1.View>

          <react_native_1.Animated.View style={[
            this.styles.moveBox,
            {
                transform: [{ translateX: this.positionX }],
                width: screenWidth * this.props.imageUrls.length,
            },
        ]}>
            {ImageElements}
          </react_native_1.Animated.View>
          {this.props.renderIndicator((this.state.currentShowIndex || 0) + 1, this.props.imageUrls.length)}

          {this.props.imageUrls[this.state.currentShowIndex || 0] &&
            this.props.imageUrls[this.state.currentShowIndex || 0].originSizeKb &&
            this.props.imageUrls[this.state.currentShowIndex || 0].originUrl && (<react_native_1.View style={this.styles.watchOrigin}>
                <react_native_1.TouchableOpacity style={this.styles.watchOriginTouchable}>
                  <react_native_1.Text style={this.styles.watchOriginText}>查看原图(2M)</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>)}
          <react_native_1.View style={[{ bottom: 0, position: 'absolute', zIndex: 9 }, this.props.footerContainerStyle]}>
            {this.props.renderFooter(this.state.currentShowIndex || 0)}
          </react_native_1.View>
        </react_native_1.Animated.View>
      </react_native_1.Animated.View>);
    };
    ImageViewer.prototype.getMenu = function () {
        if (!this.state.isShowMenu) {
            return null;
        }
        if (this.props.menus) {
            return (<react_native_1.View style={this.styles.menuContainer}>
          {this.props.menus({ cancel: this.handleLeaveMenu, saveToLocal: this.saveToLocal })}
        </react_native_1.View>);
        }
        return (<react_native_1.View style={this.styles.menuContainer}>
        <react_native_1.View style={this.styles.menuShadow}/>
        <react_native_1.View style={this.styles.menuContent}>
          <react_native_1.TouchableHighlight underlayColor="#F2F2F2" onPress={this.saveToLocal} style={this.styles.operateContainer}>
            <react_native_1.Text style={this.styles.operateText}>{this.props.menuContext.saveToLocal}</react_native_1.Text>
          </react_native_1.TouchableHighlight>
          <react_native_1.TouchableHighlight underlayColor="#F2F2F2" onPress={this.handleLeaveMenu} style={this.styles.operateContainer}>
            <react_native_1.Text style={this.styles.operateText}>{this.props.menuContext.cancel}</react_native_1.Text>
          </react_native_1.TouchableHighlight>
        </react_native_1.View>
      </react_native_1.View>);
    };
    ImageViewer.prototype.render = function () {
        var childs = (<react_native_1.View>
        {this.getContent()}
        {this.getMenu()}
      </react_native_1.View>);
        return (<react_native_1.View onLayout={this.handleLayout} style={__assign({ flex: 1, overflow: 'hidden' }, this.props.style)}>
        {childs}
      </react_native_1.View>);
    };
    ImageViewer.defaultProps = image_viewer_type_1.defaultProps;
    return ImageViewer;
}(React.Component));
exports.default = ImageViewer;
//# sourceMappingURL=image-viewer.component.js.map