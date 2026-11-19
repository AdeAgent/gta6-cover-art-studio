// Panel painting: a photo is rendered once into an offscreen canvas at the
// panel's bounding box (crop, zoom, rotation, flip and grade all baked in),
// then clipped into the panel's slanted polygon on the cover.

import { applyGradeToCanvas, gradeById } from "../grade/colorGrades.js";

export function tracePolygonPath(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

export function clipSlantedPanel(ctx, points) {
  tracePolygonPath(ctx, points);
  ctx.clip();
}

export function polygonBounds(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// Bake one panel's photo into an offscreen canvas the size of the polygon's
// bounding box. The focus point anchors the crop: at zoom 1 the photo covers
// the box with its focus as close to the box's centre as the edges allow.
export function bakePanelPhoto(photo, panel, bounds, gradeId) {
  const scaleCap = 1600 / Math.max(bounds.w, 1);
  const down = Math.min(1, scaleCap);
  const w = Math.max(2, Math.round(bounds.w * down));
  const h = Math.max(2, Math.round(bounds.h * down));
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const ctx = off.getContext("2d");
  const iw = photo.w, ih = photo.h;
  const rot = ((panel.rot || 0) * Math.PI) / 180;
  const rotPad = 1 + Math.abs(Math.sin(rot)) * 0.55;
  const coverScale = Math.max(w / iw, h / ih) * (panel.zoom || 1) * rotPad;
  const dw = iw * coverScale, dh = ih * coverScale;
  const spareX = Math.max(0, (dw - w) / 2), spareY = Math.max(0, (dh - h) / 2);
  // Centre the focus point, but clamp the offset so the photo always covers
  // the whole box: a focus near an edge leans the crop that way without ever
  // opening a gap. Pan then spends whatever spare room is left.
  const clampAxis = (offset, size, drawn) => Math.min(0, Math.max(size - drawn, offset));
  let ox = clampAxis(w / 2 - photo.focus.x * dw, w, dw) + (panel.panX || 0) * spareX;
  let oy = clampAxis(h / 2 - photo.focus.y * dh, h, dh) + (panel.panY || 0) * spareY;
  ox = clampAxis(ox, w, dw);
  oy = clampAxis(oy, h, dh);
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rot);
  if (panel.flip) ctx.scale(-1, 1);
  ctx.translate(-w / 2, -h / 2);
  ctx.drawImage(photo.source, ox, oy, dw, dh);
  if (gradeId) applyGradeToCanvas(off, gradeById(gradeId));
  return off;
}

// Paint a panel: shadow, (optional polaroid frame), the baked photo clipped
// to the polygon, an inner vignette, and the gutter stroke.
export function paintPanelPhoto(ctx, photo, panel, points, gradeId, options = {}) {
  const bounds = polygonBounds(points);
  ctx.save();
  // drop shadow
  ctx.translate(0, Math.max(3, bounds.h * 0.012));
  tracePolygonPath(ctx, points);
  ctx.fillStyle = "rgba(8,2,16,0.4)";
  ctx.fill();
  ctx.restore();

  if (options.frame) {
    const cx = bounds.x + bounds.w / 2, cy = bounds.y + bounds.h / 2;
    const grown = points.map(([x, y]) => [cx + (x - cx) * 1.045, cy + (y - cy) * 1.045 + bounds.h * 0.018]);
    tracePolygonPath(ctx, grown);
    ctx.fillStyle = "#f7f2e7";
    ctx.fill();
  }

  if (photo) {
    const baked = bakePanelPhoto(photo, panel, bounds, gradeId);
    ctx.save();
    clipSlantedPanel(ctx, points);
    ctx.drawImage(baked, bounds.x, bounds.y, bounds.w, bounds.h);
    // inner vignette: darken the polygon's rim so panels feel printed, not pasted
    const grad = ctx.createRadialGradient(
      bounds.x + bounds.w / 2, bounds.y + bounds.h / 2, Math.min(bounds.w, bounds.h) * 0.36,
      bounds.x + bounds.w / 2, bounds.y + bounds.h / 2, Math.max(bounds.w, bounds.h) * 0.72,
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(10,2,18,0.30)");
    ctx.fillStyle = grad;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    ctx.restore();
  } else {
    tracePolygonPath(ctx, points);
    const grad = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    grad.addColorStop(0, "#3d1154");
    grad.addColorStop(1, "#7a1e6e");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `${Math.round(Math.min(bounds.w, bounds.h) * 0.16)}px Anton, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("S6", bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
  }

  // gutter: a dark keyline under a cream edge — the printed-poster separator
  tracePolygonPath(ctx, points);
  ctx.lineWidth = Math.max(4, bounds.w * 0.012);
  ctx.strokeStyle = "#160a24";
  ctx.stroke();
  tracePolygonPath(ctx, points);
  ctx.lineWidth = Math.max(1.4, bounds.w * 0.004);
  ctx.strokeStyle = "rgba(255,243,214,0.9)";
  ctx.stroke();
}

// The editor's selection overlay: dashed outline, corner handles and a
// rotate knob — drawn only in the editor, never in an export.
export function paintSelectionHandles(ctx, points) {
  const bounds = polygonBounds(points);
  ctx.save();
  tracePolygonPath(ctx, points);
  ctx.setLineDash([10, 7]);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#19d3c5";
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#19d3c5";
  ctx.strokeStyle = "#0b2b29";
  const s = Math.max(9, bounds.w * 0.02);
  for (const [x, y] of points) {
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
    ctx.strokeRect(x - s / 2, y - s / 2, s, s);
  }
  const topCx = (points[0][0] + points[1][0]) / 2, topCy = (points[0][1] + points[1][1]) / 2;
  ctx.beginPath();
  ctx.moveTo(topCx, topCy);
  ctx.lineTo(topCx, topCy - 26);
  ctx.strokeStyle = "#19d3c5";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(topCx, topCy - 32, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd23c";
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
