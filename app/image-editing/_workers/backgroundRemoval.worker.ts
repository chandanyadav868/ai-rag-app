import { env, pipeline, RawImage, AutoModel, AutoProcessor, AutoTokenizer } from '@huggingface/transformers';

// Configuration for maximum performance and memory safety
env.allowLocalModels = false;
env.useBrowserCache = true;

// Active pipelines and model caches
const pipelineCache: Record<string, any> = {};
let rmbgModel: any = null;
let rmbgProcessor: any = null;

let clipsegModel: any = null;
let clipsegProcessor: any = null;
let clipsegTokenizer: any = null;

// Determine optimal hardware acceleration
function getOptimalDevice(): 'webgpu' | 'wasm' {
    if (typeof self !== 'undefined' && self.navigator && (self.navigator as any).gpu) {
        return 'webgpu';
    }
    return 'wasm';
}

/**
 * Loads and caches the briaai/RMBG-1.4 neural matting model.
 * Uses AutoModel + AutoProcessor to bypass standard pipeline model_type checks.
 */
async function getRMBG() {
    if (rmbgModel && rmbgProcessor) {
        return { model: rmbgModel, processor: rmbgProcessor };
    }

    const device = getOptimalDevice();
    self.postMessage({
        status: 'loading',
        message: `Loading RMBG-1.4 Neural Engine (${device === 'webgpu' ? 'WebGPU' : 'WASM'})...`,
        progress: 15
    });

    try {
        rmbgModel = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
            config: { model_type: 'custom' } as any,
            device: device,
            progress_callback: (p: any) => {
                if (p.status === 'progress' && typeof p.progress === 'number') {
                    self.postMessage({
                        status: 'loading',
                        message: `Downloading RMBG-1.4 weights: ${Math.round(p.progress)}%`,
                        progress: Math.min(95, Math.round(p.progress))
                    });
                }
            }
        });

        rmbgProcessor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
            config: {
                do_normalize: true,
                do_pad: false,
                do_rescale: true,
                do_resize: true,
                image_mean: [0.5, 0.5, 0.5],
                feature_extractor_type: 'ImageFeatureExtractor',
                image_std: [1, 1, 1],
                resample: 2,
                rescale_factor: 0.00392156862745098,
                size: { width: 1024, height: 1024 },
            } as any
        });

        self.postMessage({ status: 'ready', message: 'RMBG-1.4 Ready', progress: 100 });
        return { model: rmbgModel, processor: rmbgProcessor };
    } catch (err) {
        console.warn(`[Worker] Failed with device '${device}', attempting fallback:`, err);
        if (device !== 'wasm') {
            self.postMessage({
                status: 'loading',
                message: 'Initializing WASM fallback...',
                progress: 30
            });
            rmbgModel = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
                config: { model_type: 'custom' } as any,
                device: 'wasm',
            });
            rmbgProcessor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
                config: {
                    do_normalize: true,
                    do_pad: false,
                    do_rescale: true,
                    do_resize: true,
                    image_mean: [0.5, 0.5, 0.5],
                    feature_extractor_type: 'ImageFeatureExtractor',
                    image_std: [1, 1, 1],
                    resample: 2,
                    rescale_factor: 0.00392156862745098,
                    size: { width: 1024, height: 1024 },
                } as any
            });
            self.postMessage({ status: 'ready', message: 'RMBG-1.4 Ready (WASM)', progress: 100 });
            return { model: rmbgModel, processor: rmbgProcessor };
        }
        throw err;
    }
}

/**
 * Loads and caches the CLIPSeg model, tokenizer, and processor for zero-shot object isolation.
 */
