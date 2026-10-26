import { env, pipeline, RawImage, AutoModel, AutoProcessor, AutoTokenizer } from '@huggingface/transformers';

// Configuration for maximum performance and memory safety
env.allowLocalModels = false;
env.useBrowserCache = true;

// Optimization: Reserve CPU cores for browser UI and compositor to prevent UI freeze and jitter
const hardwareConcurrency = typeof self !== 'undefined' && self.navigator ? (self.navigator.hardwareConcurrency || 4) : 4;
// Allocate at most half the cores (capped at 4) to leave cores free for browser UI thread
const optimalThreads = Math.max(1, Math.min(4, Math.floor(hardwareConcurrency / 2)));

if (env.backends?.onnx?.wasm) {
    (env.backends.onnx.wasm as any).numThreads = optimalThreads;
    (env.backends.onnx.wasm as any).proxy = false;
}
if ((env as any).wasm) {
    (env as any).wasm.numThreads = optimalThreads;
}

// Throttle progress updates to avoid flooding main thread React state
let lastProgressTime = 0;
function postThrottledProgress(msg: { status: string; message: string; progress: number }, force = false) {
    const now = performance.now();
    if (force || now - lastProgressTime >= 80) {
        lastProgressTime = now;
        self.postMessage(msg);
    }
}

// Active pipelines and model caches
const pipelineCache: Record<string, any> = {};
let rmbgModel: any = null;
let rmbgProcessor: any = null;

let clipsegModel: any = null;
let clipsegProcessor: any = null;
let clipsegTokenizer: any = null;

// Determine optimal hardware acceleration
let forceWasm = false;
function getOptimalDevice(): 'webgpu' | 'wasm' {
    if (forceWasm) return 'wasm';
    if (typeof self !== 'undefined' && self.navigator && (self.navigator as any).gpu) {
        return 'webgpu';
    }
    return 'wasm';
}

function resetWorkerModels() {
    rmbgModel = null;
    rmbgProcessor = null;
    clipsegModel = null;
    clipsegProcessor = null;
    clipsegTokenizer = null;
    for (const key in pipelineCache) {
        delete pipelineCache[key];
    }
}

/**
 * Loads and caches the briaai/RMBG-1.4 neural matting model.
 * Uses AutoModel + AutoProcessor to bypass standard pipeline model_type checks.
 */
