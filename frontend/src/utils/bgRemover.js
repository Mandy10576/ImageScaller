/**
 * AI Background Removal & Image Compositing Engine for ClearCut AI Studio
 * Supports Local In-Browser Neural AI + Official rembg.com / Remove.bg API
 */

import { removeBackground } from '@imgly/background-removal';

/**
 * Convert any File, Blob, or Image URL into a Base64 data string
 */

export async function imageToBase64(imageInput) {
  if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
    return imageInput.split(',')[1];
  }

  let blob;
  if (imageInput instanceof File || imageInput instanceof Blob) {
    blob = imageInput;
  } else if (typeof imageInput === 'string') {
    const res = await fetch(imageInput);
    blob = await res.blob();
  } else {
    throw new Error('Unsupported image format');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Remove background via official rembg.com / Remove.bg API
 */
export async function removeBackgroundViaRemoveBgAPI(imageInput, apiKey = '', onProgress = () => {}) {
  onProgress(15);

  const cleanKey = apiKey ? apiKey.trim() : '';
  const base64Data = await imageToBase64(imageInput);

  onProgress(40);

  // Try direct browser request first if client API key is entered in UI Settings
  if (cleanKey) {
    try {
      onProgress(50);
      const directFormData = new FormData();
      directFormData.append('image_file_b64', base64Data);
      directFormData.append('size', 'auto');

      const directRes = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': cleanKey,
        },
        body: directFormData,
      });

      if (!directRes.ok) {
        const errJson = await directRes.json().catch(() => ({}));
        const errMsg = errJson.errors ? errJson.errors.map((e) => e.title).join(', ') : directRes.statusText;
        throw new Error(`rembg.com API Error (${directRes.status}): ${errMsg}`);
      }

      onProgress(90);
      const blob = await directRes.blob();
      onProgress(100);
      return blob;
    } catch (directErr) {
      console.warn('Direct browser API call failed, trying server endpoint fallback...', directErr.message);
      if (!directErr.message.includes('Failed to fetch')) {
        throw directErr;
      }
    }
  }

  // Server endpoint proxy call (works via Vercel Serverless Function or Express server)
  onProgress(60);
  const endpoint = '/api/removebg';
  const headers = { 'Content-Type': 'application/json' };

  if (cleanKey) {
    headers['X-Api-Key'] = cleanKey;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      image_file_b64: base64Data,
      size: 'auto',
    }),
  });

  onProgress(85);

  const json = await response.json().catch(() => ({}));

  if (!response.ok || !json.success) {
    const errDetail = json.error || json.message || `Server API Error (${response.status})`;
    throw new Error(errDetail);
  }

  const blobResponse = await fetch(json.dataUrl);
  const blob = await blobResponse.blob();

  onProgress(100);
  return blob;
}

/**
 * Main function to remove background from an image source using Local AI or rembg.com API.
 */
export async function processBackgroundRemoval(imageInput, onProgress = () => {}, options = {}) {
  const { engine = 'local', apiKey = '' } = options;

  try {
    onProgress(10);
    let blob;

    if (engine === 'removebg') {
      try {
        blob = await removeBackgroundViaRemoveBgAPI(imageInput, apiKey, onProgress);
      } catch (removeBgError) {
        console.warn('rembg.com API failed, falling back to local browser AI:', removeBgError.message);
        onProgress(30);
        // Fallback to local neural model if remove.bg key is invalid or quota reached
        blob = await removeBackground(imageInput, {
          progress: (key, current, total) => {
            if (total > 0) onProgress(Math.min(95, Math.round(30 + (current / total) * 65)));
          },
          publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.4.5/dist/',
        });
      }
    } else {
      // Local In-Browser AI Engine
      const config = {
        progress: (key, current, total) => {
          if (total > 0) {
            const percent = Math.min(95, Math.round(15 + (current / total) * 75));
            onProgress(percent);
          }
        },
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.4.5/dist/',
      };

      try {
        blob = await removeBackground(imageInput, config);
      } catch (imglyErr) {
        console.warn('Local AI fallback triggered:', imglyErr);
        blob = await smartCanvasSegmentationFallback(imageInput, onProgress);
      }
    }

    onProgress(98);
    const cutOutUrl = URL.createObjectURL(blob);
    const img = await loadImage(cutOutUrl);
    const maskDataUrl = createMaskFromCutout(img);

    onProgress(100);
    return {
      cutOutBlob: blob,
      cutOutUrl,
      maskDataUrl,
      originalWidth: img.naturalWidth || img.width,
      originalHeight: img.naturalHeight || img.height,
    };
  } catch (error) {
    console.error('Error during background removal:', error);
    const fallbackBlob = await smartCanvasSegmentationFallback(imageInput, onProgress);
    const cutOutUrl = URL.createObjectURL(fallbackBlob);
    const img = await loadImage(cutOutUrl);
    return {
      cutOutBlob: fallbackBlob,
      cutOutUrl,
      maskDataUrl: createMaskFromCutout(img),
      originalWidth: img.naturalWidth || img.width,
      originalHeight: img.naturalHeight || img.height,
    };
  }
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
    img.src = src;
  });
}

