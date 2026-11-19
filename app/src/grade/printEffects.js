// Print and lens effects, all drawn on the finished cover canvas so they sit
// over panels and lettering alike, the way ink and light sit on a poster.

import { seededRandom } from "../state/editorState.js";

// Halftone dots: sample the cover on a coarse grid and stamp a dot whose
// radius follows the darkness there, in multiply blend so it reads as ink.
export function applyHalftone(ctx, width, height, cell = 9) {
  const sample = document.createElement("canvas");
  const sw = Math.max(2, Math.round(width / cell));
  const sh = Math.max(2, Math.round(height / cell));
  sample.width = sw; sample.height = sh;
  const sctx = sample.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(ctx.canvas, 0, 0, sw, sh);
  let data;
  try { data = sctx.getImageData(0, 0, sw, sh).data; } catch { return; }
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(24,8,32,0.5)";
  for (let gy = 0; gy < sh; gy++) {
    for (let gx = 0; gx < sw; gx++) {
      const i = (gy * sw + gx) * 4;
      const lum = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) / 65280; // 0..1
      const r = (1 - lum) * cell * 0.45;
      if (r < 0.4) continue;
      ctx.beginPath();
      ctx.arc(gx * cell + cell / 2, gy * cell + cell / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Seeded film grain: the same seed every time, so two renders of one cover
// are byte-identical. Noise is generated once per size and tiled.
export function addFilmGrain(ctx, width, height, seed = 20261119, alpha = 0.07) {
  const tile = 256;
  const noise = document.createElement("canvas");
  noise.width = tile; noise.height = tile;
  const nctx = noise.getContext("2d");
  const img = nctx.createImageData(tile, tile);
  const rand = seededRandom(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand() * 256);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = alpha;
  const pattern = ctx.createPattern(noise, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Bloom: a blurred, brightened copy of the cover laid over itself in screen
// blend, so neon and highlights glow instead of just being bright.
export function addBloomGlow(ctx, width, height) {
  const small = document.createElement("canvas");
  small.width = Math.max(2, Math.round(width / 6));
  small.height = Math.max(2, Math.round(height / 6));
  const sctx = small.getContext("2d");
  sctx.filter = "brightness(1.25) saturate(1.3)";
  sctx.drawImage(ctx.canvas, 0, 0, small.width, small.height);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.38;
  ctx.filter = "blur(6px)";
  ctx.drawImage(small, 0, 0, width, height);
  ctx.restore();
}

export function applyVignette(ctx, width, height) {
  const grad = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.78,
  );
  grad.addColorStop(0, "rgba(10,2,20,0)");
  grad.addColorStop(1, "rgba(10,2,20,0.42)");
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// A warm leak of light from the top-left corner, like sun through a lens.
export function applyLightLeak(ctx, width, height) {
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.75);
  grad.addColorStop(0, "rgba(255,138,60,0.34)");
  grad.addColorStop(0.5, "rgba(255,46,136,0.12)");
  grad.addColorStop(1, "rgba(255,46,136,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
