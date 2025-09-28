import { GoogleGenAI } from "@google/genai";
import { BookImage, Bot, Brain, Image, ScanSearch, Search, SendHorizontal } from "lucide-react";

export const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINA_API });


export const systemInstruction = `
    Role:
        You are an advanced image generation prompt engineer. Your job is to deeply understand the user’s request — including both textual instructions and any reference image provided — and generate the best possible prompt for an image-generation model.

    Core Responsibilities:

        - Interpret the user’s intent precisely:

        - Carefully read the user’s message and infer what they actually want in the final image.

        - If they mention specific edits (e.g., “make the sky purple,” “replace  background with a city,” “turn this into a 3D render”), translate that      into clear, creative instructions.

        - If their instructions are vague, make reasonable assumptions and expand them into a detailed, descriptive prompt.

        - Handle reference images intelligently:

        - If the user provides a reference image, assume the image-generation model will use it as a base.

        - Focus your prompt on how the image should be transformed (e.g., background changes, style changes, object additions/removals, etc.).

        - Include relevant details about composition, perspective, lighting, and style when possible.

        - Create professional, detailed prompts:

        - Always write prompts as if for a high-quality AI image generator.

        - Use rich descriptive language about color, mood, setting, lighting, environment, and style.

        - Include specific art styles or rendering techniques if relevant (e.g.,      “cinematic lighting,” “hyperrealistic photo,” “watercolor painting,” “digital art,” etc.).

        - Editing instructions (when a reference image is provided):

        - Clearly describe only the changes that should happen relative to the original image.

        - Avoid repeating things that should remain unchanged — only mention what to modify or enhance.

        - Output format:

        - Always output the final result as a single, polished image generation prompt.

        - Do not include extra explanations or reasoning in the final output.
`

export const SlidingAnimationImage = [
    "https://img.youtube.com/vi/SqIE6lj2IGo/maxresdefault.jpg",
    "https://i.ytimg.com/vi/bMjzIr8OlQE/oardefault.jpg",
    "https://img.youtube.com/vi/6uB65PdasQI/maxresdefault.jpg",
    "https://yt3.ggpht.com/23Jjb9jJ7w38GfaRxQI7nYjWG4ti2hCmrcCop5SNLlKKmZxYpqS1v1tgtExxvgxrdXcSRooS2tkgVw=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1"
]

export const testomonialDetails = [
    {
        name: "Chandan Yadav",
        paragraph: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem, maxime. Earum praesentium adipisci modi commodi asperiores! Repudiandae sequi, labore nihil accusamus perspiciatis corporis ab? Molestias ducimus totam voluptates expedita ab!",
        rating: "4.5",
        src: "https://yt3.ggpht.com/hwly2tSvE66xgff3sKIUYGFahayMInlDihF3-AJ10F7_08ha9fOrzUsC7EmyYpGpt2xNFxHF1wAkoQ=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1"
    },
    {
        name: "Chandan Yadav",
        paragraph: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem, maxime. Earum praesentium adipisci modi commodi asperiores! Repudiandae sequi, labore nihil accusamus perspiciatis corporis ab? Molestias ducimus totam voluptates expedita ab!",
        rating: "4.5",
        src: "https://yt3.ggpht.com/hwly2tSvE66xgff3sKIUYGFahayMInlDihF3-AJ10F7_08ha9fOrzUsC7EmyYpGpt2xNFxHF1wAkoQ=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1"
    },
    {
        name: "Chandan Yadav",
        paragraph: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem, maxime. Earum praesentium adipisci modi commodi asperiores! Repudiandae sequi, labore nihil accusamus perspiciatis corporis ab? Molestias ducimus totam voluptates expedita ab!",
        rating: "4.5",
        src: "https://yt3.ggpht.com/hwly2tSvE66xgff3sKIUYGFahayMInlDihF3-AJ10F7_08ha9fOrzUsC7EmyYpGpt2xNFxHF1wAkoQ=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1"
    },
    {
        name: "Chandan Yadav",
        paragraph: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem, maxime. Earum praesentium adipisci modi commodi asperiores! Repudiandae sequi, labore nihil accusamus perspiciatis corporis ab? Molestias ducimus totam voluptates expedita ab!",
        rating: "4.5",
        src: "https://yt3.ggpht.com/hwly2tSvE66xgff3sKIUYGFahayMInlDihF3-AJ10F7_08ha9fOrzUsC7EmyYpGpt2xNFxHF1wAkoQ=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1"
    },
    {
        name: "Chandan Yadav",
        paragraph: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem, maxime. Earum praesentium adipisci modi commodi asperiores! Repudiandae sequi, labore nihil accusamus perspiciatis corporis ab? Molestias ducimus totam voluptates expedita ab!",
        rating: "4.5",
        src: "https://yt3.ggpht.com/hwly2tSvE66xgff3sKIUYGFahayMInlDihF3-AJ10F7_08ha9fOrzUsC7EmyYpGpt2xNFxHF1wAkoQ=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1"
    },
    {
        name: "Chandan Yadav",
        paragraph: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem, maxime. Earum praesentium adipisci modi commodi asperiores! Repudiandae sequi, labore nihil accusamus perspiciatis corporis ab? Molestias ducimus totam voluptates expedita ab!",
        rating: "4.5",
        src: "https://yt3.ggpht.com/hwly2tSvE66xgff3sKIUYGFahayMInlDihF3-AJ10F7_08ha9fOrzUsC7EmyYpGpt2xNFxHF1wAkoQ=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1"
    },
]

