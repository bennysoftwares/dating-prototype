/**
 * Read an image file, downscale it and re-encode as JPEG so it fits comfortably
 * in prototype storage. Returns a data URL. A real backend would upload the
 * original to object storage instead.
 */
export async function resizeImageFile(file: File, maxEdge = 1080, quality = 0.8): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file isn’t an image.');
  const src = URL.createObjectURL(file);
  try {
    const img = await loadImage(src);
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process that image.');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(src);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image. Try a JPEG or PNG.'));
    img.src = src;
  });
}
