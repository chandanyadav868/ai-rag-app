/**
 * Image Effects Utility for YouTube Creator Thumbnails
 * Generates Subject Sticker Outlines, Neon Rim Lighting, and Color Grading
 */

export interface StickerOutlineOptions {
  strokeWidth: number; // 0 to 30px
  strokeColor: string; // e.g. '#ffffff'
  glowBlur?: number;   // 0 to 50px
  glowColor?: string;  // e.g. '#00f0ff'
}

/**
 * Generates a crisp outer sticker contour outline and/or neon rim glow around any subject cutout.
 */
export async function generateStickerCutout(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  options: StickerOutlineOptions
): Promise<string> {
  const { strokeWidth, strokeColor, glowBlur = 0, glowColor = strokeColor } = options;
  const naturalWidth = (imageElement as HTMLImageElement).naturalWidth || imageElement.width;
  const naturalHeight = (imageElement as HTMLImageElement).naturalHeight || imageElement.height;

  if (naturalWidth <= 0 || naturalHeight <= 0) return '';

  if (strokeWidth <= 0 && glowBlur <= 0) {
    if ((imageElement as HTMLImageElement).src) {
      return (imageElement as HTMLImageElement).src;
    }
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = naturalWidth;
    rawCanvas.height = naturalHeight;
    const rawCtx = rawCanvas.getContext('2d');
    if (rawCtx) rawCtx.drawImage(imageElement, 0, 0);
    return rawCanvas.toDataURL('image/png');
  }

  const padding = Math.ceil(Math.max(strokeWidth, 0) + Math.max(glowBlur, 0)) + 6;
  const w = naturalWidth + padding * 2;
  const h = naturalHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const offsetX = padding;
  const offsetY = padding;

  // 1. Neon Glow Halo (Multi-pass for dense, vivid bloom)
  if (glowBlur > 0) {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    for (let i = 0; i < 3; i++) {
      ctx.drawImage(imageElement, offsetX, offsetY, naturalWidth, naturalHeight);
    }
    ctx.restore();
  }

  // 2. Crisp Solid Sticker Outline (Multi-Directional Alpha Dilation with concentric rings)
  if (strokeWidth > 0) {
    const silCanvas = document.createElement('canvas');
    silCanvas.width = naturalWidth;
    silCanvas.height = naturalHeight;
    const silCtx = silCanvas.getContext('2d');
    if (silCtx) {
      silCtx.imageSmoothingEnabled = true;
      silCtx.drawImage(imageElement, 0, 0, naturalWidth, naturalHeight);
      silCtx.globalCompositeOperation = 'source-in';
      silCtx.fillStyle = strokeColor;
      silCtx.fillRect(0, 0, silCanvas.width, silCanvas.height);

      // Concentric circles from 1 to strokeWidth so thick outlines are 100% solid with no hollow gaps
      const rStep = Math.max(1, Math.min(2, Math.floor(strokeWidth / 6)));
      for (let r = rStep; r <= strokeWidth; r += rStep) {
        const stepCount = Math.min(64, Math.max(16, Math.round(r * 2.5)));
        for (let i = 0; i < stepCount; i++) {
          const angle = (i * 2 * Math.PI) / stepCount;
          const x = offsetX + Math.cos(angle) * r;
          const y = offsetY + Math.sin(angle) * r;
          ctx.drawImage(silCanvas, x, y);
        }
      }

      // Outer rim stamp at exact strokeWidth
      const outerSteps = Math.min(64, Math.max(24, Math.round(strokeWidth * 2.5)));
      for (let i = 0; i < outerSteps; i++) {
        const angle = (i * 2 * Math.PI) / outerSteps;
        const x = offsetX + Math.cos(angle) * strokeWidth;
        const y = offsetY + Math.sin(angle) * strokeWidth;
        ctx.drawImage(silCanvas, x, y);
      }
    }
  }

  // 3. Draw Pristine Subject Cutout cleanly on top
  ctx.drawImage(imageElement, offsetX, offsetY, naturalWidth, naturalHeight);

  return canvas.toDataURL('image/png');
}

/**
 * 1-Click Viral Thumbnail Color Presets
 */
export const THUMBNAIL_COLOR_PRESETS = [
  {
    name: 'YouTube Pop',
    description: 'Boosted saturation & contrast for high CTR',
    contrast: 0.25,
    saturation: 0.35,
    brightness: 0.05,
    color: '#f59e0b'
  },
  {
    name: 'Tech Clean',
    description: 'Crisp studio lighting with punchy clarity',
    contrast: 0.15,
    saturation: 0.15,
    brightness: 0.02,
    color: '#06b6d4'
  },
  {
    name: 'Crime / Drama',
    description: 'High contrast dark moody atmosphere',
    contrast: 0.45,
    saturation: -0.10,
    brightness: -0.05,
    color: '#ef4444'
  },
  {
    name: 'Warm Cinematic',
    description: 'Rich warm tones and deep shadows',
    contrast: 0.20,
    saturation: 0.25,
    brightness: 0.0,
    color: '#ea580c'
  },
];

