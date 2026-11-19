// Procedural stickers and marks: every one is drawn, none is an image file,
// so the cover stays original and self-contained.

function starburstPath(ctx, cx, cy, radius, spikes = 18) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.82;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// A spiky round sticker with two lines of small caps text, rotated a touch.
export function drawStarburst(ctx, cx, cy, radius, line1, line2) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.14);
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = radius * 0.16;
  ctx.shadowOffsetY = radius * 0.08;
  starburstPath(ctx, 0, 0, radius);
  const grad = ctx.createLinearGradient(0, -radius, 0, radius);
  grad.addColorStop(0, "#ffe259");
  grad.addColorStop(1, "#ffa751");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = radius * 0.05;
  ctx.strokeStyle = "#20102e";
  ctx.stroke();
  ctx.fillStyle = "#20102e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(radius * 0.34)}px Anton, sans-serif`;
  ctx.fillText(line1, 0, line2 ? -radius * 0.18 : 0);
  if (line2) {
    ctx.font = `${Math.round(radius * 0.3)}px Anton, sans-serif`;
    ctx.fillText(line2, 0, radius * 0.22);
  }
  ctx.restore();
}

// A row of "heat" stars, filled up to `count`.
export function drawHeatStars(ctx, x, y, size, count = 5, filled = 5) {
  ctx.save();
  for (let s = 0; s < count; s++) {
    const cx = x + s * size * 1.25, cy = y;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size / 2 : size / 5;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = s < filled ? "#ffd23c" : "rgba(255,255,255,0.28)";
    ctx.fill();
  }
  ctx.restore();
}

// A fake barcode: deterministic bar widths from the title's characters, so
// every cover's barcode is its own.
export function drawBarcode(ctx, x, y, w, h, seedText) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(x - 4, y - 3, w + 8, h + 12);
  ctx.fillStyle = "#14100e";
  let cx = x;
  let seed = 7;
  for (const ch of String(seedText || "S6")) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  let i = 0;
  while (cx < x + w - 2) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const bw = 1 + (seed % 3);
    if (i % 2 === 0) ctx.fillRect(cx, y, bw, h);
    cx += bw + 1;
    i++;
  }
  ctx.font = `${Math.round(h * 0.32)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("S6 · VICE SHORES", x + w / 2, y + h + 9);
  ctx.restore();
}

// A slanted ribbon banner with a line of caps text, poster-corner style.
export function drawRibbon(ctx, x, y, w, text, color = "#ff2e88") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.045);
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, w * 0.16);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#fff";
  ctx.font = `${Math.round(w * 0.095)}px Anton, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(text || "").toUpperCase(), w / 2, w * 0.082);
  ctx.restore();
}
