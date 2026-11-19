// Focus-point estimation on a 64px thumbnail: skin-tone pixels and busy
// (high edge-energy) pixels vote for where the subject sits, so an automatic
// crop keeps faces instead of cutting them off.

function isSkinTone(r, g, b) {
  return r > 90 && g > 40 && b > 20 && r > g && g > b && r - b > 25 && Math.abs(r - g) < 90;
}

export function findFocusPoint(source) {
  const S = 64;
  const thumb = document.createElement("canvas");
  thumb.width = S; thumb.height = S;
  const ctx = thumb.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, S, S);
  let data;
  try {
    data = ctx.getImageData(0, 0, S, S).data;
  } catch {
    return { x: 0.5, y: 0.38 };
  }
  let sumX = 0, sumY = 0, sumW = 0;
  let skinX = 0, skinY = 0, skinW = 0;
  const lum = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    lum[i] = (data[i * 4] * 299 + data[i * 4 + 1] * 587 + data[i * 4 + 2] * 114) / 1000;
  }
  for (let y = 1; y < S - 1; y++) {
    for (let x = 1; x < S - 1; x++) {
      const i = y * S + x;
      const edge = Math.abs(lum[i] - lum[i - 1]) + Math.abs(lum[i] - lum[i + 1])
        + Math.abs(lum[i] - lum[i - S]) + Math.abs(lum[i] - lum[i + S]);
      let weight = Math.min(edge / 160, 1) * 0.6;
      const skin = isSkinTone(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
      if (skin) {
        weight += 1.6;
        const skinWeight = 1.35 - y / S; // upper skin is likelier a face than a forearm
        skinX += x * skinWeight; skinY += y * skinWeight; skinW += skinWeight;
      }
      weight *= 1 - Math.abs(y / S - 0.38) * 0.55; // faces live in the upper half
      if (weight > 0.02) { sumX += x * weight; sumY += y * weight; sumW += weight; }
    }
  }
  if (sumW <= 0) return { x: 0.5, y: 0.38 };
  let fx = sumX / sumW / S, fy = sumY / sumW / S;
  // When the thumbnail clearly holds skin, trust it: faces are the subject,
  // however busy the scenery around them is.
  if (skinW > 24) {
    fx = fx * 0.3 + (skinX / skinW / S) * 0.7;
    fy = fy * 0.3 + (skinY / skinW / S) * 0.7;
  }
  return {
    x: Math.min(0.85, Math.max(0.15, fx)),
    y: Math.min(0.8, Math.max(0.12, fy)),
  };
}

// Three crops of one photo for the one-photo poster: the whole scene, a mid
// crop on the focus point, and a close-up on it. Returns panel transform
// settings (pan offsets are fractions of the spare room, zoom a multiplier).
export function autoCropVariants(photo) {
  const fx = photo.focus.x - 0.5;
  const fy = photo.focus.y - 0.5;
  return [
    { panX: 0, panY: 0, zoom: 1, rot: 0 },                       // wide: everything
    { panX: fx * 1.2, panY: fy * 1.2, zoom: 1.45, rot: 0 },     // mid: lean to the subject
    { panX: fx * 1.7, panY: fy * 1.7 - 0.14, zoom: 1.9, rot: 0 }, // close-up, biased up to the face
  ];
}
