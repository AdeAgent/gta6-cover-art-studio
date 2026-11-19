// Photo loading. Everything is decoded on this machine and held as an
// offscreen canvas: the studio never uploads a photo anywhere.

import { findFocusPoint } from "./focusPoint.js";

const MAX_EDGE = 2400;
let photoSeq = 0;

// Decode a File with its EXIF orientation applied, downscaled so its long
// edge is at most 2400px, and return the studio's photo record.
export async function loadPhotoFile(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    bitmap = await createImageBitmap(file); // older engines ignore the option
  }
  return bitmapToPhoto(bitmap, file.name || "photo");
}

export async function loadPhotoUrl(url, name) {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  return bitmapToPhoto(bitmap, name);
}

export function bitmapToPhoto(bitmap, name) {
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  if (bitmap.close) bitmap.close();
  const thumb = document.createElement("canvas");
  const tScale = 96 / Math.max(w, h);
  thumb.width = Math.max(1, Math.round(w * tScale));
  thumb.height = Math.max(1, Math.round(h * tScale));
  thumb.getContext("2d").drawImage(canvas, 0, 0, thumb.width, thumb.height);
  return {
    id: `photo-${++photoSeq}`,
    name,
    source: canvas,
    w, h,
    focus: findFocusPoint(canvas),
    thumbUrl: thumb.toDataURL("image/jpeg", 0.72),
  };
}

export async function loadPhotoFiles(files, onEach) {
  const loaded = [];
  for (const file of files) {
    if (!file.type || !file.type.startsWith("image/")) continue;
    try {
      const photo = await loadPhotoFile(file);
      loaded.push(photo);
      if (onEach) onEach(photo);
    } catch { /* one unreadable file must not sink the whole drop */ }
  }
  return loaded;
}

// The bundled samples: two from the kit, four made for this studio with an
// image model. All are free to use and none shows a real person.
export const SAMPLE_PHOTOS = [
  { url: "samples/boulevard.jpg", name: "Boulevard" },
  { url: "samples/pier.jpg", name: "Pier" },
  { url: "samples/speedboat.jpg", name: "Speedboat" },
  { url: "samples/motel.jpg", name: "Neon Motel" },
  { url: "samples/rooftop.jpg", name: "Rooftop" },
  { url: "samples/lowrider.jpg", name: "Lowrider" },
];

export async function loadSamplePhotos() {
  const out = [];
  for (const sample of SAMPLE_PHOTOS) {
    try { out.push(await loadPhotoUrl(sample.url, sample.name)); } catch { /* keep the rest */ }
  }
  return out;
}
