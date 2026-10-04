// @ts-nocheck
import * as ort from 'onnxruntime-web';

// Global cache and session
let session: ort.InferenceSession | null = null;
let isInitializing = false;
const MODEL_URL = 'https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx';
const MODEL_TOTAL_BYTES = 208044816; // ~208 MB

function getOptimalDevice(): 'webgpu' | 'wasm' {
    if (typeof self !== 'undefined' && self.navigator && (self.navigator as any).gpu) {
        return 'webgpu';
    }
    return 'wasm';
}

/**
 * Downloads and caches the 208MB LaMa ONNX model weights in the browser Cache API
 */
async function getModelArrayBuffer(): Promise<ArrayBuffer> {
    const cacheName = 'lama-onnx-model-cache-v1';

    let cache: Cache | null = null;
    try {
        if (typeof caches !== 'undefined') {
            cache = await caches.open(cacheName);
            const cachedRes = await cache.match(MODEL_URL);
            if (cachedRes) {
                self.postMessage({
                    status: 'loading',
                    message: 'Loading LaMa Neural Model from local cache...',
                    progress: 95
                });
                return await cachedRes.arrayBuffer();
            }
        }
    } catch (e) {
        console.warn('[LaMa Worker] Cache API not accessible, downloading directly:', e);
    }

    self.postMessage({
        status: 'loading',
        message: 'Downloading LaMa Neural Weights (208 MB)...',
        progress: 5
    });

    const response = await fetch(MODEL_URL);
    if (!response.ok) {
        throw new Error(`Failed to download LaMa model: ${response.status} ${response.statusText}`);
    }

    const contentLength = Number(response.headers.get('content-length')) || MODEL_TOTAL_BYTES;
    let received = 0;

    const reader = response.body?.getReader();
    if (!reader) {
        const buf = await response.arrayBuffer();
        if (cache) {
            try { await cache.put(MODEL_URL, new Response(buf.slice(0))); } catch (err) {}
        }
        return buf;
    }

    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
            chunks.push(value);
            received += value.length;
            const percent = Math.min(95, Math.round((received / contentLength) * 100));
            const mb = (received / (1024 * 1024)).toFixed(1);
            const totalMb = (contentLength / (1024 * 1024)).toFixed(1);

            self.postMessage({
                status: 'loading',
                message: `Downloading LaMa Neural Model: ${percent}% (${mb} MB / ${totalMb} MB)`,
                progress: percent
            });
        }
    }

    const allChunks = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        allChunks.set(chunk, offset);
        offset += chunk.length;
    }

    const arrayBuffer = allChunks.buffer;
    if (cache) {
        try {
            await cache.put(MODEL_URL, new Response(arrayBuffer.slice(0)));
        } catch (err) {
            console.warn('[LaMa Worker] Could not store in cache:', err);
        }
    }

    return arrayBuffer;
}

/**
 * Initializes the ONNX Runtime Web session for LaMa
 */
async function getInferenceSession(): Promise<ort.InferenceSession> {
    if (session) return session;
    if (isInitializing) {
        while (isInitializing) {
            await new Promise(r => setTimeout(r, 100));
        }
        if (session) return session;
    }

    isInitializing = true;
    try {
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/';

        const buffer = await getModelArrayBuffer();
        const device = getOptimalDevice();

        self.postMessage({
            status: 'loading',
            message: `Compiling LaMa Neural Graph (${device === 'webgpu' ? 'WebGPU' : 'WASM'})...`,
            progress: 98
        });

        try {
            session = await ort.InferenceSession.create(buffer, {
                executionProviders: [device, 'wasm'],
                graphOptimizationLevel: 'all'
            });
        } catch (gpuErr) {
            console.warn('[LaMa Worker] Primary execution provider failed, falling back to WASM:', gpuErr);
            session = await ort.InferenceSession.create(buffer, {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all'
            });
        }

        self.postMessage({
            status: 'ready',
            message: 'LaMa Neural Inpainting Engine Ready',
            device,
            progress: 100
        });

        return session;
    } finally {
        isInitializing = false;
    }
}

/**
 * Bilinear pixel resize helper
 */