async function getRMBG(targetDevice?: 'webgpu' | 'wasm') {
    const device = targetDevice || getOptimalDevice();
    if (rmbgModel && rmbgProcessor && (!targetDevice || (rmbgModel as any).device === targetDevice)) {
        return { model: rmbgModel, processor: rmbgProcessor };
    }

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
                    postThrottledProgress({
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
        forceWasm = true;
        resetWorkerModels();
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
            postThrottledProgress({
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
                    postThrottledProgress({
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
 * Downsample image if larger than maxDim (1024px matching RMBG-1.4 native tensor shape)
 * to ensure fast inference and prevent mobile CPU thread starvation and tab crashes.
 */
async function downsampleIfNeeded(raw: any, maxDim = 1024) {
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

    if (action === 'reset') {
        resetWorkerModels();
        forceWasm = false;
        self.postMessage({ status: 'ready', message: 'Engine reset successfully' });
        return;
    }

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
        
        const executeTask = async (isRetryWithWasm = false): Promise<void> => {
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
                const processImg = await downsampleIfNeeded(img, 1024);

                let maskData: Uint8ClampedArray;
                let outWidth = processImg.width;
                let outHeight = processImg.height;
                let channels = 4;

                // Check if processImg has existing transparent cutout (e.g., from prior RMBG or PNG alpha)
                let hasExistingAlpha = false;
                let origAlpha: Uint8Array | null = null;
                if (processImg.channels === 4) {
                    const totalPx = processImg.width * processImg.height;
                    origAlpha = new Uint8Array(totalPx);
                    const pData = processImg.data;
                    let transparentCount = 0;
                    for (let i = 0; i < totalPx; i++) {
                        const a = pData[i * 4 + 3];
                        origAlpha[i] = a;
                        if (a < 220) {
                            transparentCount++;
                        }
                    }
                    // If more than 0.5% of pixels are transparent, image already has a cutout
                    if (transparentCount > (totalPx * 0.005)) {
                        hasExistingAlpha = true;
                    }
                }

                if (isPromptMode) {
                    // Text-prompted selective object isolation using CLIPSeg + Neural Matting Fusion
                    const clipsegModelId = payload.modelId || 'Xenova/clipseg-rd64-refined';
                    self.postMessage({ status: 'processing', message: `Isolating "${prompt}" with AI...` });
                    
                    const { model, processor, tokenizer } = await getCLIPSeg(clipsegModelId);

                    // Process image into pixel_values once
                    const image_inputs = await processor(processImg);

                    // Support compound prompts like "face and hair" or "dog, cat"
                    const rawPrompt = prompt.trim();
                    const subParts = rawPrompt
                        .split(/\s+and\s+|,|\+/i)
                        .map((s: string) => s.trim())
                        .filter((s: string) => s.length > 0);
                    
                    // Queries to evaluate: combined prompt plus individual components
                    const queries = Array.from(new Set([rawPrompt, ...subParts]));

                    // Run forward pass for each query and take pixel-wise maximum probability
                    let combinedProbs: Float32Array | null = null;

                    for (const query of queries) {
                        const text_inputs = tokenizer(query);
                        const { logits } = await model({
                            ...image_inputs,
                            input_ids: text_inputs.input_ids,
                            attention_mask: text_inputs.attention_mask
                        });
                        const p = logits.sigmoid().data; // Float32Array [352*352]

                        if (!combinedProbs) {
                            combinedProbs = new Float32Array(p);
                        } else {
                            for (let i = 0; i < combinedProbs.length; i++) {
                                if (p[i] > combinedProbs[i]) {
                                    combinedProbs[i] = p[i];
                                }
                            }
                        }
                        try {
                            logits?.dispose?.();
                        } catch {}
                    }

                    const probs = combinedProbs!;

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
                    const transitionWidth = 0.08;
                    const low = activeThreshold;
                    const high = activeThreshold + transitionWidth;

                    for (let i = 0; i < probs.length; i++) {
                        const norm = (probs[i] - minP) / range;
                        if (norm >= high) {
                            maskBytes[i] = 255;
                        } else if (norm <= low) {
                            maskBytes[i] = 0;
                        } else {
                            const t = (norm - low) / transitionWidth;
                            const smoothT = t * t * (3 - 2 * t);
                            maskBytes[i] = Math.round(smoothT * 255);
                        }
                    }

                    // Morphological hole filling on 352x352 mask to eliminate internal facial/patch voids
                    const w = 352;
                    const h = 352;
                    const filledMaskBytes = new Uint8Array(maskBytes);
                    for (let y = 1; y < h - 1; y++) {
                        for (let x = 1; x < w - 1; x++) {
                            const idx = y * w + x;
                            if (maskBytes[idx] === 0) {
                                let opaqueCount = 0;
                                if (maskBytes[idx - 1] >= 180) opaqueCount++;
                                if (maskBytes[idx + 1] >= 180) opaqueCount++;
                                if (maskBytes[idx - w] >= 180) opaqueCount++;
                                if (maskBytes[idx + w] >= 180) opaqueCount++;
                                if (opaqueCount >= 3) {
                                    filledMaskBytes[idx] = 255;
                                }
                            }
                        }
                    }

                    // Construct RawImage mask at model resolution (352x352) and resize to processImg resolution
                    const maskImg = new RawImage(filledMaskBytes, 352, 352, 1);
                    const resizedMask = await maskImg.resize(outWidth, outHeight);

                    // High-precision edge fusion
                    if (hasExistingAlpha && origAlpha) {
                        for (let i = 0; i < origAlpha.length; i++) {
                            const promptAlpha = resizedMask.data[i] / 255;
                            const existAlpha = origAlpha[i] / 255;
                            resizedMask.data[i] = Math.round(promptAlpha * existAlpha * 255);
                        }
                    } else if (payload.useMattingGuide !== false) {
                        try {
                            const { model: rmbgM, processor: rmbgP } = await getRMBG();
                            const { pixel_values } = await rmbgP(processImg);
                            const { output } = await rmbgM({ input: pixel_values });
                            const tensorMask = output[0].mul(255).to('uint8');
                            const tensorImage = RawImage.fromTensor(tensorMask);
                            const rmbgMaskRaw = await tensorImage.resize(outWidth, outHeight);

                            for (let i = 0; i < resizedMask.data.length; i++) {
                                const rmbgA = rmbgMaskRaw.data[i] / 255;
                                const clipA = resizedMask.data[i] / 255;
                                resizedMask.data[i] = Math.round(rmbgA * clipA * 255);
                            }

                            try {
                                tensorMask?.dispose?.();
                                pixel_values?.dispose?.();
                                if (output) for (const t of output) t?.dispose?.();
                            } catch {}
                        } catch (fusionErr) {
                            console.warn('[Worker] Matting fusion fallback to direct mask:', fusionErr);
                        }
                    }

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

                    // Immediately dispose tensors to free WebGPU/WASM memory and prevent 'destroy' leaks
                    try {
                        tensorMask?.dispose?.();
                        pixel_values?.dispose?.();
                        if (output) for (const t of output) t?.dispose?.();
                    } catch {}
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
                const errMsg = String(error?.message || error || '');
                const isGpuFailure = /destroy|webgpu|device|buffer|memory|gl|lost/i.test(errMsg);

                if (isGpuFailure && !isRetryWithWasm) {
                    console.warn('[Worker] GPU/destroy error caught during processing. Recovering with WASM fallback...', error);
                    forceWasm = true;
                    resetWorkerModels();
                    self.postMessage({
                        status: 'loading',
                        message: 'Memory threshold reached. Auto-recovering with CPU engine...',
                        progress: 45
                    });
                    // Immediately retry execution using WASM
                    return await executeTask(true);
                }

                console.error('[Worker] Processing error:', error);
                const shieldedMessage = isGpuFailure
                    ? 'AI engine refreshed memory limits. Click to process again.'
                    : (error?.message || 'Background removal failed');

                self.postMessage({
                    status: 'error',
                    message: shieldedMessage
                });
            }
        };

        await executeTask();
    }
};
