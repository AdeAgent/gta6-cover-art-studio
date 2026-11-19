// PNG export: render the cover offscreen at full export size and download
// it. Exporting all sizes packs the six PNGs into one stored zip.

import { renderCoverToCanvas } from "../render/coverRenderer.js";
import { EXPORT_SIZES, sizeById, fileSlug } from "./exportPresets.js";
import { zipStore, downloadBlob } from "./zipStore.js";

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// Renders at the state's current size; resolves in well under a second for
// the sizes this studio offers.
export async function exportCoverPng(state) {
  const size = sizeById(state.sizeId);
  const canvas = renderCoverToCanvas(state, size.w, size.h);
  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, `${fileSlug(state.texts.title)}-${size.w}x${size.h}.png`);
  return { w: size.w, h: size.h };
}

export async function exportAllSizes(state) {
  const files = [];
  for (const size of EXPORT_SIZES) {
    const canvas = renderCoverToCanvas(state, size.w, size.h);
    const blob = await canvasToBlob(canvas);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    files.push({ name: `${fileSlug(state.texts.title)}-${size.w}x${size.h}.png`, data: bytes });
  }
  downloadBlob(zipStore(files), `${fileSlug(state.texts.title)}-all-sizes.zip`);
  return files.map((f) => f.name);
}
