// Deterministic scenes for the entry's screenshots. Each scene pins the
// layout, grade, photos and lettering so the shot is reproducible — the same
// URL always renders the same cover.

import { freshPanel } from "../state/editorState.js";
import { autoCropVariants } from "../photos/focusPoint.js";

export function ensurePanels(state, layout) {
  const next = [];
  for (let i = 0; i < layout.panels.length; i++) {
    next.push(state.panels[i] ?? freshPanel());
  }
  state.panels = next;
  if (state.selectedPanel >= next.length) state.selectedPanel = 0;
}

export function assignPhotos(state, namesInOrder) {
  namesInOrder.forEach((name, i) => {
    const photo = state.photos.find((p) => p.name.toLowerCase() === String(name).toLowerCase());
    if (photo && state.panels[i]) state.panels[i] = { ...freshPanel(photo.id), ...cropHint(photo, i) };
  });
}

function cropHint() {
  return {};
}

// The three cover scenes the screenshots use. `kind` comes from ?shot=.
export function applyCoverScene(state, kind, params) {
  const byName = Object.fromEntries(state.photos.map((p) => [p.name, p]));
  if (kind === "cover-portrait") {
    state.layoutId = "hero-four";
    state.gradeId = "neon-night";
    state.presetId = "neon-tube";
    state.texts = { title: "MIDNIGHT HARBOR", subtitle: "the tide brings trouble", tagline: "FIVE FRAMES · ONE LONG NIGHT", place: "VICE SHORES", sticker: "EST. 2026" };
    state.effects = { grain: true, halftone: false, bloom: true, vignette: true, leak: true };
    assignPhotos(state, ["Speedboat", "Rooftop", "Neon Motel", "Lowrider", "Pier"]);
    // The speedboat portrait crop leans right, to the driver at the helm.
    if (state.panels[0]) state.panels[0].panX = -0.55;
    return { w: 1080, h: 1350 };
  }
  if (kind === "cover-one") {
    state.layoutId = "polaroid-scatter";
    state.gradeId = "retro-print";
    state.presetId = "sticker-pop";
    state.texts = { title: "SOLO RUN", subtitle: "one photo, three moods", tagline: "SHOT ON THE BOULEVARD", place: "VICE SHORES", sticker: "EST. 2026" };
    state.effects = { grain: true, halftone: true, bloom: false, vignette: true, leak: false };
    const photo = byName["Boulevard"] ?? state.photos[0];
    if (photo) {
      const variants = autoCropVariants(photo);
      state.panels = state.panels.map((panel, i) => ({ ...freshPanel(photo.id), ...variants[i % variants.length] }));
    }
    return { w: 1080, h: 1080 };
  }
  // default: the hero cover — Slant Six under Sunset Strip
  state.layoutId = "slant-six";
  state.gradeId = "sunset-strip";
  state.presetId = "chrome-sunset";
  state.effects = { grain: true, halftone: false, bloom: true, vignette: true, leak: false };
  if (params.get("title")) state.texts.title = params.get("title");
  assignPhotos(state, ["Boulevard", "Speedboat", "Neon Motel", "Rooftop", "Pier", "Lowrider"]);
  return { w: 1920, h: 1080 };
}

// The editor scene: the hero cover loaded, panel 2 selected mid-crop so the
// handles, zoom and rotation all show in the editor screenshot.
export function applyEditorScene(state) {
  state.layoutId = "slant-six";
  state.gradeId = "sunset-strip";
  state.presetId = "chrome-sunset";
  state.sizeId = "wide";
  assignPhotos(state, ["Boulevard", "Speedboat", "Neon Motel", "Rooftop", "Pier", "Lowrider"]);
  state.selectedPanel = 1;
  if (state.panels[1]) {
    state.panels[1].zoom = 1.45;
    state.panels[1].rot = -5;
    state.panels[1].panX = 0.12;
  }
}