export interface TrimResult {
  trimmedSrc: string;
  trimmedElement: HTMLImageElement;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

/**
 * Scans an image/cutout for non-transparent pixels (alpha > threshold),
 * crops away empty transparent margins, and returns the trimmed image with its local offset.
 */
export async function trimTransparentBorders(
  imageSource: string | HTMLImageElement | HTMLCanvasElement,
  alphaThreshold = 8,
  padding = 4
): Promise<TrimResult | null> {
  return new Promise((resolve) => {
    const processCanvas = (canvas: HTMLCanvasElement, origW: number, origH: number) => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || origW <= 0 || origH <= 0) {
        resolve(null);
        return;
      }

      const imgData = ctx.getImageData(0, 0, origW, origH);
      const data = imgData.data;

      let minX = origW;
      let minY = origH;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < origH; y++) {
        const row = y * origW * 4;
        for (let x = 0; x < origW; x++) {
          if (data[row + x * 4 + 3] > alphaThreshold) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // If empty transparent image
      if (maxX < minX || maxY < minY) {
        resolve(null);
        return;
      }

      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropMaxX = Math.min(origW - 1, maxX + padding);
      const cropMaxY = Math.min(origH - 1, maxY + padding);
      const cropWidth = cropMaxX - cropX + 1;
      const cropHeight = cropMaxY - cropY + 1;

      // If content already spans essentially the entire image, no trimming is necessary
      if (cropWidth >= origW - 4 && cropHeight >= origH - 4 && cropX <= 2 && cropY <= 2) {
        resolve(null);
        return;
      }

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) {
        resolve(null);
        return;
      }

      cropCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      const trimmedSrc = cropCanvas.toDataURL('image/png');

      const trimmedElement = new Image();
      trimmedElement.crossOrigin = 'anonymous';
      trimmedElement.onload = () => {
        resolve({
          trimmedSrc,
          trimmedElement,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
        });
      };
      trimmedElement.onerror = () => resolve(null);
      trimmedElement.src = trimmedSrc;
    };

    if (imageSource instanceof HTMLCanvasElement) {
      processCanvas(imageSource, imageSource.width, imageSource.height);
    } else if (imageSource instanceof HTMLImageElement) {
      const c = document.createElement('canvas');
      const w = imageSource.naturalWidth || imageSource.width;
      const h = imageSource.naturalHeight || imageSource.height;
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (ctx) ctx.drawImage(imageSource, 0, 0);
      processCanvas(c, w, h);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        processCanvas(c, w, h);
      };
      img.onerror = () => resolve(null);
      img.src = imageSource;
    }
  });
}

/**
 * Fits a FabricImage object's bounding box tightly to its non-transparent content
 * while guaranteeing that the visible pixels stay in the exact same position on canvas.
 */
export async function fitFabricImageToContent(
  fabricImg: any,
  fabricCanvas: any,
  overrideSrc?: string
): Promise<boolean> {
  const src = overrideSrc || fabricImg._cleanCutoutSrc || fabricImg.getSrc?.();
  if (!src) return false;

  const trimmed = await trimTransparentBorders(src);
  if (!trimmed) return false;

  const { cropX, cropY, cropWidth, cropHeight, trimmedElement, trimmedSrc } = trimmed;

  const scaleX = fabricImg.scaleX || 1;
  const scaleY = fabricImg.scaleY || 1;
  const angle = fabricImg.angle || 0;
  const rad = (angle * Math.PI) / 180;

  // Compute the rotated offset of the cropped region inside canvas space
  const vx = cropX * scaleX;
  const vy = cropY * scaleY;
  const deltaX = vx * Math.cos(rad) - vy * Math.sin(rad);
  const deltaY = vx * Math.sin(rad) + vy * Math.cos(rad);

  const origTopLeft = fabricImg.getPointByOrigin('left', 'top');
  const newTopLeft = {
    x: origTopLeft.x + deltaX,
    y: origTopLeft.y + deltaY,
  };

  fabricImg.setElement(trimmedElement);
  fabricImg.set({
    width: cropWidth,
    height: cropHeight,
  });
  fabricImg.setPositionByOrigin(newTopLeft, 'left', 'top');
  fabricImg.setCoords();

  fabricImg._cleanCutoutElement = trimmedElement;
  fabricImg._cleanCutoutSrc = trimmedSrc;

  fabricCanvas?.requestRenderAll();
  return true;
}