async function getCLIPSeg(modelId: string = 'Xenova/clipseg-rd64-refined') {
    if (clipsegModel && clipsegProcessor && clipsegTokenizer) {
        return { model: clipsegModel, processor: clipsegProcessor, tokenizer: clipsegTokenizer };
    }

    const device = getOptimalDevice();
    self.postMessage({
        status: 'loading',
        message: `Loading CLIPSeg Neural Engine (${device === 'webgpu' ? 'WebGPU' : 'WASM'})...`,
        progress: 15
    });

    const progress_callback = (p: any) => {
        if (p.status === 'progress' && typeof p.progress === 'number') {
            self.postMessage({
                status: 'loading',
                message: `Downloading CLIPSeg weights: ${Math.round(p.progress)}%`,
                progress: Math.min(95, Math.round(p.progress))
            });
        }
    };

    try {
        clipsegTokenizer = await AutoTokenizer.from_pretrained(modelId, { progress_callback });
        clipsegProcessor = await AutoProcessor.from_pretrained(modelId, { progress_callback });
        clipsegModel = await AutoModel.from_pretrained(modelId, {
            device: device,
            quantized: true,
            progress_callback
        } as any);

        self.postMessage({ status: 'ready', message: 'CLIPSeg Neural Engine Ready', progress: 100 });
        return { model: clipsegModel, processor: clipsegProcessor, tokenizer: clipsegTokenizer };
    } catch (err) {
        console.warn(`[Worker] CLIPSeg failed on '${device}', falling back to WASM:`, err);
        if (device !== 'wasm') {
            clipsegTokenizer = await AutoTokenizer.from_pretrained(modelId);
            clipsegProcessor = await AutoProcessor.from_pretrained(modelId);
            clipsegModel = await AutoModel.from_pretrained(modelId, {
                device: 'wasm',
                quantized: true
            } as any);
            self.postMessage({ status: 'ready', message: 'CLIPSeg Neural Engine Ready (WASM)', progress: 100 });
            return { model: clipsegModel, processor: clipsegProcessor, tokenizer: clipsegTokenizer };
        }
        throw err;
    }
}

/**
 * Loads and caches general AI pipelines.
 */
async function getPipeline(task: string, modelId: string) {
    const cacheKey = `${task}:${modelId}`;
    if (pipelineCache[cacheKey]) {
        return pipelineCache[cacheKey];
    }

    const device = getOptimalDevice();
    self.postMessage({
        status: 'loading',
        message: `Loading AI Engine (${device === 'webgpu' ? 'WebGPU' : 'WASM'})...`,
        progress: 10
    });

    try {
        const pipe = await pipeline(task as any, modelId, {
            device: device,
            progress_callback: (p: any) => {
                if (p.status === 'progress' && typeof p.progress === 'number') {
                    self.postMessage({
                        status: 'loading',
                        message: `Downloading ${modelId.split('/')[1] || 'model'}: ${Math.round(p.progress)}%`,
                        progress: Math.min(95, Math.round(p.progress))
                    });
                }
            }
        });

        pipelineCache[cacheKey] = pipe;
        self.postMessage({ status: 'ready', message: 'Neural Engine Ready', progress: 100 });
        return pipe;
    } catch (err) {
        console.warn(`[Worker] Pipeline error on '${device}', trying WASM:`, err);
        if (device !== 'wasm') {
            const fallbackPipe = await pipeline(task as any, modelId, {
                device: 'wasm',
            });
            pipelineCache[cacheKey] = fallbackPipe;
            self.postMessage({ status: 'ready', message: 'Neural Engine Ready (WASM)', progress: 100 });
            return fallbackPipe;
        }
        throw err;
    }
}

/**
 * Downsample image if larger than maxDim to ensure low memory usage and avoid tab crash.
 */
async function downsampleIfNeeded(raw: any, maxDim = 1536) {
    if (raw.width > maxDim || raw.height > maxDim) {
        const scale = Math.min(maxDim / raw.width, maxDim / raw.height);
        const targetW = Math.round(raw.width * scale);
        const targetH = Math.round(raw.height * scale);
        return await raw.resize(targetW, targetH);
    }
    return raw;
}