export const slidingText = [
    {
        text: "Change image into the portrait, change width 1080 and change height 1920, position all element of image according to the protrait of image where they will stay, which give visual effect more",
    },
    {
        text: "Change image into the landscape, change width 1920 and change height 1080, position all element of image according to the protrait of image where they will stay, which give visual effect more",
    },
    {
        text: "Change image into the square, change width 1080 and change height 1080, position all element of image according to the protrait of image where they will stay, which give same visual effect",
    }
]

export const slidingImage = [
    {
        portraitImage: "https://ik.imagekit.io/o66qwandt/images/canvas-export%20(12).png?updatedAt=1759047925915",
        LandscapeImage: "https://ik.imagekit.io/o66qwandt/images/canvas-export%20(13).png?updatedAt=1759050989336",
        SquareImage: "https://ik.imagekit.io/o66qwandt/images/canvas-export%20(13).png?updatedAt=1759050989336",
    },
    // {
    //     landscapeThumnail: "https://img.youtube.com/vi/r9Y35xwNPiI/maxresdefault.jpg",
    //     potraitThumnail: "https://i.ytimg.com/vi/bMjzIr8OlQE/oardefault.jpg",
    //     squareThumnail: "https://yt3.ggpht.com/ChQ-8N_TZHHRcb3bKOY4rVOPhKzv-OrRinEtVM5BdbbK3KJIgy36mSIE8bfGmVobimKa8Yacxpji_w=s640-c-fcrop64=1,55850000e584ffff-rw-nd-v1",
    // },
    // {
    //     landscapeThumnail: "https://img.youtube.com/vi/6uB65PdasQI/maxresdefault.jpg",
    //     potraitThumnail: "https://i.ytimg.com/vi/-7CjPpTCSjA/oardefault.jpg",
    //     squareThumnail: "https://yt3.ggpht.com/EqQh_QIb_N9R0k7iheAXnwMNX0rUxrhsTgX40KvmDGBPcBvoOUVpKPOiG7uWFVHGOmnv3K6n32PGTPg=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1",
    // },
    // {
    //     landscapeThumnail: "https://img.youtube.com/vi/N7Q_56f39MQ/maxresdefault.jpg",
    //     potraitThumnail: "https://i.ytimg.com/vi/HHobKQxriIU/oardefault.jpg",
    //     squareThumnail: "https://yt3.ggpht.com/KsNHNO9xNeyqaL-Basz1KWos9s5SkbQlRF8pFDzDqXNViRjnSVhga1mknkROLJX4wjJEbyprNg3NgmY=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1",
    // },
    // {
    //     landscapeThumnail: "https://img.youtube.com/vi/PzvZ70aTZ3s/maxresdefault.jpg",
    //     potraitThumnail: "https://i.ytimg.com/vi/6bz6FsHKHDQ/oardefault.jpg",
    //     squareThumnail: "https://yt3.ggpht.com/23Jjb9jJ7w38GfaRxQI7nYjWG4ti2hCmrcCop5SNLlKKmZxYpqS1v1tgtExxvgxrdXcSRooS2tkgVw=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1",
    // },
    // {
    //     landscapeThumnail: "https://img.youtube.com/vi/2B8gABDfh7I/maxresdefault.jpg",
    //     potraitThumnail: "https://i.ytimg.com/vi/gkRbgY6D-Nc/oar2.jpg",
    //     squareThumnail: "https://yt3.ggpht.com/npkteHAsUkoTROQYCZpQK_n-UKCy1gNfw0kSUGjnk2TX-PRIPE9Eim0mZSkGN2Id-D6it42ZR5qy=s640-c-fcrop64=1,00000000ffffffff-rw-nd-v1",
    // },
]



