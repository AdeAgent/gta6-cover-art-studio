// The cover renderer: draws one whole cover — sunset ground, slanted photo
// panels, the lettering band with its sun and skyline, stickers, then the
// print effects. Pure canvas work, deterministic for a given state, so two
// renders of the same cover are byte-identical.

import { layoutById, layoutPanelsForSize } from "../layouts/panelLayouts.js";
import { paintPanelPhoto, paintSelectionHandles } from "./panelPainter.js";
import { drawExtrudedTitle, drawNeonScript, drawPlaceLine, drawTagline, presetById } from "../lettering/titleLettering.js";
import { drawStarburst, drawHeatStars, drawBarcode, drawRibbon } from "../decor/stickers.js";
import { drawSunDisc, drawPalmSilhouettes, drawSkylineStrip } from "../decor/sunsetScenery.js";
import { applyHalftone, addFilmGrain, addBloomGlow, applyVignette, applyLightLeak } from "../grade/printEffects.js";

function photoById(state, id) {
  return state.photos.find((p) => p.id === id) ?? null;
}

function sunsetGround(ctx, width, height) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#2a0f45");
  grad.addColorStop(0.45, "#7a1e6e");
  grad.addColorStop(0.75, "#e83e5f");
  grad.addColorStop(1, "#ff8a3c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

// The lettering band: a dusk gradient, the sun disc sinking behind the title,
// palms at the edges and the skyline strip along the very bottom.
function paintTitleBand(ctx, state, width, height, bandTop, preset) {
  const bandH = height - bandTop;
  const grad = ctx.createLinearGradient(0, bandTop, 0, height);
  grad.addColorStop(0, "#3d1154");
  grad.addColorStop(0.55, "#8e2064");
  grad.addColorStop(0.82, "#e83e5f");
  grad.addColorStop(1, "#ff8a3c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, bandTop, width, bandH);
  drawSunDisc(ctx, width / 2, height + bandH * 0.16, bandH * 0.92);
  drawPalmSilhouettes(ctx, width, height, bandH * 0.52);
  drawSkylineStrip(ctx, width, height, bandH * 0.30);

  const cx = width / 2;
  drawPlaceLine(ctx, state.texts.place, cx, bandTop + bandH * 0.13, bandH * 0.085);
  const titleSize = drawExtrudedTitle(
    ctx, state.texts.title, cx, bandTop + bandH * 0.44, width * 0.86, preset, bandH * 0.46,
  );
  drawNeonScript(ctx, state.texts.subtitle, cx, bandTop + bandH * 0.72, bandH * 0.17, preset.script);
  drawTagline(ctx, state.texts.tagline, cx, bandTop + bandH * 0.885, bandH * 0.068);
  drawHeatStars(ctx, width * 0.865, bandTop + bandH * 0.14, bandH * 0.09, 5, 5);
  drawBarcode(ctx, width * 0.028, bandTop + bandH * 0.60, width * 0.052, bandH * 0.16, state.texts.title);
  return titleSize;
}

// For the full-bleed layout the lettering sits on a scrim over the photo.
function paintBleedLettering(ctx, state, width, height, preset) {
  const scrimTop = height * 0.60;
  const grad = ctx.createLinearGradient(0, scrimTop, 0, height);
  grad.addColorStop(0, "rgba(22,8,40,0)");
  grad.addColorStop(0.45, "rgba(22,8,40,0.72)");
  grad.addColorStop(1, "rgba(22,8,40,0.94)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, scrimTop, width, height - scrimTop);
  drawSkylineStrip(ctx, width, height, height * 0.07);
  const cx = width / 2;
  drawPlaceLine(ctx, state.texts.place, cx, height * 0.715, height * 0.026);
  drawExtrudedTitle(ctx, state.texts.title, cx, height * 0.815, width * 0.86, preset, height * 0.115);
  drawNeonScript(ctx, state.texts.subtitle, cx, height * 0.905, height * 0.045, preset.script);
  drawTagline(ctx, state.texts.tagline, cx, height * 0.955, height * 0.02);
}

export function renderCover(ctx, state, width, height, options = {}) {
  const layout = layoutById(state.layoutId);
  const preset = presetById(state.presetId);
  sunsetGround(ctx, width, height);

  let polys = layoutPanelsForSize(layout, width, height);
  if (layout.diagonal) {
    const areaH = height * (1 - layout.band);
    polys = [
      { points: [[0, 0], [width, 0], [width * 0.30, areaH], [0, areaH]], cx: width * 0.32, cy: areaH * 0.42 },
      { points: [[width, 0], [width, areaH], [width * 0.30, areaH]], cx: width * 0.78, cy: areaH * 0.55 },
    ];
  }
  if (layout.strip) {
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(0, 0, width, height * (1 - layout.band));
    ctx.fillStyle = "#f7f2e7";
    const areaH = height * (1 - layout.band);
    for (let y = 10; y < areaH - 12; y += 26) {
      ctx.fillRect(width * 0.012, y, width * 0.02, 13);
      ctx.fillRect(width * 0.968, y, width * 0.02, 13);
    }
  }

  polys.forEach((poly, i) => {
    const panel = state.panels[i] ?? { photoId: null };
    const photo = photoById(state, panel.photoId);
    paintPanelPhoto(ctx, photo, panel, poly.points, panel.gradeId ?? state.gradeId, {
      frame: Boolean(layout.panels[i] && layout.panels[i].frame),
    });
  });

  // stickers ride over the panels, poster-style
  const stickerText = String(state.texts.sticker || "EST. 2026");
  const [line1, ...rest] = stickerText.split(" ");
  drawStarburst(ctx, width * 0.925, height * 0.085, Math.min(width, height) * 0.052, line1, rest.join(" "));
  drawRibbon(ctx, width * 0.012, height * 0.028, width * 0.17, state.texts.place || "VICE SHORES");

  if (layout.bleed) paintBleedLettering(ctx, state, width, height, preset);
  else paintTitleBand(ctx, state, width, height, height * (1 - layout.band), preset);

  if (options.editor && state.panels.length && polys[state.selectedPanel]) {
    paintSelectionHandles(ctx, polys[state.selectedPanel].points);
  }

  if (state.effects.halftone) applyHalftone(ctx, width, height, Math.max(9, Math.round(width / 110)));
  if (state.effects.bloom) addBloomGlow(ctx, width, height);
  if (state.effects.leak) applyLightLeak(ctx, width, height);
  if (state.effects.vignette) applyVignette(ctx, width, height);
  if (state.effects.grain) addFilmGrain(ctx, width, height);
  return polys;
}

// Render into a fresh canvas at an export size and hand it back.
export function renderCoverToCanvas(state, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  renderCover(canvas.getContext("2d"), state, width, height);
  return canvas;
}
