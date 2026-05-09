"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export type BackgroundRemovalStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'complete' | 'error';

// Global state to share worker across multiple component instances
let globalWorker: Worker | null = null;
let subscribers: Set<(data: any) => void> = new Set();
let isInitialized = false;
let modelReady = false;

export function useBackgroundRemoval() {
    const [status, setStatus] = useState<BackgroundRemovalStatus>(modelReady ? 'ready' : 'idle');
    const [progress, setProgress] = useState<string>('');
    const [isModelLoaded, setIsModelLoaded] = useState(modelReady);
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
        const worker = initWorker();
        if (!worker) return;

        const handleMessage = (event: MessageEvent) => {
            const { status: msgStatus, message } = event.data;
            
            if (msgStatus === 'ready') {
                modelReady = true;
                setIsModelLoaded(true);
            }
            
            // Notify all subscribers
            subscribers.forEach(sub => sub(event.data));
        };

        const sub = (data: any) => {
            const { status: msgStatus, message } = data;
            if (msgStatus) setStatus(msgStatus);
            if (message) setProgress(message);
            if (msgStatus === 'error') setError(message);
            if (msgStatus === 'ready') {
                setIsModelLoaded(true);
                setStatus('ready');
            }
        };

        subscribers.add(sub);
        worker.addEventListener('message', handleMessage);

        // Sync initial state
        if (modelReady) {
            setIsModelLoaded(true);
            setStatus('ready');
        }

        return () => {
            subscribers.delete(sub);
            worker?.removeEventListener('message', handleMessage);
        };
    }, [initWorker]);

    const loadModel = useCallback((modelId: string = 'Xenova/modnet') => {
        if (!globalWorker || isInitialized) return;
        isInitialized = true;
        setStatus('loading');
        globalWorker.postMessage({ action: 'load', payload: { modelId } });
    }, []);

    const removeBackground = useCallback(async (imageSrc: string, modelId: string = 'Xenova/modnet'): Promise<string | null> => {
        if (!globalWorker || !modelReady) {
            toast.error("Model not ready yet.");
            return null;
        }

        return new Promise((resolve) => {
            const handleMessage = (event: MessageEvent) => {
                const { status, payload } = event.data;
                
                if (status === 'complete') {
                    globalWorker?.removeEventListener('message', handleMessage);
                    
                    try {
                        applyMaskToImage(imageSrc, payload.mask, payload.width, payload.height)
                            .then(resolve)
                            .catch(() => resolve(null));
                    } catch (err) {
                        resolve(null);
                    }
                } else if (status === 'error') {
                    globalWorker?.removeEventListener('message', handleMessage);
                    resolve(null);
                }
            };

            globalWorker?.addEventListener('message', handleMessage);
            globalWorker?.postMessage({ action: 'removeBackground', payload: { image: imageSrc, modelId } });
        });
    }, []);

    const removeBackgroundFromFrame = useCallback(async (frameData: Uint8ClampedArray, width: number, height: number, modelId: string = 'Xenova/modnet'): Promise<Uint8Array | null> => {
        if (!globalWorker || !modelReady) return null;

        return new Promise((resolve) => {
            const handleMessage = (event: MessageEvent) => {
                const { status, payload, action: msgAction } = event.data;
                
                if (status === 'complete' && msgAction === 'processFrame') {
                    globalWorker?.removeEventListener('message', handleMessage);
                    resolve(payload.mask.data);
                } else if (status === 'error') {
                    globalWorker?.removeEventListener('message', handleMessage);
                    resolve(null);
                }
            };

            globalWorker?.addEventListener('message', handleMessage);
            globalWorker?.postMessage({ 
                action: 'processFrame', 
                payload: { frame: frameData, width, height, modelId } 
            }, [frameData.buffer]); // Use transferable objects for performance
        });
    }, []);

    return {
        status,
        progress,
        isModelLoaded,
        loadModel,
        removeBackground,
        removeBackgroundFromFrame
    };
}

async function applyMaskToImage(originalSrc: string, mask: any, width: number, height: number): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    canvas.width = width;
    canvas.height = height;

    const maskData = mask.data;
    const channels = mask.channels || (maskData.length === width * height ? 1 : 4);

    if (channels === 4) {
        // The AI already returned a full RGBA image with background removed
        const imageData = new ImageData(new Uint8ClampedArray(maskData), width, height);
        ctx.putImageData(imageData, 0, 0);
    } else {
        // The AI returned a grayscale mask, we need to apply it to the original
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = originalSrc;
        });
        
        // Draw original image at the AI's output resolution
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < width * height; ++i) {
            data[i * 4 + 3] = maskData[i];
        }
        ctx.putImageData(imageData, 0, 0);
    }

    return canvas.toDataURL('image/png');
}