async function smartCanvasSegmentationFallback(imageInput, onProgress) {
  let img;
  if (typeof imageInput === 'string') {
    img = await loadImage(imageInput);
  } else if (imageInput instanceof File || imageInput instanceof Blob) {
    const tempUrl = URL.createObjectURL(imageInput);
    img = await loadImage(tempUrl);
  } else {
    img = imageInput;
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const samplePoints = [
    { x: 5, y: 5 },
    { x: width - 5, y: 5 },
    { x: 5, y: height - 5 },
    { x: width - 5, y: height - 5 },
    { x: Math.floor(width / 2), y: 5 },
  ];

  const cornerColors = samplePoints.map((p) => {
    const idx = (Math.min(height - 1, Math.max(0, p.y)) * width + Math.min(width - 1, Math.max(0, p.x))) * 4;
    return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
  });

  onProgress(70);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let minDistance = 999;
    for (const bg of cornerColors) {
      const dist = Math.sqrt((r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2);
      if (dist < minDistance) minDistance = dist;
    }

    const thresholdNear = 35;
    const thresholdFar = 75;

    if (minDistance < thresholdNear) {
      data[i + 3] = 0;
    } else if (minDistance < thresholdFar) {
      const alpha = Math.floor(((minDistance - thresholdNear) / (thresholdFar - thresholdNear)) * 255);
      data[i + 3] = alpha;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function createMaskFromCutout(cutoutImg) {
  const width = cutoutImg.naturalWidth || cutoutImg.width;
  const height = cutoutImg.naturalHeight || cutoutImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(cutoutImg, 0, 0);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 20) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    } else {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function renderCompositeImage({
  originalImg,
  cutoutImg,
  backgroundConfig = { type: 'transparent' },
  fxConfig = {
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    strokeWidth: 0,
    strokeColor: '#FFFFFF',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotate: 0,
    flipH: false,
    flipV: false,
  },
  aspectRatio = 'original',
  outputWidth = null,
  outputHeight = null,
}) {
  const origW = cutoutImg.naturalWidth || cutoutImg.width;
  const origH = cutoutImg.naturalHeight || cutoutImg.height;

  let canvasW = outputWidth || origW;
  let canvasH = outputHeight || origH;

  if (aspectRatio === '1:1') {
    const side = Math.max(origW, origH);
    canvasW = side;
    canvasH = side;
  } else if (aspectRatio === '16:9') {
    canvasW = origW;
    canvasH = Math.round(origW * (9 / 16));
  } else if (aspectRatio === '9:16') {
    canvasH = origH;
    canvasW = Math.round(origH * (9 / 16));
  } else if (aspectRatio === '4:3') {
    canvasW = origW;
    canvasH = Math.round(origW * (3 / 4));
  } else if (aspectRatio === '4:5') {
    canvasW = origW;
    canvasH = Math.round(origW * (5 / 4));
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  if (backgroundConfig.type === 'color') {
    ctx.fillStyle = backgroundConfig.color || '#FFFFFF';
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (backgroundConfig.type === 'gradient') {
    const gradAngle = (backgroundConfig.angle || 135) * (Math.PI / 180);
    const x2 = canvasW * Math.cos(gradAngle);
    const y2 = canvasH * Math.sin(gradAngle);
    const gradient = ctx.createLinearGradient(0, 0, Math.abs(x2), Math.abs(y2));
    
    if (backgroundConfig.stops && backgroundConfig.stops.length >= 2) {
      gradient.addColorStop(0, backgroundConfig.stops[0]);
      gradient.addColorStop(1, backgroundConfig.stops[1]);
    } else {
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#ec4899');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (backgroundConfig.type === 'image' && backgroundConfig.imageUrl) {
    try {
      const bgImg = await loadImage(backgroundConfig.imageUrl);
      const bgAspect = bgImg.width / bgImg.height;
      const canvasAspect = canvasW / canvasH;
      let drawW, drawH, drawX, drawY;

      if (bgAspect > canvasAspect) {
        drawH = canvasH;
        drawW = canvasH * bgAspect;
        drawX = (canvasW - drawW) / 2;
        drawY = 0;
      } else {
        drawW = canvasW;
        drawH = canvasW / bgAspect;
        drawX = 0;
        drawY = (canvasH - drawH) / 2;
      }
      ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
    } catch (err) {
      console.warn('Could not load custom background image', err);
    }
  } else if (backgroundConfig.type === 'blur' && originalImg) {
    ctx.save();
    const blurPx = backgroundConfig.blurAmount || 15;
    ctx.filter = `blur(${blurPx}px) brightness(0.9)`;
    ctx.drawImage(originalImg, 0, 0, canvasW, canvasH);
    ctx.restore();
  }

  ctx.save();

  const centerX = canvasW / 2 + (fxConfig.offsetX || 0);
  const centerY = canvasH / 2 + (fxConfig.offsetY || 0);

  ctx.translate(centerX, centerY);

  if (fxConfig.rotate) {
    ctx.rotate((fxConfig.rotate * Math.PI) / 180);
  }

  const scaleX = (fxConfig.scale || 1) * (fxConfig.flipH ? -1 : 1);
  const scaleY = (fxConfig.scale || 1) * (fxConfig.flipV ? -1 : 1);
  ctx.scale(scaleX, scaleY);

  const drawX = -origW / 2;
  const drawY = -origH / 2;

  const b = fxConfig.brightness ?? 100;
  const c = fxConfig.contrast ?? 100;
  const s = fxConfig.saturation ?? 100;
  ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;

  if (fxConfig.shadowBlur > 0 || fxConfig.shadowOffsetY !== 0 || fxConfig.shadowOffsetX !== 0) {
    ctx.save();
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = origW;
    shadowCanvas.height = origH;
    const shadowCtx = shadowCanvas.getContext('2d');

    shadowCtx.shadowColor = fxConfig.shadowColor || 'rgba(0,0,0,0.5)';
    shadowCtx.shadowBlur = fxConfig.shadowBlur || 15;
    shadowCtx.shadowOffsetX = fxConfig.shadowOffsetX || 0;
    shadowCtx.shadowOffsetY = fxConfig.shadowOffsetY || 10;
    shadowCtx.globalAlpha = fxConfig.shadowOpacity ?? 0.5;

    shadowCtx.drawImage(cutoutImg, 0, 0);

    ctx.drawImage(shadowCanvas, drawX, drawY);
    ctx.restore();
  }

  if (fxConfig.strokeWidth > 0) {
    ctx.save();
    const strokeCanvas = document.createElement('canvas');
    strokeCanvas.width = origW + fxConfig.strokeWidth * 4;
    strokeCanvas.height = origH + fxConfig.strokeWidth * 4;
    const sCtx = strokeCanvas.getContext('2d');

    const sOffset = fxConfig.strokeWidth * 2;
    
    const radius = fxConfig.strokeWidth;
    for (let angle = 0; angle < 360; angle += 20) {
      const rad = (angle * Math.PI) / 180;
      const dx = Math.cos(rad) * radius;
      const dy = Math.sin(rad) * radius;
      sCtx.drawImage(cutoutImg, sOffset + dx, sOffset + dy);
    }

    sCtx.globalCompositeOperation = 'source-in';
    sCtx.fillStyle = fxConfig.strokeColor || '#FFFFFF';
    sCtx.fillRect(0, 0, strokeCanvas.width, strokeCanvas.height);

    ctx.drawImage(strokeCanvas, drawX - sOffset, drawY - sOffset);
    ctx.restore();
  }

  ctx.drawImage(cutoutImg, drawX, drawY, origW, origH);
  ctx.restore();

  return canvas;
}