/**
 * 
 * @param {Date} date as String
 * @returns {boolean}
 */
export const DateDiffrence = (date) => {
    const Date1 = new Date(date);
    const Date2 = new Date();

    const thirtyDaysAgo = new Date(Date2);
    thirtyDaysAgo.setDate(Date2.getDate() - 30);

    // comparision
    if (Date1 < thirtyDaysAgo) {
        return false
    } else {
        return true
    }
}

export const settingMenu = [
    {
        name: "System Instructions"
    },
    {
        name: "Api Keys"
    },
]



export const ImageModels = [
    {
        family: "Gemini",
        free: true,
        type: "Image-generation",
        name: "Gemini 2.0 Flash",
        value: "gemini-2.0-flash-preview-image-generation",
        new: DateDiffrence("06/28/2025")
    },
    // {
    //     family: "Gemini",
    //     free: false,
    //     type: "Image-generation",
    //     name: "Gemini 2.5 Flash",
    //     value: "gemini-2.5-flash-image-preview",
    //     new: DateDiffrence("08/28/2025")
    // }
]

export const PriceData = [
    {
        type: "Free",
        rate: {
            type: "₹",
            rate: 0,
            curreny: {
                country: "INR",
                time: "month"
            }
        },
        caption: "20 Credits",
        features: [
            {
                icon: <Bot />,
                text: "Access to Prompt Generation"
            },
            {
                icon: <Image />,
                text: "Limited image generation"
            },
            {
                icon: <BookImage />,
                text: "Limited file uploads"
            },
            {
                icon: <Brain />,
                text: "Limited memory and context"
            },
            {
                icon: <SendHorizontal />,
                text: "Able to use own Api Key"
            },

        ]
    },
    {
        type: "Silver",
        rate: {
            type: "₹",
            rate: 15,
            curreny: {
                country: "INR",
                time: "month"
            }
        },
        caption: "30 Credits",
        features: [
            {
                icon: <Bot />,
                text: "Access to Prompt Generation"
            },
            {
                icon: <Image />,
                text: "Limited image generation"
            },
            {
                icon: <BookImage />,
                text: "Limited file uploads"
            },
            {
                icon: <Brain />,
                text: "Limited memory and context"
            },
            {
                icon: <SendHorizontal />,
                text: "Able to use own Api Key"
            },

        ]
    },
    {
        type: "Gold",
        rate: {
            type: "₹",
            rate: 30,
            curreny: {
                country: "INR",
                time: "month"
            }
        },
        caption: "60 Credits",
        features: [
            {
                icon: <Bot />,
                text: "Access to Text Generation"
            },
            {
                icon: <Image />,
                text: "Limited image generation"
            },
            {
                icon: <BookImage />,
                text: "Limited file uploads"
            },
            {
                icon: <Brain />,
                text: "Limited memory and context"
            },
            {
                icon: <SendHorizontal />,
                text: "Able to use own Api Key"
            },

        ]
    },
    {
        type: "Platinum",
        rate: {
            type: "₹",
            rate: 60,
            curreny: {
                country: "INR",
                time: "month"
            }
        },
        caption: "120 Credits",
        features: [
            {
                icon: <Bot />,
                text: "Access to Prompt Generation"
            },
            {
                icon: <Image />,
                text: "Limited image generation"
            },
            {
                icon: <BookImage />,
                text: "Limited file uploads"
            },
            {
                icon: <Brain />,
                text: "Limited memory and context"
            },
            {
                icon: <SendHorizontal />,
                text: "Able to use own Api Key"
            },

        ]
    },
]

