// Sunset scenery drawn in code: the sun disc with scanline cuts, palm
// silhouettes and the skyline strip that anchors the title band.

// A big low sun, sliced by horizontal scanlines that widen toward its base —
// the synthwave sun, drawn fresh for this studio.
export function drawSunDisc(ctx, cx, cy, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, cy - radius, 0, cy + radius);
  grad.addColorStop(0, "#ffd23c");
  grad.addColorStop(0.55, "#ff8a3c");
  grad.addColorStop(1, "#ff2e88");
  ctx.fillStyle = grad;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.fillStyle = "rgba(18,8,31,0.9)";
  let gapY = cy + radius * 0.08;
  let gapH = radius * 0.03;
  while (gapY < cy + radius) {
    ctx.fillRect(cx - radius, gapY, radius * 2, gapH);
    gapY += gapH + radius * 0.11;
    gapH *= 1.45;
  }
  ctx.restore();
}

// One palm: a curved trunk and a fan of fronds, as a filled silhouette path.
export function drawPalmSilhouette(ctx, x, baseY, height, lean = 0.16, color = "#12081f") {
  ctx.save();
  ctx.fillStyle = color;
  const topX = x + height * lean, topY = baseY - height;
  ctx.beginPath();
  ctx.moveTo(x - height * 0.03, baseY);
  ctx.quadraticCurveTo(x + height * lean * 0.4, baseY - height * 0.6, topX, topY);
  ctx.quadraticCurveTo(x + height * lean * 0.55, baseY - height * 0.55, x + height * 0.055, baseY);
  ctx.closePath();
  ctx.fill();
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const a = Math.PI * (0.08 + (i / (fronds - 1)) * 0.84);
    const len = height * (0.34 + 0.1 * Math.sin(i * 2.3));
    const ex = topX - Math.cos(a) * len;
    const ey = topY - Math.sin(a) * len * 0.55 + len * 0.16;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX - Math.cos(a) * len * 0.6, topY - Math.sin(a) * len * 0.75, ex, ey);
    ctx.quadraticCurveTo(topX - Math.cos(a) * len * 0.55, topY - Math.sin(a) * len * 0.5, topX, topY + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// A row of palms at mixed heights along a baseline.
export function drawPalmSilhouettes(ctx, width, baseY, height, color = "#12081f") {
  const spots = [0.04, 0.16, 0.86, 0.97];
  const heights = [0.9, 0.62, 0.7, 1.0];
  spots.forEach((fx, i) => {
    drawPalmSilhouette(ctx, width * fx, baseY, height * heights[i], i % 2 ? -0.13 : 0.17, color);
  });
}

// The skyline strip: a deterministic row of building blocks with a few lit
// windows, drawn along the bottom of the title band.
export function drawSkylineStrip(ctx, width, baseY, height, color = "#0d0518") {
  ctx.save();
  ctx.fillStyle = color;
  let x = 0;
  let seed = 42;
  const next = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
  const windows = [];
  while (x < width) {
    const bw = width * (0.02 + next() * 0.035);
    const bh = height * (0.35 + next() * 0.65);
    ctx.fillRect(x, baseY - bh, bw, bh);
    for (let wy = baseY - bh + 5; wy < baseY - 6; wy += 9) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 7) {
        if (next() > 0.72) windows.push([wx, wy]);
      }
    }
    x += bw + width * 0.004;
  }
  ctx.fillStyle = "rgba(255,210,60,0.85)";
  for (const [wx, wy] of windows) ctx.fillRect(wx, wy, 2.4, 3.2);
  ctx.restore();
}
