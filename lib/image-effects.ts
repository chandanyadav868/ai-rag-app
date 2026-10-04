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

  const padding = Math.ceil(Math.max(strokeWidth, 0) + Math.max(glowBlur, 0)) + 4;
  const w = naturalWidth + padding * 2;
  const h = naturalHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const offsetX = padding;
  const offsetY = padding;

  // 1. Neon Glow Halo
  if (glowBlur > 0) {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    // Multi-draw for dense glow intensity
    for (let i = 0; i < 2; i++) {
      ctx.drawImage(imageElement, offsetX, offsetY, naturalWidth, naturalHeight);
    }
    ctx.restore();
  }

  // 2. Crisp Solid Sticker Outline (Multi-Directional Alpha Dilation)
  if (strokeWidth > 0) {
    const silCanvas = document.createElement('canvas');
    silCanvas.width = naturalWidth;
    silCanvas.height = naturalHeight;
    const silCtx = silCanvas.getContext('2d');
    if (silCtx) {
      silCtx.drawImage(imageElement, 0, 0, naturalWidth, naturalHeight);
      silCtx.globalCompositeOperation = 'source-in';
      silCtx.fillStyle = strokeColor;
      silCtx.fillRect(0, 0, silCanvas.width, silCanvas.height);

      const steps = Math.min(36, Math.max(16, strokeWidth * 2));
      for (let i = 0; i < steps; i++) {
        const angle = (i * 2 * Math.PI) / steps;
        const x = offsetX + Math.cos(angle) * strokeWidth;
        const y = offsetY + Math.sin(angle) * strokeWidth;
        ctx.drawImage(silCanvas, x, y);
      }
    }
  }

  // 3. Draw Original Cutout on top
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