export const Models = [
    {
        family: "Gemini",
        free: true,
        type: "Image-generation",
        name: "Gemini 2.5 Flash",
        value: "gemini-2.5-flash",
        new: DateDiffrence("06/28/2025")
    },
    {
        family: "Gemini",
        free: true,
        type: "Image-generation",
        name: "Gemini 2.5 Pro",
        value: "gemini-2.5-pro",
        new: DateDiffrence("06/28/2025")
    }
]

export const FontStyle = [
    "normal",
    "italic",
    "oblique"
];

export const FontWeight = [
    "normal",
    "bold",
    "bolder",
    "lighter",
    "100",
    "200",
    "300",
    "400", // normal
    "500",
    "600",
    "700", // bold
    "800",
    "900"
];

export const TextAlign = [
    "Left", "Right", "Center"
]

export const shadowOptions = [
    { label: "None", value: "none" },
    { label: "Small", value: "0px 1px 2px rgba(0, 0, 0, 0.2)" },
    { label: "Medium", value: "0px 4px 6px rgba(0, 0, 0, 0.1)" },
    { label: "Large", value: "0px 10px 15px rgba(0, 0, 0, 0.15)" },
    { label: "Extra Large", value: "0px 20px 25px rgba(0, 0, 0, 0.2)" },
    { label: "Inset", value: "inset 0px 2px 4px rgba(0, 0, 0, 0.1)" },
    { label: "Soft Glow", value: "0px 0px 10px rgba(0, 0, 0, 0.3)" },
    { label: "Light Glow", value: "0px 0px 5px rgba(255, 255, 255, 0.5)" }
];


export const TextFeatures = [
    "FontFamily",
    "FontSize",
    "FontStyle",
    "FontWeight",
    "Blend",
    "Scale",
    "Color",
    "Border Radius",
    "Rotation",
    "BackgroundColor",
    "CharSpacing",
    "LineHeight",
    "Linethrough",
    "FlipX",
    "FlipY",
    "Overline",
    "Padding",
    "OriginX",
    "OriginY",
    "Shadow",
    "SkewX",
    "SkewY",
    "Stroke",
    "StrokeWidth",
    "Text",
    "TextAlign",
    "TextBackgroundColor"
]

export const FontFamily = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Georgia",
    "Trebuchet MS",
    "Impact",
    "Comic Sans MS"
]


export const BLEND_MODES = [
    "normal",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
    "hue",
    "saturation",
    "color",
    "luminosity",
];


export const HeaderList = [
    {
        name: "Home",
        link: "/"
    },
    // {
    //     name: "Pdf Ai",
    //     link: "/pdf-ai"
    // },
    // {
    //     name: "Image Generate",
    //     link: "/image-ai"
    // },
    // {
    //     name: "Chat Ai",
    //     link: "/chat-ai"
    // },
    {
        name: "Image Editting",
        link: "/image-editing"
    },
    {
        name: "About",
        link: "/about"
    },
    {
        name: "Feedback",
        link: "/feedback"
    },
]


export const aspectRatioImage = [
    {
        orientation: "1/1",
        width: 1280,   // Square — same as height
        height: 1280,
    },
    {
        orientation: "4/3",
        width: 960,   // 4:3 scaled to fit height ~720
        height: 720,
    },
    {
        orientation: "16/9",
        width: 1280,  // Base resolution
        height: 720,
    },
    {
        orientation: "9/16",
        width: 720,   // 9:16 scaled to match height ~720
        height: 1280,
    },
    {
        orientation: "3/4",
        width: 540,   // 3:4 scaled to height ~720
        height: 720,
    },
];


