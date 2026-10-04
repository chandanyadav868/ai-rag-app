"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export type InpaintStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'complete' | 'error';

export function useMagicEraser() {
    const [status, setStatus] = useState<InpaintStatus>('idle');
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [deviceType, setDeviceType] = useState<'webgpu' | 'wasm'>('wasm');
    const workerRef = useRef<Worker | null>(null);
    const pendingPromiseRef = useRef<{
        resolve: (dataUrl: string) => void;
        reject: (reason: any) => void;
        canvas: HTMLCanvasElement;
        bbox: { minX: number; minY: number; maxX: number; maxY: number };
        patchCanvas: HTMLCanvasElement;
        maskPatchCanvas: HTMLCanvasElement;
    } | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if ((navigator as any).gpu) {
            setDeviceType('webgpu');
        } else {
            setDeviceType('wasm');
        }

        const worker = new Worker(new URL('../_workers/inpaint.worker.ts', import.meta.url));
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent) => {
            const { status: msgStatus, message, payload, action, progress } = event.data;

            if (msgStatus === 'loading') {
                setStatus('loading');
                setProgressMessage(message || 'Initializing Neural Engine...');
                if (typeof progress === 'number') setProgressPercent(progress);
            } else if (msgStatus === 'ready') {
                setStatus('ready');
                setProgressMessage(message || 'LaMa Ready');
                setProgressPercent(100);
            } else if (msgStatus === 'processing') {
                setStatus('processing');
                setProgressMessage(message || 'Inpainting...');
            } else if (msgStatus === 'complete' && action === 'inpaint' && pendingPromiseRef.current) {
                const { resolve, canvas, bbox, patchCanvas } = pendingPromiseRef.current;
                const { image: inpaintedPixels, width: pW, height: pH } = payload;

                try {
                    // Put inpainted pixels back onto patch canvas
                    const pCtx = patchCanvas.getContext('2d')!;
                    const imgData = new ImageData(new Uint8ClampedArray(inpaintedPixels), pW, pH);
                    pCtx.putImageData(imgData, 0, 0);

                    // Composite patch back onto original full-res canvas
                    const mainCtx = canvas.getContext('2d')!;
                    mainCtx.save();
                    mainCtx.drawImage(patchCanvas, bbox.minX, bbox.minY);
                    mainCtx.restore();

                    const resultDataUrl = canvas.toDataURL('image/png');
                    setStatus('complete');
                    setProgressMessage('');
                    pendingPromiseRef.current = null;
                    resolve(resultDataUrl);
                } catch (err) {
                    console.error('[Magic Eraser] Blending failed:', err);
                    pendingPromiseRef.current?.reject(err);
                    pendingPromiseRef.current = null;
                }
            } else if (msgStatus === 'error') {
                setStatus('error');
                setProgressMessage('');
                toast.error(message || 'Inpainting failed');
                pendingPromiseRef.current?.reject(new Error(message));
                pendingPromiseRef.current = null;
            }
        };

        worker.postMessage({ action: 'init' });

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    /**
     * Erases the masked region of an image using Smart Bounding Box Patch processing
     */
    const inpaint = useCallback(async (
        sourceImg: HTMLImageElement | HTMLCanvasElement,
        maskCanvas: HTMLCanvasElement
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!workerRef.current) {
                reject(new Error("Worker not initialized"));
                return;
            }

            const width = sourceImg.width || (sourceImg as HTMLImageElement).naturalWidth;
            const height = sourceImg.height || (sourceImg as HTMLImageElement).naturalHeight;

            if (!width || !height) {
                reject(new Error("Invalid image dimensions"));
                return;
            }

            // Create working canvas for full image
            const workingCanvas = document.createElement('canvas');
            workingCanvas.width = width;
            workingCanvas.height = height;
            const wCtx = workingCanvas.getContext('2d')!;
            wCtx.drawImage(sourceImg, 0, 0, width, height);

            // Read mask data to find bounding box
            const mCtx = maskCanvas.getContext('2d')!;
            const maskImgData = mCtx.getImageData(0, 0, width, height);
            const mData = maskImgData.data;

            let minX = width, minY = height, maxX = 0, maxY = 0;
            let hasMask = false;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    // Check if mask has painted strokes (red, pink, or alpha)
                    if (mData[idx] > 30 || mData[idx + 3] > 30) {
                        hasMask = true;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (!hasMask) {
                // If nothing was painted, return original
                resolve(workingCanvas.toDataURL('image/png'));
                return;
            }

            // Add context padding (at least 32px or 25% margin)
            const padX = Math.max(32, Math.round((maxX - minX) * 0.25));
            const padY = Math.max(32, Math.round((maxY - minY) * 0.25));

            minX = Math.max(0, minX - padX);
            minY = Math.max(0, minY - padY);
            maxX = Math.min(width, maxX + padX);
            maxY = Math.min(height, maxY + padY);

            const patchW = maxX - minX;
            const patchH = maxY - minY;

            if (patchW <= 0 || patchH <= 0) {
                resolve(workingCanvas.toDataURL('image/png'));
                return;
            }

            // Create patch canvases
            const patchCanvas = document.createElement('canvas');
            patchCanvas.width = patchW;
            patchCanvas.height = patchH;
            const pCtx = patchCanvas.getContext('2d')!;
            pCtx.drawImage(workingCanvas, minX, minY, patchW, patchH, 0, 0, patchW, patchH);

            const maskPatchCanvas = document.createElement('canvas');
            maskPatchCanvas.width = patchW;
            maskPatchCanvas.height = patchH;
            const mpCtx = maskPatchCanvas.getContext('2d')!;
            mpCtx.drawImage(maskCanvas, minX, minY, patchW, patchH, 0, 0, patchW, patchH);

            const patchImgData = pCtx.getImageData(0, 0, patchW, patchH);
            const maskPatchImgData = mpCtx.getImageData(0, 0, patchW, patchH);

            pendingPromiseRef.current = {
                resolve,
                reject,
                canvas: workingCanvas,
                bbox: { minX, minY, maxX, maxY },
                patchCanvas,
                maskPatchCanvas
            };

            setStatus('processing');
            setProgressMessage('Erasing object and reconstructing background...');

            // Send buffers to worker
            workerRef.current.postMessage({
                action: 'inpaint',
                payload: {
                    imagePixels: patchImgData.data,
                    maskPixels: maskPatchImgData.data,
                    width: patchW,
                    height: patchH
                }
            }, [patchImgData.data.buffer, maskPatchImgData.data.buffer]);
        });
    }, []);

    return {
        status,
        isProcessing: status === 'processing',
        isLoading: status === 'loading',
        progressMessage,
        progressPercent,
        deviceType,
        inpaint
    };
}
