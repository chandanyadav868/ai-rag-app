"use client";

import { useState, useEffect, useCallback } from 'react';

export type InpaintStatus = 'idle' | 'locked';

export function useMagicEraser() {
    const [status] = useState<InpaintStatus>('locked');

    useEffect(() => {
        // Automatically purge any cached LaMa model weights from user's browser to free storage and memory
        if (typeof window !== 'undefined' && 'caches' in window) {
            caches.delete('lama-onnx-model-cache-v1').catch(() => {});
        }
    }, []);

    const inpaint = useCallback(async () => {
        throw new Error("Neural Magic Eraser is locked to prevent browser memory exhaustion. Cloud GPU integration coming soon.");
    }, []);

    return {
        status,
        isProcessing: false,
        isLoading: false,
        isLocked: true,
        progressMessage: 'Feature Locked',
        progressPercent: 0,
        deviceType: 'wasm' as const,
        inpaint
    };
}