export const artistList = [
    "oil painting", "watercolor", "pencil sketch", "charcoal drawing", "acrylic art",
    "digital art", "concept art", "matte painting", "illustration", "anime style", "pixel art",
    "hyperrealistic", "photorealistic", "surrealism", "impressionism", "cubism", "art nouveau", "pop art", "abstract art", "minimalism", "expressionism", "graffiti art", "street art",
    "3D rendering", "low poly", "high poly", "vector art", "line art", "geometric art", "collage art", "mixed media", "photography", "cinematic style", "vintage style", "classical painting", "renaissance art", "baroque art", "gothic art", "modern art",
    "contemporary art", "fantasy art", "sci-fi art", "horror art", "mythological art",
    "conceptual art", "digital painting", "3D modeling", "character design", "environment art",
    "game art", "film concept art", "storyboard art", "motion graphics", "UI/UX design",
    "graphic design", "typography art", "logo design", "branding art", "album cover art",
    "poster design", "book cover art", "web design", "app design", "infographic design",
    "futuristic", "cyberpunk", "steampunk", "dystopian", "utopian", "stained glass", "mosaic", "sculpture"
]

export const colorPalette = [
    "vibrant colors", "muted tones", "monochromatic", "pastel colors", "earth tones", "neon glow", "iridescent", "chromatic aberration", "golden hour lighting", "dramatic shadows", "soft focus", "high contrast", "low saturation", "warm colors", "cool colors", "black and white", "sepia tone", "vintage filter", "film grain", "HDR effect", "sepia tone", "black and white", "technicolor"
];

export const AtmosphericEffects = [
    "serene", "eerie", "mysterious", "epic", "dramatic", "peaceful", "chaotic", "calm", "whimsical", "dark fantasy", "dreamlike", "cinematic", "surreal", "magical", "nostalgic", "futuristic", "retro", "vintage", "urban", "rural", "industrial", "natural", "cosmic", "underwater", "celestial", "atmospheric", "dystopian", "utopian", "cyberpunk", "steampunk", "fantasy", "sci-fi", "horror", "mythological", "conceptual"
];

export const LightingEffects = [
    "cinematic lighting", "dramatic volumetric lighting", "soft diffused light", "hard directional light rim light", "backlit", "god rays", "caustic light studio lighting", "natural lighting", "moonlight", "candlelight", "starlight", "fluorescent light golden hour", "blue hour", "dusk", "dawn"
]


export const Composition = [
    "wide shot", "close-up", "extreme close-up", "medium shot", "full body shot dutch angle", "low angle shot", "high angle shot", "overhead view rule of thirds", "leading lines", "depth of field", "bokeh symmetrical composition", "asymmetrical composition macro photography", "fisheye lens", "panoramic view", "aerial view", "portrait orientation", "landscape orientation", "diagonal composition", "framing elements", "negative space", "golden ratio", "triangular composition", "dynamic symmetry", "radial balance", "color blocking", "texture contrast", "pattern repetition", "visual hierarchy", "foreground interest", "background blur"
]

export const EditTooling = [
    "Crop"
]


export const toolsDifferentShapes = [
    {
        text: [
            "FontFamily",
            "FontSize",
            "FontStyle",
            "FontWeight",
            "TextAlign",
            "CharSpacing",
            "Blend",
            "BackgroundColor",
            "Stroke",
            "StrokeWidth",
            "LineHeight",
            "Linethrough",
            "Overline",
            "FlipX",
            "FlipY",
            "SkewX",
            "SkewY",
            "Color",
            "Rotation",
            "Back",
            "Front",
            "StepBack",
            "StepForward",
        ],
        image: [
            "CropX",
            "CropY",
            "Blur",
            "Noise",
            "Pixelate",
            "Brightness",
            "Contrast",
            "Saturation",
            "Vibrance",
            "Blend",
            "Stroke",
            "StrokeWidth",
            "FlipX",
            "FlipY",
            "SkewX",
            "SkewY",
            "Shadow",
            "Rotation",
            "Back",
            "Front",
            "StepBack",
            "StepForward",
        ],
        shape: [
            "Blend",
            "Stroke",
            "StrokeWidth",
            "FlipX",
            "FlipY",
            "SkewX",
            "SkewY",
            "Shadow",
            "Rotation",
            "Back",
            "Front",
            "StepBack",
            "StepForward",
        ]
    }
]

