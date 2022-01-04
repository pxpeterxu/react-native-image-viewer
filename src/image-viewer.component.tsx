import * as React from 'react';

import {
  Animated,
  CameraRoll,
  I18nManager,
  Image,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  LayoutChangeEvent,
  StyleSheet,
  StyleProp,
  ImageStyle,
  ImageProps,
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import styles from './image-viewer.style';
import { IImageInfo, IImageSize, Props } from './image-viewer.type';
import { simpleStyle } from './image-viewer.style';

interface State {
  /**
   * 是否显示
   */
  show: boolean;

  /**
   * 当前显示第几个
   */
  currentShowIndex: number;

  /**
   * Used to detect if parent component applied new index prop
   */
  prevIndexProp: number;

  /**
   * 图片拉取是否完毕了
   */
  imageLoaded: boolean;

  /**
   * 图片长宽列表
   */
  imageSizes: IImageSize[];

  /**
   * 是否出现功能菜单
   */
  isShowMenu: boolean;

  /**
   * Measured dimensions of the container for the image viewer.
   */
  containerDimensions: ContainerDimensions;
}

interface ContainerDimensions {
  width: number;
  height: number;
}

export default class ImageViewer extends React.Component<Props, State> {
  static defaultProps = {
    show: false,
    imageUrls: [],
    flipThreshold: 80,
    maxOverflow: 300,
    index: 0,
    failImageSource: undefined,
    backgroundColor: 'black',
    footerContainerStyle: {},
    menuContext: { saveToLocal: 'save to the album', cancel: 'cancel' },
    saveToLocalByLongPress: true,
    enableImageZoom: true,
    style: {},
    enableSwipeDown: false,
    enablePreload: false,
    pageAnimateTime: 100,
    useNativeDriver: false,
    /* eslint-disable @typescript-eslint/no-empty-function */
    onLongPress: () => {},
    onClick: () => {},
    onDoubleClick: () => {},
    onSave: () => {},
    onMove: () => {},
    renderHeader: () => {
      return null;
    },
    renderFooter: () => {
      return null;
    },
    // eslint-disable-next-line react/display-name
    renderIndicator: (currentIndex?: number, allSize?: number) => {
      return React.createElement(
        View,
        { style: simpleStyle.count },
        React.createElement(Text, { style: simpleStyle.countText }, currentIndex + '/' + allSize)
      );
    },
    // eslint-disable-next-line react/display-name
    renderImage: (props: ImageProps) => {
      return React.createElement(Image, props);
    },
    renderArrowLeft: () => {
      return null;
    },
    renderArrowRight: () => {
      return null;
    },
    onShowModal: () => {},
    onCancel: () => {},
    onSwipeDown: () => {},
    loadingRender: () => {
      return null;
    },
    onSaveToCamera: () => {},
    onChange: () => {},
    /* eslint-enable @typescript-eslint/no-empty-function */
  };

  state: State = {
    show: false,
    currentShowIndex: 0,
    prevIndexProp: 0,
    imageLoaded: false,
    imageSizes: [],
    isShowMenu: false,
    containerDimensions: { width: 0, height: 0 },
  };

  // 背景透明度渐变动画
  private fadeAnim = new Animated.Value(0);

  // 当前基准位置
  private standardPositionX = 0;

  // 整体位移，用来切换图片用
  private positionXNumber = 0;
  private positionX = new Animated.Value(0);

  private styles = styles(0, 0, 'transparent');

  // 记录已加载的图片 index
  private loadedIndex = new Map<number, boolean>();

  private handleLongPressWithIndex = new Map<number, () => void>();

  private imageRefs: (ImageZoom | null)[] = [];

  componentDidMount() {
    this.init(this.props);
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.index !== prevState.prevIndexProp) {
      return { currentShowIndex: nextProps.index, prevIndexProp: nextProps.index };
    }
    return null;
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.index !== this.props.index) {
      // 立刻预加载要看的图
      this.loadImage(this.props.index || 0);

      this.jumpToCurrentImage();

      // 显示动画
      Animated.timing(this.fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: !!this.props.useNativeDriver,
      }).start();
    }
  }

  /**
   * props 有变化时执行
   */
  init(nextProps: Props) {
    if (nextProps.imageUrls.length === 0) {
      // 隐藏时候清空
      this.fadeAnim.setValue(0);
    }

    // 给 imageSizes 塞入空数组
    const imageSizes: IImageSize[] = [];
    nextProps.imageUrls.forEach((imageUrl) => {
      imageSizes.push({
        width: imageUrl.width || 0,
        height: imageUrl.height || 0,
        status: 'loading',
      });
    });

    this.setState(
      {
        currentShowIndex: nextProps.index,
        prevIndexProp: nextProps.index || 0,
        imageSizes,
      },
      () => {
        // 立刻预加载要看的图
        this.loadImage(nextProps.index || 0);

        this.jumpToCurrentImage();

        // 显示动画
        Animated.timing(this.fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: !!nextProps.useNativeDriver,
        }).start();
      }
    );
  }
  /**
   * reset Image scale and position
   */
  resetImageByIndex = (index: number) => {
    const imageRef = this.imageRefs[index];
    if (imageRef) imageRef.reset();
  };
  /**
   * 调到当前看图位置
   */
  jumpToCurrentImage() {
    // 跳到当前图的位置
    const { width } = this.state.containerDimensions;
    const newPositionXNumber = width * (this.state.currentShowIndex || 0) * (I18nManager.isRTL ? 1 : -1);
    // 如果已经到位了，不要重复。会打扰现有的 Animation
    // If the position we'd like to set it to is the same, don't set it.
    // It may interfere with an existing Animation
    if (newPositionXNumber === this.positionXNumber) return;

    this.positionXNumber = newPositionXNumber;
    this.standardPositionX = this.positionXNumber;
    this.positionX.setValue(this.positionXNumber);
  }

  /**
   * 加载图片，主要是获取图片长与宽
   */
  loadImage(index: number) {
    if (!this.state.imageSizes[index]) {
      return;
    }

    if (this.loadedIndex.has(index)) {
      return;
    }
    this.loadedIndex.set(index, true);

    const image = this.props.imageUrls[index];
    const imageStatus = { ...this.state.imageSizes[index] };

    // 保存 imageSize
    const saveImageSize = () => {
      // 如果已经 success 了，就不做处理
      if (this.state.imageSizes[index] && this.state.imageSizes[index].status !== 'loading') {
        return;
      }

      const imageSizes = this.state.imageSizes.slice();
      imageSizes[index] = imageStatus;
      this.setState({ imageSizes });
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
    let imageLoaded = false;

    // Tagged success if url is started with file:, or not set yet(for custom source.uri).
    if (!image.url || image.url.startsWith(`file:`)) {
      imageLoaded = true;
    }

    // 如果已知源图片宽高，直接设置为 success
    if (image.width && image.height) {
      if (this.props.enablePreload && imageLoaded === false) {
        Image.prefetch(image.url);
      }
      imageStatus.width = image.width;
      imageStatus.height = image.height;
      imageStatus.status = 'success';
      saveImageSize();
      return;
    }

    if (image.url) {
      Image.getSize(
        image.url,
        (width: number, height: number) => {
          imageStatus.width = width;
          imageStatus.height = height;
          imageStatus.status = 'success';
          saveImageSize();
        },
        () => {
          // Give up..
          imageStatus.status = 'fail';
          saveImageSize();
        }
      );
    } else if (image.props && image.props.source) {
      // require('./someImage.png') image
      const data = Image.resolveAssetSource(image.props.source);
      imageStatus.width = data.width;
      imageStatus.height = data.height;
      imageStatus.status = 'success';
      saveImageSize();
    } else {
      // Give up..
      imageStatus.status = 'fail';
      saveImageSize();
    }
  }

  /**
   * 预加载图片
   */
  preloadImage = (index: number) => {
    if (index < this.state.imageSizes.length) {
      this.loadImage(index + 1);
    }
  };
  /**
   * 触发溢出水平滚动
   */
  handleHorizontalOuterRangeOffset = (offsetX: number = 0) => {
    this.positionXNumber = this.standardPositionX + offsetX;
    this.positionX.setValue(this.positionXNumber);

    const offsetXRTL = !I18nManager.isRTL ? offsetX : -offsetX;

    if (offsetXRTL < 0) {
      if (this.state.currentShowIndex || 0 < this.props.imageUrls.length - 1) {
        this.loadImage((this.state.currentShowIndex || 0) + 1);
      }
    } else if (offsetXRTL > 0) {
      if (this.state.currentShowIndex || 0 > 0) {
        this.loadImage((this.state.currentShowIndex || 0) - 1);
      }
    }
  };

  /**
   * 手势结束，但是没有取消浏览大图
   */
  handleResponderRelease = (vx: number = 0) => {
    const vxRTL = I18nManager.isRTL ? -vx : vx;
    const isLeftMove = I18nManager.isRTL
      ? this.positionXNumber - this.standardPositionX < -(this.props.flipThreshold || 0)
      : this.positionXNumber - this.standardPositionX > (this.props.flipThreshold || 0);
    const isRightMove = I18nManager.isRTL
      ? this.positionXNumber - this.standardPositionX > (this.props.flipThreshold || 0)
      : this.positionXNumber - this.standardPositionX < -(this.props.flipThreshold || 0);

    if (vxRTL > 0.7) {
      // 上一张
      this.goBack.call(this);

      // 这里可能没有触发溢出滚动，为了防止图片不被加载，调用加载图片
      if (this.state.currentShowIndex || 0 > 0) {
        this.loadImage((this.state.currentShowIndex || 0) - 1);
      }
      return;
    } else if (vxRTL < -0.7) {
      // 下一张
      this.goNext.call(this);
      if (this.state.currentShowIndex || 0 < this.props.imageUrls.length - 1) {
        this.loadImage((this.state.currentShowIndex || 0) + 1);
      }
      return;
    }

    if (isLeftMove) {
      // 上一张
      this.goBack.call(this);
    } else if (isRightMove) {
      // 下一张
      this.goNext.call(this);
      return;
    } else {
      // 回到之前的位置
      this.resetPosition.call(this);
      return;
    }
  };

  /**
   * 到上一张
   */
  goBack = () => {
    if (this.state.currentShowIndex === 0) {
      // 回到之前的位置
      this.resetPosition.call(this);
      return;
    }

    const { width } = this.state.containerDimensions;

    this.positionXNumber = !I18nManager.isRTL ? this.standardPositionX + width : this.standardPositionX - width;
    this.standardPositionX = this.positionXNumber;
    Animated.timing(this.positionX, {
      toValue: this.positionXNumber,
      duration: this.props.pageAnimateTime,
      useNativeDriver: !!this.props.useNativeDriver,
    }).start();

    const nextIndex = (this.state.currentShowIndex || 0) - 1;

    this.setState(
      {
        currentShowIndex: nextIndex,
      },
      () => {
        if (this.props.onChange) {
          this.props.onChange(this.state.currentShowIndex);
        }
      }
    );
  };

  /**
   * 到下一张
   */
  goNext = () => {
    if (this.state.currentShowIndex === this.props.imageUrls.length - 1) {
      // 回到之前的位置
      this.resetPosition.call(this);
      return;
    }

    const { width } = this.state.containerDimensions;

    this.positionXNumber = !I18nManager.isRTL ? this.standardPositionX - width : this.standardPositionX + width;
    this.standardPositionX = this.positionXNumber;
    Animated.timing(this.positionX, {
      toValue: this.positionXNumber,
      duration: this.props.pageAnimateTime,
      useNativeDriver: !!this.props.useNativeDriver,
    }).start();

    const nextIndex = (this.state.currentShowIndex || 0) + 1;

    this.setState(
      {
        currentShowIndex: nextIndex,
      },
      () => {
        if (this.props.onChange) {
          this.props.onChange(this.state.currentShowIndex);
        }
      }
    );
  };

  /**
   * 回到原位
   */
  resetPosition() {
    this.positionXNumber = this.standardPositionX;
    Animated.timing(this.positionX, {
      toValue: this.standardPositionX,
      duration: 150,
      useNativeDriver: !!this.props.useNativeDriver,
    }).start();
  }

  /**
   * 长按
   */
  handleLongPress = (image: IImageInfo) => {
    if (this.props.saveToLocalByLongPress) {
      // 出现保存到本地的操作框
      this.setState({ isShowMenu: true });
    }

    if (this.props.onLongPress) {
      this.props.onLongPress(image);
    }
  };

  /**
   * 单击
   */
  handleClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.handleCancel, this.state.currentShowIndex);
    }
  };

  /**
   * 双击
   */
  handleDoubleClick = () => {
    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(this.handleCancel);
    }
  };

  /**
   * 退出
   */
  handleCancel = () => {
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  };

  /**
   * 完成布局
   */
  handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const { width: prevWidth, height: prevHeight } = this.state.containerDimensions;

    if (width !== prevWidth || height !== prevHeight) {
      const { width, height } = event.nativeEvent.layout;
      this.styles = styles(width, height, this.props.backgroundColor || 'transparent');

      this.setState({ containerDimensions: { width, height } });

      // 强制刷新
      this.forceUpdate();
      this.jumpToCurrentImage();
    }
  };

  /**
   * 获得整体内容
   */
  getContent() {
    // 获得屏幕宽高
    const { width: screenWidth, height: screenHeight } = this.state.containerDimensions;

    const ImageElements = this.props.imageUrls.map((image, index) => {
      if ((this.state.currentShowIndex || 0) > index + 1 || (this.state.currentShowIndex || 0) < index - 1) {
        return <View key={index} style={{ width: screenWidth, height: screenHeight }} />;
      }

      if (!this.handleLongPressWithIndex.has(index)) {
        this.handleLongPressWithIndex.set(index, this.handleLongPress.bind(this, image));
      }

      const { imageSizes } = this.state;

      const imageInfo = imageSizes && imageSizes[index];
      if (!imageInfo || !imageInfo.status) {
        return <View key={index} style={{ width: screenWidth, height: screenHeight }} />;
      }

      let width = imageInfo.width;
      let height = imageInfo.height;

      // 如果宽大于屏幕宽度,整体缩放到宽度是屏幕宽度
      if (width > screenWidth) {
        const widthPixel = screenWidth / width;
        width *= widthPixel;
        height *= widthPixel;
      }

      // 如果此时高度还大于屏幕高度,整体缩放到高度是屏幕高度
      if (height > screenHeight) {
        const HeightPixel = screenHeight / height;
        width *= HeightPixel;
        height *= HeightPixel;
      }

      const Wrapper = ({ children, ...others }: Partial<ImageZoom['props']>) => (
        <ImageZoom
          cropWidth={screenWidth}
          cropHeight={screenHeight}
          maxOverflow={this.props.maxOverflow}
          horizontalOuterRangeOffset={this.handleHorizontalOuterRangeOffset}
          responderRelease={this.handleResponderRelease}
          onMove={this.props.onMove}
          onLongPress={this.handleLongPressWithIndex.get(index)}
          onClick={this.handleClick}
          onDoubleClick={this.handleDoubleClick}
          enableSwipeDown={this.props.enableSwipeDown}
          swipeDownThreshold={this.props.swipeDownThreshold}
          onSwipeDown={this.handleSwipeDown}
          pinchToZoom={this.props.enableImageZoom}
          enableDoubleClickZoom={this.props.enableImageZoom}
          doubleClickInterval={this.props.doubleClickInterval}
          useNativeDriver={this.props.useNativeDriver}
          {...others}
        >
          {children}
        </ImageZoom>
      );

      switch (imageInfo.status) {
        case 'loading':
          return (
            <Wrapper
              key={index}
              style={StyleSheet.flatten([this.styles.modalContainer, this.styles.loadingContainer])}
              imageWidth={screenWidth}
              imageHeight={screenHeight}
            >
              <View style={this.styles.loadingContainer}>{this.props.loadingRender()}</View>
            </Wrapper>
          );
        case 'success':
          if (!image.props) {
            image.props = {};
          }

          const style: StyleProp<ImageStyle> = [
            this.styles.imageStyle,
            image.props.style, // User config
            { width, height },
          ];

          let source = image.props.source || {};
          if (typeof source !== 'number') {
            // source = require(...) if it's a number - we don't transform it
            source = { uri: image.url, ...source };
          }

          if (this.props.enablePreload) {
            this.preloadImage(this.state.currentShowIndex || 0);
          }
          return (
            <ImageZoom
              key={index}
              ref={(el: ImageZoom) => (this.imageRefs[index] = el)}
              cropWidth={screenWidth}
              cropHeight={screenHeight}
              maxOverflow={this.props.maxOverflow}
              horizontalOuterRangeOffset={this.handleHorizontalOuterRangeOffset}
              responderRelease={this.handleResponderRelease}
              onMove={this.props.onMove}
              onLongPress={this.handleLongPressWithIndex.get(index)}
              onClick={this.handleClick}
              onDoubleClick={this.handleDoubleClick}
              imageWidth={width}
              imageHeight={height}
              enableSwipeDown={this.props.enableSwipeDown}
              swipeDownThreshold={this.props.swipeDownThreshold}
              onSwipeDown={this.handleSwipeDown}
              panToMove={!this.state.isShowMenu}
              pinchToZoom={this.props.enableImageZoom && !this.state.isShowMenu}
              enableDoubleClickZoom={this.props.enableImageZoom && !this.state.isShowMenu}
              doubleClickInterval={this.props.doubleClickInterval}
              minScale={this.props.minScale}
              maxScale={this.props.maxScale}
              useNativeDriver={this.props.useNativeDriver}
            >
              {this.props.renderImage({ ...image.props, style, source })}
            </ImageZoom>
          );
        case 'fail':
          return (
            <Wrapper
              key={index}
              style={StyleSheet.flatten(this.styles.modalContainer)}
              imageWidth={this.props.failImageSource ? this.props.failImageSource.width : screenWidth}
              imageHeight={this.props.failImageSource ? this.props.failImageSource.height : screenHeight}
            >
              {this.props.failImageSource &&
                this.props.renderImage({
                  source: {
                    uri: this.props.failImageSource.url,
                  },
                  style: {
                    width: this.props.failImageSource.width,
                    height: this.props.failImageSource.height,
                  },
                })}
            </Wrapper>
          );
      }
    });

    const { renderHeader, renderArrowLeft, renderArrowRight } = this.props;

    return (
      <Animated.View style={{ zIndex: 9 }}>
        <Animated.View style={[this.styles.container, { opacity: this.fadeAnim }]}>
          {renderHeader ? renderHeader(this.state.currentShowIndex) : null}

          <View style={this.styles.arrowLeftContainer}>
            <TouchableWithoutFeedback onPress={this.goBack}>
              <View>{renderArrowLeft ? renderArrowLeft() : null}</View>
            </TouchableWithoutFeedback>
          </View>

          <View style={this.styles.arrowRightContainer}>
            <TouchableWithoutFeedback onPress={this.goNext}>
              <View>{renderArrowRight ? renderArrowRight() : null}</View>
            </TouchableWithoutFeedback>
          </View>

          <Animated.View
            style={[
              this.styles.moveBox,
              {
                transform: [{ translateX: this.positionX }],
                width: screenWidth * this.props.imageUrls.length,
              },
            ]}
          >
            {ImageElements}
          </Animated.View>
          {this.props.renderIndicator((this.state.currentShowIndex || 0) + 1, this.props.imageUrls.length)}

          {this.props.imageUrls[this.state.currentShowIndex || 0] &&
            this.props.imageUrls[this.state.currentShowIndex || 0].originSizeKb &&
            this.props.imageUrls[this.state.currentShowIndex || 0].originUrl && (
              <View style={this.styles.watchOrigin}>
                <TouchableOpacity style={this.styles.watchOriginTouchable}>
                  <Text style={this.styles.watchOriginText}>查看原图(2M)</Text>
                </TouchableOpacity>
              </View>
            )}
          <View style={[{ bottom: 0, position: 'absolute', zIndex: 9 }, this.props.footerContainerStyle]}>
            {this.props.renderFooter(this.state.currentShowIndex || 0)}
          </View>
        </Animated.View>
      </Animated.View>
    );
  }

  /**
   * 保存当前图片到本地相册
   */
  saveToLocal = () => {
    if (!this.props.onSave) {
      CameraRoll.saveToCameraRoll(this.props.imageUrls[this.state.currentShowIndex || 0].url);
      this.props.onSaveToCamera(this.state.currentShowIndex);
    } else {
      this.props.onSave(this.props.imageUrls[this.state.currentShowIndex || 0].url);
    }

    this.setState({ isShowMenu: false });
  };

  getMenu() {
    if (!this.state.isShowMenu) {
      return null;
    }

    if (this.props.menus) {
      return (
        <View style={this.styles.menuContainer}>
          {this.props.menus({ cancel: this.handleLeaveMenu, saveToLocal: this.saveToLocal })}
        </View>
      );
    }

    return (
      <View style={this.styles.menuContainer}>
        <View style={this.styles.menuShadow} />
        <View style={this.styles.menuContent}>
          <TouchableHighlight underlayColor="#F2F2F2" onPress={this.saveToLocal} style={this.styles.operateContainer}>
            <Text style={this.styles.operateText}>{this.props.menuContext.saveToLocal}</Text>
          </TouchableHighlight>
          <TouchableHighlight
            underlayColor="#F2F2F2"
            onPress={this.handleLeaveMenu}
            style={this.styles.operateContainer}
          >
            <Text style={this.styles.operateText}>{this.props.menuContext.cancel}</Text>
          </TouchableHighlight>
        </View>
      </View>
    );
  }

  handleLeaveMenu = () => {
    this.setState({ isShowMenu: false });
  };

  handleSwipeDown = () => {
    if (this.props.onSwipeDown) {
      this.props.onSwipeDown();
    }
    this.handleCancel();
  };

  render() {
    const childs = (
      <View>
        {this.getContent()}
        {this.getMenu()}
      </View>
    );

    return (
      <View
        onLayout={this.handleLayout}
        style={{
          flex: 1,
          overflow: 'hidden',
          ...this.props.style,
        }}
      >
        {childs}
      </View>
    );
  }
}