function resizePixels(
    src: Uint8ClampedArray,
    sw: number,
    sh: number,
    dw: number,
    dh: number
): Uint8ClampedArray {
    const dst = new Uint8ClampedArray(dw * dh * 4);
    const xRatio = sw / dw;
    const yRatio = sh / dh;

    for (let dy = 0; dy < dh; dy++) {
        const sy = Math.min(sh - 1, Math.floor(dy * yRatio));
        for (let dx = 0; dx < dw; dx++) {
            const sx = Math.min(sw - 1, Math.floor(dx * xRatio));
            const srcIdx = (sy * sw + sx) * 4;
            const dstIdx = (dy * dw + dx) * 4;
            dst[dstIdx] = src[srcIdx];
            dst[dstIdx + 1] = src[srcIdx + 1];
            dst[dstIdx + 2] = src[srcIdx + 2];
            dst[dstIdx + 3] = src[srcIdx + 3];
        }
    }
    return dst;
}

self.onmessage = async (event: MessageEvent) => {
    const { action, payload } = event.data;

    if (action === 'init') {
        try {
            await getInferenceSession();
        } catch (err: any) {
            console.error('[LaMa Worker] Init error:', err);
            self.postMessage({
                status: 'error',
                message: err?.message || 'Failed to initialize LaMa model'
            });
        }
    } else if (action === 'inpaint') {
        const startTime = performance.now();
        try {
            const { imagePixels, maskPixels, width, height } = payload;

            self.postMessage({
                status: 'processing',
                message: 'Synthesizing with LaMa Neural Network...'
            });

            const sess = await getInferenceSession();

            // Resize patch to 512x512 expected by LaMa
            const image512 = resizePixels(imagePixels, width, height, 512, 512);
            const mask512 = resizePixels(maskPixels, width, height, 512, 512);

            const numPixels = 512 * 512;
            const imgFloat32 = new Float32Array(3 * numPixels);
            const maskFloat32 = new Float32Array(1 * numPixels);

            for (let i = 0; i < numPixels; i++) {
                const idx = i * 4;
                // Channel 0 (R), Channel 1 (G), Channel 2 (B) normalized [0.0, 1.0]
                imgFloat32[i] = image512[idx] / 255.0;
                imgFloat32[numPixels + i] = image512[idx + 1] / 255.0;
                imgFloat32[numPixels * 2 + i] = image512[idx + 2] / 255.0;

                // Mask: 1.0 where masked (painted), 0.0 for preserved background
                const isMask = (mask512[idx] > 20 || mask512[idx + 3] > 20) ? 1.0 : 0.0;
                maskFloat32[i] = isMask;
            }

            const imageTensor = new ort.Tensor('float32', imgFloat32, [1, 3, 512, 512]);
            const maskTensor = new ort.Tensor('float32', maskFloat32, [1, 1, 512, 512]);

            const inputNames = sess.inputNames;
            const feeds: Record<string, ort.Tensor> = {};
            feeds[inputNames[0] || 'image'] = imageTensor;
            feeds[inputNames[1] || 'mask'] = maskTensor;

            // Run neural inpainting inference
            const results = await sess.run(feeds);
            const outputNames = sess.outputNames;
            const outputTensor = results[outputNames[0] || 'output'];
            const outData = outputTensor.data as Float32Array;

            // Detect output range [0, 1] vs [0, 255]
            let maxVal = 0;
            for (let i = 0; i < Math.min(1000, outData.length); i++) {
                if (outData[i] > maxVal) maxVal = outData[i];
            }
            const multiplier = maxVal > 1.5 ? 1 : 255;

            // Convert planar [1, 3, 512, 512] back to interleaved RGBA
            const out512RGBA = new Uint8ClampedArray(numPixels * 4);
            for (let i = 0; i < numPixels; i++) {
                const r = Math.min(255, Math.max(0, Math.round(outData[i] * multiplier)));
                const g = Math.min(255, Math.max(0, Math.round(outData[numPixels + i] * multiplier)));
                const b = Math.min(255, Math.max(0, Math.round(outData[numPixels * 2 + i] * multiplier)));

                const idx = i * 4;
                out512RGBA[idx] = r;
                out512RGBA[idx + 1] = g;
                out512RGBA[idx + 2] = b;
                out512RGBA[idx + 3] = 255;
            }

            // Resize back to original patch resolution
            const finalPatchRGBA = resizePixels(out512RGBA, 512, 512, width, height);
            const durationMs = Math.round(performance.now() - startTime);

            self.postMessage(
                {
                    status: 'complete',
                    action: 'inpaint',
                    durationMs,
                    payload: {
                        image: finalPatchRGBA,
                        width,
                        height
                    }
                },
                [finalPatchRGBA.buffer] as any
            );
        } catch (error: any) {
            console.error('[LaMa Worker] Processing error:', error);
            self.postMessage({
                status: 'error',
                message: error?.message || 'Neural inpainting failed'
            });
        }
    }
};
