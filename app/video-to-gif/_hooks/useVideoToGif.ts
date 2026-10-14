"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface CaptionConfig {
  topText: string;
  bottomText: string;
  fontFamily: string;
  textColor: string;
  strokeColor: string;
  fontSize: number;
}

export interface VideoMetadata {
  name: string;
  size: number;
  width: number;
  height: number;
  duration: number;
  aspectRatio: number;
}

export type ConversionStage = 'idle' | 'extracting' | 'encoding' | 'done' | 'error';

export function useVideoToGif() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);

  // Playback & Trimming State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(5);

  // Conversion Settings
  const [fps, setFps] = useState<number>(10); // 5, 10, 15, 20, 24
  const [targetWidth, setTargetWidth] = useState<number>(480);
  const [speed, setSpeed] = useState<number>(1.0); // 0.5, 0.75, 1.0, 1.5, 2.0
  const [quality, setQuality] = useState<number>(10); // NeuQuant sample (1=best, 10=balanced, 20=fast)
  const [loopCount, setLoopCount] = useState<number>(0); // 0 = infinite

  // Captions (Meme / Banner hooks)
  const [captions, setCaptions] = useState<CaptionConfig>({
    topText: '',
    bottomText: '',
    fontFamily: 'Anton',
    textColor: '#ffffff',
    strokeColor: '#000000',
    fontSize: 32,
  });

  // Conversion Execution & Status
  const [conversionStage, setConversionStage] = useState<ConversionStage>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);

  // Result Output
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifSize, setGifSize] = useState<number>(0);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const isAbortedRef = useRef<boolean>(false);

  // Load Video File
  const loadVideoFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (MP4, WebM, MOV)');
      return;
    }

    // Reset previous outputs
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    if (gifUrl) {
      URL.revokeObjectURL(gifUrl);
    }

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setGifBlob(null);
    setGifUrl(null);
    setGifSize(0);
    setConversionStage('idle');
    setProgress(0);
    setExtractedFrames([]);

    // Probe video metadata using temporary element
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const dur = tempVideo.duration || 5;
      const w = tempVideo.videoWidth || 640;
      const h = tempVideo.videoHeight || 360;
      const aspect = w / h;

      setVideoMeta({
        name: file.name,
        size: file.size,
        width: w,
        height: h,
        duration: dur,
        aspectRatio: aspect,
      });

      // Default trim: first 4 seconds or full duration if shorter
      setStartTime(0);
      setEndTime(Math.min(dur, 4));
      setCurrentTime(0);

      // Choose an appropriate initial target width
      if (w >= 640) setTargetWidth(480);
      else setTargetWidth(w);
    };

    tempVideo.onerror = () => {
      toast.error('Failed to load video. Codec might not be supported natively.');
    };
  }, [videoUrl, gifUrl]);

  // Clean up Object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (gifUrl) URL.revokeObjectURL(gifUrl);
    };
  }, [videoUrl, gifUrl]);

  // Seek video to specific timestamp
  const seekTo = (video: HTMLVideoElement, time: number): Promise<void> => {
    return new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = Math.min(video.duration || time, Math.max(0, time));
    });
  };

  // Overlay meme captions or text onto extracted video canvas frame
  const drawCaptionsOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number, cfg: CaptionConfig) => {
    if (!cfg.topText && !cfg.bottomText) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${cfg.fontSize}px ${cfg.fontFamily}, sans-serif`;
    ctx.fillStyle = cfg.textColor;
    ctx.strokeStyle = cfg.strokeColor;
    ctx.lineWidth = Math.max(3, Math.round(cfg.fontSize * 0.15));
    ctx.lineJoin = 'round';

    const padding = 20;

    if (cfg.topText.trim()) {
      const topY = padding + cfg.fontSize / 2;
      ctx.strokeText(cfg.topText.toUpperCase(), width / 2, topY, width - padding * 2);
      ctx.fillText(cfg.topText.toUpperCase(), width / 2, topY, width - padding * 2);
    }

    if (cfg.bottomText.trim()) {
      const bottomY = height - padding - cfg.fontSize / 2;
      ctx.strokeText(cfg.bottomText.toUpperCase(), width / 2, bottomY, width - padding * 2);
      ctx.fillText(cfg.bottomText.toUpperCase(), width / 2, bottomY, width - padding * 2);
    }

    ctx.restore();
  };

  // Cancel conversion
  const cancelConversion = () => {
    isAbortedRef.current = true;
    setConversionStage('idle');
    setProgress(0);
    setStatusMessage('Conversion cancelled.');
    toast.info('Conversion was cancelled.');
  };

  // Convert Video to Animated GIF
  const convertToGif = async () => {
    if (!videoUrl || !videoMeta) {
      toast.error('Please upload a video first.');
      return;
    }

    const trimmedDuration = endTime - startTime;
    if (trimmedDuration <= 0) {
      toast.error('Invalid trim range. End time must be greater than start time.');
      return;
    }

    isAbortedRef.current = false;
    setConversionStage('extracting');
    setProgress(0);
    setStatusMessage('Extracting video frames...');

    try {
      // Calculate scaled output dimensions based on targetWidth
      const aspect = videoMeta.aspectRatio || 16 / 9;
      const outWidth = targetWidth;
      const outHeight = Math.round(targetWidth / aspect);

      // Create extraction canvas
      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not create 2D canvas context');

      // Create dedicated video element for seeking & extraction
      const workerVideo = document.createElement('video');
      workerVideo.src = videoUrl;
      workerVideo.muted = true;
      workerVideo.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        workerVideo.onloadedmetadata = () => resolve();
        workerVideo.onerror = () => reject(new Error('Failed to load video stream for extraction'));
      });

      // Import gif.js dynamically
      // @ts-ignore
      const GIF = (await import('gif.js')).default;
      const gif = new GIF({
        workers: 2,
        quality: quality,
        workerScript: '/gif.worker.js',
        width: outWidth,
        height: outHeight,
        repeat: loopCount,
        background: '#ffffff',
      });

      // Calculate time step per frame taking speed into account
      const timeStep = (1 / fps) * speed;
      const totalFrames = Math.max(1, Math.floor(trimmedDuration / timeStep));
      const frameDelayMs = Math.round(1000 / fps);

      let frameCount = 0;
      const capturedPreviewFrames: string[] = [];

      for (let t = startTime; t <= endTime; t += timeStep) {
        if (isAbortedRef.current) {
          return;
        }

        await seekTo(workerVideo, t);

        // Render current video frame to canvas
        ctx.clearRect(0, 0, outWidth, outHeight);
        ctx.drawImage(workerVideo, 0, 0, outWidth, outHeight);

        // Apply any meme text overlay
        if (captions.topText || captions.bottomText) {
          drawCaptionsOnCanvas(ctx, outWidth, outHeight, captions);
        }

        // Add frame to gif encoder
        gif.addFrame(ctx, { delay: frameDelayMs, copy: true });

        // Save a few frames for visual preview / Studio handoff
        if (frameCount < 12 || frameCount % 2 === 0) {
          try {
            capturedPreviewFrames.push(canvas.toDataURL('image/jpeg', 0.85));
          } catch {}
        }

        frameCount++;
        const extractPercent = Math.min(50, Math.round((frameCount / totalFrames) * 50));
        setProgress(extractPercent);
        setStatusMessage(`Extracting frame ${frameCount} of ${totalFrames}...`);
      }

      setExtractedFrames(capturedPreviewFrames);

      if (isAbortedRef.current) return;

      // Start GIF Encoding phase
      setConversionStage('encoding');
      setStatusMessage('Encoding animated GIF with high quality...');

      gif.on('progress', (p: number) => {
        if (isAbortedRef.current) return;
        const encodePercent = 50 + Math.round(p * 50);
        setProgress(Math.min(99, encodePercent));
        setStatusMessage(`Encoding GIF: ${Math.round(p * 100)}%`);
      });

      gif.on('finished', (blob: Blob) => {
        if (isAbortedRef.current) return;
        const resultUrl = URL.createObjectURL(blob);
        setGifBlob(blob);
        setGifUrl(resultUrl);
        setGifSize(blob.size);
        setConversionStage('done');
        setProgress(100);
        setStatusMessage('GIF ready!');
        toast.success(`GIF converted successfully! (${(blob.size / (1024 * 1024)).toFixed(2)} MB)`);
      });

      gif.render();
    } catch (err: any) {
      console.error('Video to GIF Conversion Error:', err);
      setConversionStage('error');
      setStatusMessage(err.message || 'Error occurred during conversion');
      toast.error('Conversion failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Download converted GIF
  const downloadGif = (customName?: string) => {
    if (!gifUrl || !gifBlob) return;
    const baseName = videoMeta?.name ? videoMeta.name.replace(/\.[^/.]+$/, '') : 'animation';
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = customName || `${baseName}_converted.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Downloaded GIF successfully!');
  };

  // Seamless Handoff to /gif-maker Studio
  const openInGifStudio = async () => {
    if (extractedFrames.length === 0) {
      toast.error('No extracted frames available to edit.');
      return;
    }

    try {
      // Store preview frames in sessionStorage for GIF Studio to load
      sessionStorage.setItem('polish_ai_imported_video_frames', JSON.stringify({
        frames: extractedFrames,
        frameDelay: Math.round(1000 / fps),
        width: targetWidth,
        height: Math.round(targetWidth / (videoMeta?.aspectRatio || 16 / 9)),
      }));

      toast.success('Transferring frames to GIF Studio...');
      window.location.href = '/gif-maker';
    } catch (e) {
      console.error('Failed to hand off frames to GIF Studio:', e);
      toast.error('Failed to transfer frames. Try downloading the GIF directly.');
    }
  };

  return {
    videoFile,
    videoUrl,
    videoMeta,
    loadVideoFile,

    // Trimming & Playback
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    selectedDuration: Math.max(0, endTime - startTime),

    // Conversion Settings
    fps,
    setFps,
    targetWidth,
    setTargetWidth,
    speed,
    setSpeed,
    quality,
    setQuality,
    loopCount,
    setLoopCount,

    // Captions
    captions,
    setCaptions,

    // Execution & Progress
    conversionStage,
    progress,
    statusMessage,
    convertToGif,
    cancelConversion,
    extractedFrames,

    // Output Result
    gifBlob,
    gifUrl,
    gifSize,
    downloadGif,
    openInGifStudio,
    videoElementRef,
  };
}
