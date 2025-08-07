
export const HeaderList = [
    {
        name: "Home",
        link: "/"
    },
    {
        name: "Pdf Ai",
        link: "/pdf-ai"
    },
    {
        name: "Image Generate",
        link: "/image-ai"
    },
    {
        name: "Chat Ai",
        link: "/chat-ai"
    },
    {
        name: "Image Editting",
        link: "/image-editing"
    },
    {
        name: "About",
        link: "/about"
    },
    {
        name: "Testing",
        link: "/testing"
    },
]

export const aspectRatioImage = [
    {
        orientation: "1:1",
        width: 1080,
        height: 1080,

    },
    {
        orientation: "4:3",
        width: 768,
        height: 1024,
    },
    {
        orientation: "16:9",
        width: 1920,
        height: 1080,
    },
    {
        orientation: "9:16",
        width: 1080,
        height: 1920,
    },
    {
        orientation: "3:4",
        width: 1024,
        height: 768,
    },
]

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
    "cinematic lighting", "dramatic volumetric lighting", "soft diffused light", "hard directional light rim light", "backlit", "god rays", "caustic light studio lighting", "natural lighting", "moonlight", "candlelight", "starlight", "fluorescent light golden hour", "blue hour", "dusk", "dawn"]


export const Composition = [
    "wide shot", "close-up", "extreme close-up", "medium shot", "full body shot dutch angle", "low angle shot", "high angle shot", "overhead view rule of thirds", "leading lines", "depth of field", "bokeh symmetrical composition", "asymmetrical composition macro photography", "fisheye lens", "panoramic view", "aerial view", "portrait orientation", "landscape orientation", "diagonal composition", "framing elements", "negative space", "golden ratio", "triangular composition", "dynamic symmetry", "radial balance", "color blocking", "texture contrast", "pattern repetition", "visual hierarchy", "foreground interest", "background blur"
]




const num = [3, 42, 33, 10, 99, 6]

console.log(num.sort((chhote, bada) => bada - chhote));
const new1 = [{order:1},{order:2},{order:3},{order:4},{order:5}]
console.log(Math.max(...new1.map((v,i)=> v.order)))

async function layerLoading(data) {
    
    switch (data) {
        case data:
            console.log("run fist time");
        case data.lenght>0:
            console.log("second time");
            
        default:
            break;
    }
    
}
layerLoading("lani");
