// Editor state for Slant Six Studio: one plain object, replaced wholesale on
// every committed change so undo/redo are just two stacks of snapshots.

export const DEFAULT_TEXTS = {
  title: "SLANT HEAT",
  subtitle: "chase the neon tide",
  tagline: "SIX PANELS · ONE LEGEND",
  place: "VICE SHORES",
  sticker: "EST. 2026",
};

export function freshPanel(photoId = null) {
  return { photoId, panX: 0, panY: 0, zoom: 1, rot: 0, flip: false, gradeId: null };
}

export function createEditorState() {
  return {
    photos: [], // {id, name, source (canvas), w, h, focus:{x,y}, thumb (data url)}
    trayPhotoId: null,
    layoutId: "slant-six",
    gradeId: "sunset-strip",
    presetId: "chrome-sunset",
    sizeId: "wide",
    panels: [],
    selectedPanel: 0,
    texts: { ...DEFAULT_TEXTS },
    effects: { grain: true, halftone: false, bloom: true, vignette: true, leak: false },
  };
}

// Snapshots exclude the photo pixels (those live in a side table the caller
// keeps); a snapshot is everything needed to rebuild the panels and look.
export function snapshotOf(state) {
  return JSON.stringify({
    layoutId: state.layoutId,
    gradeId: state.gradeId,
    presetId: state.presetId,
    sizeId: state.sizeId,
    panels: state.panels,
    selectedPanel: state.selectedPanel,
    trayPhotoId: state.trayPhotoId,
    photoIds: state.photos.map((p) => p.id),
    texts: state.texts,
    effects: state.effects,
  });
}

export function restoreInto(state, snap) {
  const data = JSON.parse(snap);
  state.layoutId = data.layoutId;
  state.gradeId = data.gradeId;
  state.presetId = data.presetId;
  state.sizeId = data.sizeId;
  state.panels = data.panels;
  state.selectedPanel = data.selectedPanel;
  state.trayPhotoId = data.trayPhotoId;
  state.photos = state.photos.filter((p) => data.photoIds.includes(p.id));
  state.texts = data.texts;
  state.effects = data.effects;
}

export class History {
  constructor(limit = 60) {
    this.limit = limit;
    this.past = [];
    this.future = [];
  }
  commit(state) {
    this.past.push(snapshotOf(state));
    if (this.past.length > this.limit) this.past.shift();
    this.future.length = 0;
  }
  undo(state) {
    if (!this.past.length) return false;
    this.future.push(snapshotOf(state));
    restoreInto(state, this.past.pop());
    return true;
  }
  redo(state) {
    if (!this.future.length) return false;
    this.past.push(snapshotOf(state));
    restoreInto(state, this.future.pop());
    return true;
  }
}

// Deterministic PRNG (mulberry32): the "surprise me" mix and the film grain
// must come out the same every run, or two exports of one cover would differ.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SETTINGS_KEY = "slant-six-settings-v1";

export function saveSettings(state) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      texts: state.texts, gradeId: state.gradeId, presetId: state.presetId,
      layoutId: state.layoutId, sizeId: state.sizeId, effects: state.effects,
    }));
  } catch { /* private mode: settings are a nicety, not a requirement */ }
}

export function loadSettings(state) {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.texts) state.texts = { ...state.texts, ...saved.texts };
    for (const key of ["gradeId", "presetId", "layoutId", "sizeId"]) {
      if (typeof saved[key] === "string") state[key] = saved[key];
    }
    if (saved.effects) state.effects = { ...state.effects, ...saved.effects };
  } catch { /* a corrupt setting must never stop the studio opening */ }
}
