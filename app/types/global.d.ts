
declare global {
    export type BlendMode =
        | "normal"
        | "multiply"
        | "screen"
        | "overlay"
        | "darken"
        | "lighten"
        | "color-dodge"
        | "color-burn"
        | "hard-light"
        | "soft-light"
        | "difference"
        | "exclusion"
        | "hue"
        | "saturation"
        | "color"
        | "luminosity"


    export interface FilterProps {
        blur: number
        brightness: number
        contrast: number
        dropShadow: number
        grayscale: number
        hueRotate: number
        invert: number
        opacity: number
        saturate: number
        sepia: number
    }

    interface GeminaUploadData {
        createTime?: string;
        expirationTime?: string;
        mimeType?: string;
        name?: string;
        sha256Hash?: string;
        sizeBytes?: string;
        source?: string;
        state?: string;
        updateTime?: string;
        uri?: string;
    }

    export type TextAlignProps = "left" | "center" | "right"

    export interface TextToolProps {
        fontFamily?: string,
        fontSize?: number,
        fontStyle?: string,
        fontWeight?: string,
        backgroundColor?: string,
        charSpacing?: number,
        lineHeight?: number,
        linethrough?: boolean,
        overline?: string
        textAlign?: TextAlignProps
        padding?: number
    }

    interface ShadowProps {
        offsetX: number;
        offsetY: number;
        blur: number;
        color: string;
    }

    export interface StateProps extends TextToolProps {
        left: number
        top: number
        width: number
        height: number
        Blur?: number
        layerlock?: boolean
        Noise?: number
        Blocksize?: number
        Brightness?: number
        Contrast?: number
        Saturation?: number
        Vibrance?: number
        stroke?: string | null | undefined | TFiller
        strokeWidth?: number
        id: string
        fill: string | null | undefined | TFiller
        type: string
        lockScalingX?: boolean
        lockScalingY?: boolean
        rx?: number
        ry?: number
        scaleX?: number,
        scaleY?: number,
        src?: string | null
        order: number
        hideLayer?: boolean
        shadow?: string | null | Shadow | undefined
        flipX?: boolean
        flipY?: boolean
        cropX?: number
        cropY?: number
        skewX?: number
        skewY?: number
        angle: number
        scale?: number
        geminaUploadData?: GeminaUploadData
        filter?: Partial<FilterProps>
        refrenceAiCheckBox?: boolean
        geminaUploadedUri?: string
        globalCompositeOperation?: BlendMode
    }

    export type PositionProps = "bringFront" | "sendBack" | "bringForward" | "sendBackward"


    // promptComponent.tsx

    export interface FileUploadResponseProps {
        name?: string;
        displayName?: string;
        uploaded: boolean;
        mimeType: string;
        sizeBytes?: string;
        createTime?: string;
        uri: string;
        downloadUri?: string;
        isChecked?: boolean;
        previewUrl?: string;
        blob?: Blob;
    }

    interface ImageSettingProps {
        imageSetting: (v: Blob) => void,
        state: StateProps[],
        canvasOrientation: string | null,
        fabricJs: React.MutableRefObject<Canvas | null>
    }
    interface PromptStuctureProps {
        main_subject: string;
        action_context: string;
        detailed_description: string;
        artistic_style: string;
        mood: string;
        lighting: string;
        composition: string;
        color_palette: string;
        quality_enhancers: string;
        negative_prompts: string;
    }

    // ShowDesign.tsx
    export interface ShowDesignProps {
        potraitThumnail: string,
        landscapeThumnail: string,
        squareThumnail: string,
    }

    // ModelProps
    interface ModelProps {
        family: string,
        free: boolean,
        type: string,
        name: string,
        value: string,
        new: boolean
    }

    // boundingBoxProps
    interface BoundingBoxProps {
        bottom: number
        height: number
        left: number
        right: number
        top: number
        width: number
        translate:string
        x: number
        y: number
        text:string
    }


    // UserSchemaProps
    interface UserSchemaProp {
        _id?:string;
        email:string;
        password?:string;
        username?:string;
        emailVerified:boolean;
        avatar?:string;
        plan: UserPlan
    }

}


// This line is important so the file is treated as a module
export { }