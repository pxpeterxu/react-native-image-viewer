import { TextStyle, ViewStyle } from 'react-native';
declare const _default: (width: number, height: number, backgroundColor: string) => {
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
        backgroundColor: string;
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
export default _default;
export declare const simpleStyle: {
    [x: string]: ViewStyle | TextStyle;
};
