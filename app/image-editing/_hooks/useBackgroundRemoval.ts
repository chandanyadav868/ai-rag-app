"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export type BackgroundRemovalStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'complete' | 'error';

export interface RemoveBackgroundOptions {
    modelId?: string;
    mode?: 'auto' | 'prompt';
    prompt?: string;
    threshold?: number;
}

// Global state to share worker across multiple component instances
let globalWorker: Worker | null = null;
const subscribers: Set<(data: any) => void> = new Set();
let isInitialized = false;
let modelReady = false;

export function useBackgroundRemoval() {
    const [status, setStatus] = useState<BackgroundRemovalStatus>(modelReady ? 'ready' : 'idle');
    const [progress, setProgress] = useState<string>('');
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [isModelLoaded, setIsModelLoaded] = useState(modelReady);
    const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
    const [deviceType, setDeviceType] = useState<'webgpu' | 'wasm'>('wasm');
    const [error, setError] = useState<string | null>(null);

    const initWorker = useCallback(() => {
        if (typeof window === 'undefined') return null;
        if (!globalWorker) {
            globalWorker = new Worker(new URL('../_workers/backgroundRemoval.worker.ts', import.meta.url));
            isInitialized = false;
        }
        return globalWorker;
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && (navigator as any).gpu) {
            setDeviceType('webgpu');
        } else {
            setDeviceType('wasm');
        }

        const worker = initWorker();
        if (!worker) return;

        const handleMessage = (event: MessageEvent) => {
            const { status: msgStatus, message, progress: progVal } = event.data;

            if (msgStatus === 'ready') {
                modelReady = true;
                setIsModelLoaded(true);
            }

            subscribers.forEach(sub => sub(event.data));
        };

        const sub = (data: any) => {
            const { status: msgStatus, message, progress: progVal, durationMs } = data;
            if (msgStatus) setStatus(msgStatus);
            if (message) setProgress(message);
            if (typeof progVal === 'number') setProgressPercent(progVal);
            if (typeof durationMs === 'number') setLastDurationMs(durationMs);
            if (msgStatus === 'error') setError(message);
            if (msgStatus === 'ready') {
                setIsModelLoaded(true);
                setStatus('ready');
            }
        };

        subscribers.add(sub);
        worker.addEventListener('message', handleMessage);

        if (modelReady) {
            setIsModelLoaded(true);
            setStatus('ready');
        }

        return () => {
            subscribers.delete(sub);
            worker?.removeEventListener('message', handleMessage);
        };
    }, [initWorker]);

    const loadModel = useCallback((modelId: string = 'briaai/RMBG-1.4') => {
        if (!globalWorker) {
            initWorker();
        }
        if (!globalWorker) return;
        setStatus('loading');
        setProgress('Connecting to Neural Engine...');
        globalWorker.postMessage({ action: 'load', payload: { modelId } });
    }, [initWorker]);

    const removeBackground = useCallback(async (
        imageSrc: string,
        options: RemoveBackgroundOptions = {}
    ): Promise<string | null> => {
        const worker = initWorker();
        if (!worker) {
            toast.error("Worker unavailable in current environment");
            return null;
        }

        const {
            modelId = options.mode === 'prompt' ? 'Xenova/clipseg-rd64-refined' : 'briaai/RMBG-1.4',
            mode = 'auto',
            prompt,
            threshold = 0.35
        } = options;

        setStatus('processing');
        setError(null);

        return new Promise((resolve) => {
            const handleMessage = (event: MessageEvent) => {
                const { status: msgStatus, payload, durationMs } = event.data;

                if (msgStatus === 'complete') {
                    worker.removeEventListener('message', handleMessage);
                    if (typeof durationMs === 'number') setLastDurationMs(durationMs);

                    try {
                        applyMaskToImage(imageSrc, payload.mask, payload.width, payload.height)
                            .then((result) => {
                                setStatus('ready');
                                resolve(result);
                            })
                            .catch((err) => {
                                console.error("Error applying mask:", err);
                                setStatus('error');
                                resolve(null);
                            });
                    } catch (err) {
                        setStatus('error');
                        resolve(null);
                    }
                } else if (msgStatus === 'error') {
                    worker.removeEventListener('message', handleMessage);
                    setStatus('error');
                    toast.error(event.data.message || "Failed to remove background");
                    resolve(null);
                }
            };

            worker.addEventListener('message', handleMessage);
            worker.postMessage({
                action: 'removeBackground',
                payload: {
                    image: imageSrc,
                    modelId,
                    mode,
                    prompt,
                    threshold
                }
            });
        });
    }, [initWorker]);

    const removeBackgroundFromFrame = useCallback(async (
        frameData: Uint8ClampedArray,
        width: number,
        height: number,
        modelId: string = 'briaai/RMBG-1.4'
    ): Promise<Uint8Array | null> => {
        const worker = initWorker();
        if (!worker) return null;

        return new Promise((resolve) => {
            const handleMessage = (event: MessageEvent) => {
                const { status, payload, action: msgAction } = event.data;

                if (status === 'complete' && msgAction === 'processFrame') {
                    worker.removeEventListener('message', handleMessage);
                    resolve(payload.mask.data);
                } else if (status === 'error') {
                    worker.removeEventListener('message', handleMessage);
                    resolve(null);
                }
            };

            worker.addEventListener('message', handleMessage);
            worker.postMessage({
                action: 'processFrame',
                payload: { frame: frameData, width, height, modelId }
            }, [frameData.buffer]);
        });
    }, [initWorker]);

    return {
        status,
        progress,
        progressPercent,
        isModelLoaded,
        lastDurationMs,
        deviceType,
        error,
        loadModel,
        removeBackground,
        removeBackgroundFromFrame
    };
}

/**
 * Composites the predicted alpha mask with the original image at full native resolution.
 * Uses hardware-accelerated destination-in blending for feathered edges without resolution loss.
 */
async function applyMaskToImage(
    originalSrc: string,
    mask: { data: Uint8Array | Uint8ClampedArray; channels?: number },
    maskWidth: number,
    maskHeight: number
): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = maskWidth;
    canvas.height = maskHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    const channels = mask.channels || 4;

    if (channels === 4) {
        // Direct 4-channel RGBA cutout produced with neural putAlpha
        const imgData = new ImageData(new Uint8ClampedArray(mask.data), maskWidth, maskHeight);
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL('image/png');
    }

    // Fallback if 1-channel mask: apply alpha directly to image pixels
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalSrc;
    });

    ctx.drawImage(img, 0, 0, maskWidth, maskHeight);
    const imgData = ctx.getImageData(0, 0, maskWidth, maskHeight);
    const pixels = imgData.data;
    for (let i = 0; i < maskWidth * maskHeight; i++) {
        pixels[i * 4 + 3] = mask.data[i];
    }
    ctx.putImageData(imgData, 0, 0);

    return canvas.toDataURL('image/png');
}
