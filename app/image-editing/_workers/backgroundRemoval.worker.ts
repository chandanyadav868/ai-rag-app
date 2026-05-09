import { env, pipeline, RawImage, AutoModel, AutoProcessor } from '@huggingface/transformers';

// Configuration for maximum performance
env.allowLocalModels = false;
env.useBrowserCache = true;

let currentModel: any = null;
let currentProcessor: any = null;
let currentPipe: any = null;
let activeModelId: string | null = null;

async function loadModel(modelId: string = "Xenova/modnet") {
    if (activeModelId === modelId && (currentPipe || (currentModel && currentProcessor))) return;
    
    try {
        const device = self.navigator && (self.navigator as any).gpu ? 'webgpu' : 'wasm';
        console.log(`[Worker] Initializing ${modelId} on device:`, device);
        self.postMessage({ status: 'loading', message: `Initializing AI (${device})...` });

        if (modelId === "briaai/RMBG-1.4") {
            // Fallback model logic with custom config as provided by user
            currentModel = await AutoModel.from_pretrained("briaai/RMBG-1.4", {
                config: { model_type: "custom" } as any,
                device: device,
            });
            currentProcessor = await AutoProcessor.from_pretrained("briaai/RMBG-1.4", {
                config: {
                    do_normalize: true,
                    do_pad: false,
                    do_rescale: true,
                    do_resize: true,
                    image_mean: [0.5, 0.5, 0.5],
                    feature_extractor_type: "ImageFeatureExtractor",
                    image_std: [1, 1, 1],
                    resample: 2,
                    rescale_factor: 0.00392156862745098,
                    size: { width: 1024, height: 1024 },
                } as any,
            });
            currentPipe = null;
        } else {
            // Standard pipeline models
            currentPipe = await pipeline("background-removal", modelId, {
                device: device,
                progress_callback: (p: any) => {
                    if (p.status === 'progress') {
                        self.postMessage({ 
                            status: 'loading', 
                            message: `Downloading weights: ${Math.round(p.progress)}%` 
                        });
                    }
                }
            });
            currentModel = null;
            currentProcessor = null;
        }
        
        activeModelId = modelId;
        console.log(`[Worker] Model ready: ${modelId}`);
        self.postMessage({ status: 'ready', message: 'Neural Engine Active' });
    } catch (error) {
        console.error(`[Worker] ${modelId} failed:`, error);
        
        // Automatic fallback to RMBG-1.4 if not already trying it
        if (modelId !== "briaai/RMBG-1.4") {
            console.log("[Worker] Attempting fallback to RMBG-1.4...");
            await loadModel("briaai/RMBG-1.4");
        } else {
            self.postMessage({ status: 'error', message: 'AI Initialization Failed' });
            throw error;
        }
    }
}

self.onmessage = async (event) => {
    const { action, payload } = event.data;

    if (action === 'load') {
        await loadModel(payload.modelId);
    } else if (action === 'removeBackground' || action === 'processFrame') {
        try {
            await loadModel(payload.modelId || activeModelId || "Xenova/modnet");
            
            const isFrame = action === 'processFrame';
            const { image, frame, width, height } = payload;
            
            // 1. Load image
            const img = isFrame ? new RawImage(frame, width, height, 4) : await RawImage.fromURL(image);
            let maskData: any;
            let outWidth: number;
            let outHeight: number;
            let channels: number;

            if (currentPipe) {
                const output = await currentPipe(img);
                maskData = output.data;
                outWidth = output.width;
                outHeight = output.height;
                channels = output.channels;
            } else {
                // RMBG-1.4 manual inference path
                const { pixel_values } = await currentProcessor(img);
                const { output } = await currentModel({ input: pixel_values });
                const mask = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(
                    img.width,
                    img.height,
                );
                maskData = mask.data;
                outWidth = img.width;
                outHeight = img.height;
                channels = 1;
            }
            
            const responseAction = isFrame ? 'processFrame' : 'removeBackground';
            self.postMessage({ 
                status: 'complete', 
                action: responseAction,
                payload: {
                    mask: { data: maskData, channels: channels }, 
                    width: outWidth,
                    height: outHeight
                } 
            }, isFrame ? [maskData.buffer] as any : undefined);
        } catch (error) {
            console.error('[Worker] Inference failed:', error);
            self.postMessage({ status: 'error', message: 'Background removal failed' });
        }
    }
};