self.onmessage = async (event) => {
    const { action, payload } = event.data;

    if (action === 'load') {
        try {
            const modelId = payload?.modelId || 'briaai/RMBG-1.4';
            if (modelId === 'briaai/RMBG-1.4' || modelId.includes('RMBG')) {
                await getRMBG();
            } else {
                await getPipeline('image-segmentation', modelId);
            }
        } catch (error: any) {
            console.error('[Worker] Model load failed:', error);
            self.postMessage({ status: 'error', message: error?.message || 'Failed to initialize AI model' });
        }
    } 
    else if (action === 'removeBackground' || action === 'isolateObject' || action === 'processFrame') {
        const startTime = performance.now();
        try {
            const isPromptMode = action === 'isolateObject' || (payload.mode === 'prompt' && payload.prompt);
            const isFrame = action === 'processFrame';
            const { image, frame, width, height, prompt, threshold = 0.35 } = payload;

            let img: any;
            if (isFrame) {
                img = new RawImage(frame, width, height, 4);
            } else {
                img = await RawImage.fromURL(image);
            }

            // Downsample safely if image is enormous to prevent browser out-of-memory crash
            const processImg = await downsampleIfNeeded(img, 1536);

            let maskData: Uint8ClampedArray;
            let outWidth = processImg.width;
            let outHeight = processImg.height;
            let channels = 4;

            if (isPromptMode) {
                // Text-prompted selective object isolation using CLIPSeg
                const clipsegModelId = payload.modelId || 'Xenova/clipseg-rd64-refined';
                self.postMessage({ status: 'processing', message: `Isolating "${prompt}" with AI...` });
                
                const { model, processor, tokenizer } = await getCLIPSeg(clipsegModelId);

                // Tokenize text prompt into input_ids and attention_mask
                const text_inputs = tokenizer(prompt.trim());
                // Process image into pixel_values
                const image_inputs = await processor(processImg);

                // Execute model with both visual and linguistic inputs
                const { logits } = await model({
                    ...image_inputs,
                    input_ids: text_inputs.input_ids,
                    attention_mask: text_inputs.attention_mask
                });

                // logits has dims [352, 352] - apply sigmoid to get probabilities
                const probs = logits.sigmoid().data; // Float32Array

                let minP = Infinity;
                let maxP = -Infinity;
                for (let i = 0; i < probs.length; i++) {
                    const v = probs[i];
                    if (v < minP) minP = v;
                    if (v > maxP) maxP = v;
                }
                const range = maxP - minP || 1;

                const maskBytes = new Uint8Array(probs.length);
                const activeThreshold = typeof threshold === 'number' ? threshold : 0.35;

                for (let i = 0; i < probs.length; i++) {
                    const norm = (probs[i] - minP) / range;
                    if (norm > activeThreshold) {
                        const alpha = (norm - activeThreshold) / (1 - activeThreshold);
                        maskBytes[i] = Math.min(255, Math.max(0, Math.round(alpha * 255)));
                    } else {
                        maskBytes[i] = 0;
                    }
                }

                // Construct RawImage mask at model resolution (352x352) and resize to processImg resolution
                const maskImg = new RawImage(maskBytes, 352, 352, 1);
                const resizedMask = await maskImg.resize(outWidth, outHeight);

                // Insert alpha channel directly into image to produce clean 4-channel RGBA cutout
                const cutout = processImg.putAlpha(resizedMask);
                maskData = new Uint8ClampedArray(cutout.data);
                outWidth = cutout.width;
                outHeight = cutout.height;
                channels = 4;
            } else {
                // High-precision general background removal using AutoModel RMBG-1.4
                self.postMessage({ status: 'processing', message: 'Removing background with RMBG-1.4...' });
                
                const { model, processor } = await getRMBG();
                const { pixel_values } = await processor(processImg);
                const { output } = await model({ input: pixel_values });

                // output[0] is Tensor [1, 1024, 1024]
                const tensorMask = output[0].mul(255).to('uint8');
                const tensorImage = RawImage.fromTensor(tensorMask);
                const maskRaw = await tensorImage.resize(processImg.width, processImg.height);

                // Insert alpha channel directly into the image to produce 4-channel RGBA cutout
                const cutout = processImg.putAlpha(maskRaw);

                maskData = new Uint8ClampedArray(cutout.data);
                outWidth = cutout.width;
                outHeight = cutout.height;
                channels = 4;
            }

            const durationMs = Math.round(performance.now() - startTime);
            const responseAction = isFrame ? 'processFrame' : 'removeBackground';

            // Send back mask with zero-copy transferable buffer
            self.postMessage({
                status: 'complete',
                action: responseAction,
                durationMs,
                payload: {
                    mask: { data: maskData, channels: channels },
                    width: outWidth,
                    height: outHeight,
                    prompt: isPromptMode ? prompt : undefined
                }
            }, [maskData.buffer] as any);

        } catch (error: any) {
            console.error('[Worker] Processing error:', error);
            self.postMessage({
                status: 'error',
                message: error?.message || 'Background removal failed'
            });
        }
    }
};
