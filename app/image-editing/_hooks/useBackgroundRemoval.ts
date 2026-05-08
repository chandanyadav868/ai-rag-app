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
    const [status, setStatus] = useState<BackgroundRemovalStatus>('idle');
    const [progress, setProgress] = useState<string>('');
    const [isModelLoaded, setIsModelLoaded] = useState(modelReady);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!globalWorker) {
            globalWorker = new Worker(new URL('../_workers/backgroundRemoval.worker.ts', import.meta.url));
            isInitialized = false;
        }

        const handleMessage = (event: MessageEvent) => {
            const { status: msgStatus, message, payload } = event.data;
            
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
            if (msgStatus === 'ready') setIsModelLoaded(true);
        };

        subscribers.add(sub);
        globalWorker.addEventListener('message', handleMessage);

        // Start loading if not already initialized
        if (!isInitialized) {
            isInitialized = true;
            globalWorker.postMessage({ action: 'load', payload: { modelId: 'Xenova/modnet' } });
        }

        // Sync initial state
        if (modelReady) {
            setIsModelLoaded(true);
            setStatus('ready');
        }

        return () => {
            subscribers.delete(sub);
            globalWorker?.removeEventListener('message', handleMessage);
            // We don't terminate the global worker here as other components might be using it
        };
    }, []);

    const removeBackground = useCallback(async (imageSrc: string): Promise<string | null> => {
        if (!globalWorker || !modelReady) {
            toast.error("Model not ready yet.");
            return null;
        }

        return new Promise((resolve) => {
            const handleMessage = async (event: any) => {
                const { status, payload, message } = event.data;
                
                if (status === 'complete') {
                    globalWorker?.removeEventListener('message', handleMessage);
                    
                    try {
                        // Process the mask on main thread using Canvas
                        const result = await applyMaskToImage(imageSrc, payload.mask, payload.width, payload.height);
                        resolve(result);
                    } catch (err) {
                        console.error("Mask application error:", err);
                        resolve(null);
                    }
                } else if (status === 'error') {
                    globalWorker?.removeEventListener('message', handleMessage);
                    resolve(null);
                }
            };

            globalWorker?.addEventListener('message', handleMessage);
            globalWorker?.postMessage({ action: 'removeBackground', payload: { image: imageSrc } });
        });
    }, []);

    return {
        status,
        progress,
        isModelLoaded,
        removeBackground
    };
}

async function applyMaskToImage(originalSrc: string, mask: any, width: number, height: number): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    canvas.width = width;
    canvas.height = height;

    // 1. Draw original image
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalSrc;
    });
    ctx.drawImage(img, 0, 0, width, height);

    // 2. Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 3. Apply mask to alpha channel
    // The mask from BiRefNet (via transformers.js) is usually a grayscale RawImage
    // mask.data is a Uint8Array
    const maskData = mask.data;
    
    for (let i = 0; i < maskData.length; ++i) {
        // Set alpha channel (the 4th byte in RGBA)
        data[i * 4 + 3] = maskData[i];
    }

    // 4. Put data back to canvas
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
}
