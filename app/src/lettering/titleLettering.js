// Cover lettering: the chunky extruded title, the neon script that overlaps
// it, and the letter-spaced tagline. All drawn on canvas with the bundled
// OFL fonts — no image files, no borrowed wordmarks.

export const LETTERING_PRESETS = [
  { id: "chrome-sunset", name: "Chrome Sunset",
    fill: ["#fff6d8", "#ffd23c", "#ff8a3c", "#ff2e88"], face: "#fff7e0", outer: "#160a24", inner: "#ffffff", depth: 0.16, script: "#3ffbe8" },
  { id: "neon-tube", name: "Neon Tube",
    fill: ["#eafffb", "#7df9ea", "#19d3c5", "#0e7f9e"], face: "#eafffb", outer: "#08131f", inner: "#bafff4", depth: 0.1, script: "#ff5ea8" },
  { id: "sticker-pop", name: "Sticker Pop",
    fill: ["#ffffff", "#ffffff", "#ffe9f4", "#ffd6e8"], face: "#ffffff", outer: "#20102e", inner: "#ff2e88", depth: 0.07, script: "#ffd23c" },
  { id: "poster-ink", name: "Poster Ink",
    fill: ["#f7ead1", "#e8cf9e", "#c8a35e", "#9a7a38"], face: "#f7ead1", outer: "#0c0906", inner: "#f7ead1", depth: 0.2, script: "#ff8a3c" },
];

export function presetById(id) {
  return LETTERING_PRESETS.find((p) => p.id === id) ?? LETTERING_PRESETS[0];
}

// Shrink the font until the text fits maxWidth; returns the size used.
export function fitTextToWidth(ctx, text, fontFamily, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px ${fontFamily}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size *= 0.94;
    ctx.font = `${size}px ${fontFamily}`;
  }
  return size;
}

function spacedWidth(ctx, text, spacing) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + spacing;
  return w - spacing;
}

export function drawSpacedText(ctx, text, cx, y, spacing) {
  const total = spacedWidth(ctx, text, spacing);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  for (const ch of text) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
  ctx.textAlign = prevAlign;
}

// The title: long shadow, a stack of extrusion steps walking down-right, then
// the face — double stroke (dark outer, light inner) under a vertical sunset
// gradient fill. Slight skew for the poster lean.
export function drawExtrudedTitle(ctx, text, cx, cy, maxWidth, preset, baseSize) {
  const label = String(text || "").toUpperCase();
  if (!label) return 0;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const size = fitTextToWidth(ctx, label, "Anton, sans-serif", maxWidth, baseSize);
  ctx.font = `${size}px Anton, sans-serif`;
  const depth = Math.max(4, Math.round(size * preset.depth));
  ctx.transform(1, 0, -0.06, 1, 0, 0); // the lean
  // long shadow
  ctx.fillStyle = "rgba(10,2,18,0.3)";
  ctx.fillText(label, cx + depth * 1.35, cy + depth * 1.6);
  // extrusion steps, deepest first
  for (let i = depth; i >= 1; i--) {
    const t = i / depth;
    ctx.fillStyle = t > 0.66 ? "#3d1154" : t > 0.33 ? "#5c1458" : "#7a1e6e";
    ctx.fillText(label, cx + i * 0.9, cy + i * 1.05);
  }
  // face: outer stroke, inner stroke, gradient fill
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = preset.outer;
  ctx.strokeText(label, cx, cy);
  ctx.lineWidth = size * 0.055;
  ctx.strokeStyle = preset.inner;
  ctx.strokeText(label, cx, cy);
  const grad = ctx.createLinearGradient(0, cy - size * 0.55, 0, cy + size * 0.55);
  preset.fill.forEach((color, i) => grad.addColorStop(i / (preset.fill.length - 1), color));
  ctx.fillStyle = grad;
  ctx.fillText(label, cx, cy);
  ctx.restore();
  return size;
}

// The neon script subtitle: layered glow passes under a bright core, in the
// bundled Pacifico script.
export function drawNeonScript(ctx, text, cx, cy, size, color) {
  const label = String(text || "");
  if (!label) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size}px Pacifico, cursive`;
  ctx.rotate(-0.02);
  for (const [blur, alpha] of [[26, 0.55], [14, 0.75], [6, 0.9]]) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillText(label, cx, cy);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, cx, cy);
  ctx.restore();
}

// Small caps place line above the title, letter-spaced.
export function drawPlaceLine(ctx, text, cx, y, size) {
  const label = String(text || "").toUpperCase();
  if (!label) return;
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.fillStyle = "#ffe9b8";
  ctx.textBaseline = "middle";
  drawSpacedText(ctx, label, cx, y, size * 0.42);
  ctx.restore();
}

// The tagline under the script: thin, wide-tracked caps.
export function drawTagline(ctx, text, cx, y, size) {
  const label = String(text || "").toUpperCase();
  if (!label) return;
  ctx.save();
  ctx.font = `600 ${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,244,220,0.92)";
  ctx.textBaseline = "middle";
  drawSpacedText(ctx, label, cx, y, size * 0.34);
  ctx.restore();
}
