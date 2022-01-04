import * as React from 'react';
import { Image, View, LayoutChangeEvent, ImageProps } from 'react-native';
import { IImageInfo, IImageSize, Props } from './image-viewer.type';
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
    static defaultProps: {
        show: boolean;
        imageUrls: never[];
        flipThreshold: number;
        maxOverflow: number;
        index: number;
        failImageSource: undefined;
        backgroundColor: string;
        footerContainerStyle: {};
        menuContext: {
            saveToLocal: string;
            cancel: string;
        };
        saveToLocalByLongPress: boolean;
        enableImageZoom: boolean;
        style: {};
        enableSwipeDown: boolean;
        enablePreload: boolean;
        pageAnimateTime: number;
        useNativeDriver: boolean;
        onLongPress: () => void;
        onClick: () => void;
        onDoubleClick: () => void;
        onSave: () => void;
        onMove: () => void;
        renderHeader: () => null;
        renderFooter: () => null;
        renderIndicator: (currentIndex?: number | undefined, allSize?: number | undefined) => React.CElement<Readonly<{
            children?: React.ReactNode;
        }> & Readonly<import("react-native").ViewProps>, View>;
        renderImage: (props: ImageProps) => React.CElement<Readonly<{
            children?: React.ReactNode;
        }> & Readonly<ImageProps>, Image>;
        renderArrowLeft: () => null;
        renderArrowRight: () => null;
        onShowModal: () => void;
        onCancel: () => void;
        onSwipeDown: () => void;
        loadingRender: () => null;
        onSaveToCamera: () => void;
        onChange: () => void;
    };
    state: State;
    private fadeAnim;
    private standardPositionX;
    private positionXNumber;
    private positionX;
    private loadedIndex;
    private handleLongPressWithIndex;
    componentDidMount(): void;
    static getDerivedStateFromProps(nextProps: Props, prevState: State): {
        currentShowIndex: number;
        prevIndexProp: number;
    } | null;
    componentDidUpdate(prevProps: Props): void;
    /**
     * props 有变化时执行
     */
    init(nextProps: Props): void;
    /**
     * 调到当前看图位置
     */
    jumpToCurrentImage(): void;
    /**
     * 加载图片，主要是获取图片长与宽
     */
    loadImage(index: number): void;
    /**
     * 预加载图片
     */
    preloadImage: (index: number) => void;
    /**
     * 触发溢出水平滚动
     */
    handleHorizontalOuterRangeOffset: (offsetX?: number) => void;
    /**
     * 手势结束，但是没有取消浏览大图
     */
    handleResponderRelease: (vx?: number) => void;
    /**
     * 到上一张
     */
    goBack: () => void;
    /**
     * 到下一张
     */
    goNext: () => void;
    /**
     * 回到原位
     */
    resetPosition(): void;
    /**
     * 长按
     */
    handleLongPress: (image: IImageInfo) => void;
    /**
     * 单击
     */
    handleClick: () => void;
    /**
     * 双击
     */
    handleDoubleClick: () => void;
    /**
     * 退出
     */
    handleCancel: () => void;
    /**
     * 完成布局
     */
    handleLayout: (event: LayoutChangeEvent) => void;
    styles: () => {
        modalContainer: import("react-native").RegisteredStyle<{
            backgroundColor: string;
            justifyContent: "center";
            alignItems: "center";
            overflow: "hidden";
        }>;
        watchOrigin: import("react-native").RegisteredStyle<{
            position: "absolute";
            width: number;
            bottom: number;
            justifyContent: "center";
            alignItems: "center";
        }>;
        watchOriginTouchable: import("react-native").RegisteredStyle<{
            paddingLeft: number;
            paddingRight: number;
            paddingTop: number;
            paddingBottom: number;
            borderRadius: number;
            borderColor: string;
            borderWidth: number;
            backgroundColor: string;
        }>;
        watchOriginText: import("react-native").RegisteredStyle<{
            color: string;
            backgroundColor: string; /**
             * 图片拉取是否完毕了
             */
        }>;
        imageStyle: import("react-native").RegisteredStyle<{}>;
        container: import("react-native").RegisteredStyle<{
            backgroundColor: string;
        }>;
        moveBox: import("react-native").RegisteredStyle<{
            flexDirection: "row";
            alignItems: "center";
        }>;
        menuContainer: import("react-native").RegisteredStyle<{
            position: "absolute";
            width: number;
            height: number;
            left: number;
            bottom: number;
            zIndex: number;
        }>;
        menuShadow: import("react-native").RegisteredStyle<{
            position: "absolute";
            width: number;
            height: number;
            backgroundColor: string;
            left: number;
            bottom: number;
            opacity: number;
            zIndex: number;
        }>;
        menuContent: import("react-native").RegisteredStyle<{
            position: "absolute";
            width: number;
            left: number;
            bottom: number;
            zIndex: number;
        }>;
        operateContainer: import("react-native").RegisteredStyle<{
            justifyContent: "center";
            alignItems: "center";
            backgroundColor: string;
            height: number;
            borderBottomColor: string;
            borderBottomWidth: number;
        }>;
        operateText: import("react-native").RegisteredStyle<{
            color: string;
        }>;
        loadingTouchable: import("react-native").RegisteredStyle<{
            width: number;
            height: number;
        }>;
        loadingContainer: import("react-native").RegisteredStyle<{
            flex: number;
            justifyContent: "center";
            alignItems: "center";
        }>;
        arrowLeftContainer: import("react-native").RegisteredStyle<{
            position: "absolute";
            top: number;
            bottom: number;
            left: number;
            justifyContent: "center";
            zIndex: number;
        }>;
        arrowRightContainer: import("react-native").RegisteredStyle<{
            position: "absolute";
            top: number;
            bottom: number;
            right: number;
            justifyContent: "center";
            zIndex: number;
        }>;
    };
    /**
     * 获得整体内容
     */
    getContent(): JSX.Element;
    /**
     * 保存当前图片到本地相册
     */
    saveToLocal: () => void;
    getMenu(): JSX.Element | null;
    handleLeaveMenu: () => void;
    handleSwipeDown: () => void;
    render(): JSX.Element;
}
export {};
