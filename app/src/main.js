// Slant Six Studio — boot. Wires the editor around the cover canvas, and
// serves the deterministic screenshot scenes when the URL asks for one.

import { createEditorState, freshPanel, History, loadSettings, saveSettings, seededRandom } from "./state/editorState.js";
import { PANEL_LAYOUTS, layoutById } from "./layouts/panelLayouts.js";
import { COLOR_GRADES, gradeSwatchCss } from "./grade/colorGrades.js";
import { LETTERING_PRESETS } from "./lettering/titleLettering.js";
import { EXPORT_SIZES, sizeById } from "./export/exportPresets.js";
import { loadPhotoFiles, loadSamplePhotos, SAMPLE_PHOTOS } from "./photos/photoLoader.js";
import { autoCropVariants } from "./photos/focusPoint.js";
import { renderCover } from "./render/coverRenderer.js";
import { exportCoverPng, exportAllSizes } from "./export/pngExporter.js";
import { enablePanelPanZoom, enablePhotoDrop } from "./ui/panelInteractions.js";
import { bindShortcuts } from "./ui/keyboardShortcuts.js";
import { applyCoverScene, applyEditorScene, ensurePanels } from "./shots/screenshotScenes.js";

const $ = (id) => document.getElementById(id);

async function bootCoverStudio() {
  const state = createEditorState();
  loadSettings(state);
  const params = new URLSearchParams(location.search);
  const shot = params.get("shot");
  await Promise.race([
    Promise.all([document.fonts.load("80px Anton"), document.fonts.load("40px Pacifico")]),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  if (shot && shot !== "editor") {
    document.body.classList.add("shot");
    state.photos = await loadSamplePhotos();
    const layout = layoutById(state.layoutId);
    ensurePanels(state, layout);
    const size = applyCoverScene(state, shot, params);
    ensurePanels(state, layoutById(state.layoutId));
    const stage = document.createElement("div");
    stage.id = "shotStage";
    const canvas = document.createElement("canvas");
    canvas.id = "shotCanvas";
    canvas.width = size.w; canvas.height = size.h;
    stage.appendChild(canvas);
    document.body.appendChild(stage);
    renderCover(canvas.getContext("2d"), state, size.w, size.h);
    window.__shotReady = true;
    return;
  }

  const canvas = $("coverCanvas");
  const ctx = canvas.getContext("2d");
  const history = new History();
  let gestureCommitted = false;

  const render = () => {
    const size = sizeById(state.sizeId);
    if (canvas.width !== size.w || canvas.height !== size.h) { canvas.width = size.w; canvas.height = size.h; }
    renderCover(ctx, state, size.w, size.h, { editor: true });
  };
  const commitPoint = () => { if (!gestureCommitted) { history.commit(state); gestureCommitted = true; } };
  const endGesture = () => { gestureCommitted = false; };
  const change = (commit = true) => {
    if (commit) commitPoint();
    ensurePanels(state, layoutById(state.layoutId));
    syncUi();
    render();
    saveSettings(state);
    endGesture();
  };

  // ---------- pickers ----------
  const tray = $("photoTray");
  function syncTray() {
    tray.innerHTML = "";
    for (const photo of state.photos) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "trayPhoto" + (photo.id === state.trayPhotoId ? " active" : "");
      btn.title = photo.name;
      btn.draggable = true;
      const img = document.createElement("img");
      img.src = photo.thumbUrl; img.alt = photo.name;
      btn.appendChild(img);
      btn.addEventListener("click", () => { state.trayPhotoId = photo.id; syncTray(); });
      btn.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/slant-six-photo", photo.id));
      tray.appendChild(btn);
    }
    $("emptyState").classList.toggle("show", state.photos.length === 0);
  }

  const layoutPicker = $("layoutPicker");
  for (const layout of PANEL_LAYOUTS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "layoutThumb";
    btn.dataset.layoutId = layout.id;
    const mini = document.createElement("canvas");
    mini.width = 120; mini.height = 54;
    const mctx = mini.getContext("2d");
    mctx.fillStyle = "#2a0f45"; mctx.fillRect(0, 0, 120, 54);
    layout.panels.forEach((p, i) => {
      mctx.fillStyle = ["#ff2e88", "#ff8a3c", "#19d3c5", "#ffd23c"][i % 4];
      const sx = layout.shear ? (0.38 - p.y) * layout.shear * 40 : 0;
      mctx.fillRect(p.x * 120 + sx, p.y * 54, p.w * 120 - 2, p.h * 54 - 2);
    });
    btn.appendChild(mini);
    btn.appendChild(document.createTextNode(layout.name));
    btn.addEventListener("click", () => { state.layoutId = layout.id; change(true); });
    layoutPicker.appendChild(btn);
  }

  const gradePicker = $("gradePicker");
  for (const grade of COLOR_GRADES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gradeSwatch";
    btn.dataset.gradeId = grade.id;
    btn.style.background = gradeSwatchCss(grade);
    const label = document.createElement("span");
    label.textContent = grade.name;
    btn.appendChild(label);
    btn.addEventListener("click", () => { state.gradeId = grade.id; change(true); });
    gradePicker.appendChild(btn);
  }
  const panelGradeSelect = $("panelGradeSelect");
  panelGradeSelect.innerHTML = `<option value="">Cover grade</option>` +
    COLOR_GRADES.map((g) => `<option value="${g.id}">${g.name}</option>`).join("");
  panelGradeSelect.addEventListener("focus", commitPoint);
  panelGradeSelect.addEventListener("change", () => {
    const panel = state.panels[state.selectedPanel];
    if (panel) panel.gradeId = panelGradeSelect.value || null;
    change(false);
  });

  const presetPicker = $("presetPicker");
  for (const preset of LETTERING_PRESETS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.presetId = preset.id;
    btn.textContent = preset.name;
    btn.addEventListener("click", () => { state.presetId = preset.id; change(true); });
    presetPicker.appendChild(btn);
  }

  const exportSizes = $("exportSizes");
  for (const size of EXPORT_SIZES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.sizeId = size.id;
    btn.textContent = size.label;
    btn.addEventListener("click", () => { state.sizeId = size.id; change(true); });
    exportSizes.appendChild(btn);
  }

  // ---------- caption fields ----------
  const textBindings = [
    ["titleInput", "title"], ["subtitleInput", "subtitle"], ["taglineInput", "tagline"],
    ["placeInput", "place"], ["stickerInput", "sticker"],
  ];
  for (const [id, key] of textBindings) {
    const input = $(id);
    input.addEventListener("focus", commitPoint);
    input.addEventListener("input", () => { state.texts[key] = input.value; change(false); });
    input.addEventListener("blur", endGesture);
  }

  // ---------- panel crop controls ----------
  const panel = () => state.panels[state.selectedPanel];
  $("zoomSlider").addEventListener("focus", commitPoint);
  $("zoomSlider").addEventListener("input", (e) => { if (panel()) { panel().zoom = Number(e.target.value); change(false); } });
  $("rotateSlider").addEventListener("focus", commitPoint);
  $("rotateSlider").addEventListener("input", (e) => { if (panel()) { panel().rot = Number(e.target.value); change(false); } });
  $("flipButton").addEventListener("click", () => { if (panel()) { panel().flip = !panel().flip; change(true); } });
  $("resetPanelButton").addEventListener("click", () => {
    const current = panel();
    if (current) state.panels[state.selectedPanel] = { ...freshPanel(current.photoId), gradeId: current.gradeId };
    change(true);
  });

  // ---------- effects ----------
  const effectBindings = [["grainToggle", "grain"], ["halftoneToggle", "halftone"], ["bloomToggle", "bloom"], ["vignetteToggle", "vignette"], ["leakToggle", "leak"]];
  for (const [id, key] of effectBindings) {
    $(id).addEventListener("change", (e) => { state.effects[key] = e.target.checked; change(true); });
  }

  // ---------- photo intake ----------
  async function addPhotos(files) {
    const loaded = await loadPhotoFiles(files);
    if (!loaded.length) return;
    commitPoint();
    state.photos.push(...loaded);
    if (!state.trayPhotoId) state.trayPhotoId = loaded[0].id;
    // fill empty panels first, in order
    for (const photo of loaded) {
      const empty = state.panels.findIndex((p) => !p.photoId);
      if (empty === -1) break;
      state.panels[empty] = freshPanel(photo.id);
    }
    change(false);
  }
  $("photoInput").addEventListener("change", (e) => { addPhotos([...e.target.files]); e.target.value = ""; });
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => { e.preventDefault(); if (e.dataTransfer.files.length) addPhotos([...e.dataTransfer.files]); });
  window.addEventListener("paste", (e) => {
    const files = [...(e.clipboardData?.files ?? [])];
    if (files.length) addPhotos(files);
  });

  $("fillOnePhotoButton").addEventListener("click", () => {
    const photo = state.photos.find((p) => p.id === state.trayPhotoId) ?? state.photos[0];
    if (!photo) return;
    const variants = autoCropVariants(photo);
    state.panels = state.panels.map((p, i) => ({ ...freshPanel(photo.id), ...variants[i % variants.length], gradeId: p.gradeId }));
    change(true);
  });
  $("shuffleButton").addEventListener("click", () => {
    if (!state.photos.length) return;
    const rand = seededRandom((Math.random() * 1e9) | 0);
    state.panels = state.panels.map((p, i) => ({ ...p, photoId: state.photos[Math.floor(rand() * state.photos.length)].id, panX: 0, panY: 0, zoom: 1, rot: 0 }));
    change(true);
  });

  // ---------- canvas interaction ----------
  enablePanelPanZoom(canvas, state, {
    onSelect: (i) => { state.selectedPanel = i; syncUi(); render(); },
    onPlace: (i) => {
      commitPoint();
      state.panels[i] = { ...freshPanel(state.trayPhotoId), gradeId: state.panels[i]?.gradeId ?? null };
      state.selectedPanel = i;
      change(false);
    },
    onDragStart: commitPoint,
    onChange: (commit) => change(commit),
    onSwap: (a, b) => {
      const pa = state.panels[a], pb = state.panels[b];
      if (pa && pb) { const t = pa.photoId; pa.photoId = pb.photoId; pb.photoId = t; }
      change(false);
    },
    trayPhotoId: () => state.trayPhotoId,
  });
  enablePhotoDrop(canvas, state, {
    onDropPhoto: (i, photoId) => {
      commitPoint();
      state.panels[i] = { ...freshPanel(photoId), gradeId: state.panels[i]?.gradeId ?? null };
      state.selectedPanel = i;
      change(false);
    },
  });
  canvas.addEventListener("dblclick", () => { $("titleInput").focus(); $("titleInput").select(); });

  // ---------- top actions ----------
  const doUndo = () => { if (history.undo(state)) { ensurePanels(state, layoutById(state.layoutId)); syncUi(); render(); } };
  const doRedo = () => { if (history.redo(state)) { ensurePanels(state, layoutById(state.layoutId)); syncUi(); render(); } };
  $("undoButton").addEventListener("click", doUndo);
  $("redoButton").addEventListener("click", doRedo);
  const doSurprise = () => {
    const rand = seededRandom((Math.random() * 1e9) | 0);
    state.layoutId = PANEL_LAYOUTS[Math.floor(rand() * PANEL_LAYOUTS.length)].id;
    state.gradeId = COLOR_GRADES[Math.floor(rand() * COLOR_GRADES.length)].id;
    state.presetId = LETTERING_PRESETS[Math.floor(rand() * LETTERING_PRESETS.length)].id;
    ensurePanels(state, layoutById(state.layoutId));
    if (state.photos.length) {
      state.panels = state.panels.map(() => freshPanel(state.photos[Math.floor(rand() * state.photos.length)].id));
    }
    change(true);
  };
  $("surpriseButton").addEventListener("click", doSurprise);
  $("helpButton").addEventListener("click", () => { $("shortcutOverlay").hidden = false; });
  $("closeHelpButton").addEventListener("click", () => { $("shortcutOverlay").hidden = true; });
  $("exportButton").addEventListener("click", () => exportCoverPng(state));
  $("exportAllButton").addEventListener("click", () => exportAllSizes(state));
  bindShortcuts({
    undo: doUndo, redo: doRedo, surprise: doSurprise,
    exportPng: () => exportCoverPng(state),
    toggleHelp: () => { $("shortcutOverlay").hidden = !$("shortcutOverlay").hidden; },
    closeHelp: () => { $("shortcutOverlay").hidden = true; },
  });

  // ---------- empty-state sample buttons ----------
  const sampleButtons = $("sampleButtons");
  for (const sample of SAMPLE_PHOTOS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = sample.name;
    btn.addEventListener("click", async () => {
      if (!state.photos.length) state.photos = await loadSamplePhotos();
      state.panels = state.panels.map((p, i) => (state.photos[i] ? freshPanel(state.photos[i].id) : p));
      state.trayPhotoId = state.photos[0]?.id ?? null;
      change(true);
    });
    sampleButtons.appendChild(btn);
  }

  function syncUi() {
    syncTray();
    for (const btn of layoutPicker.children) btn.classList.toggle("active", btn.dataset.layoutId === state.layoutId);
    for (const btn of gradePicker.children) btn.classList.toggle("active", btn.dataset.gradeId === state.gradeId);
    for (const btn of presetPicker.children) btn.classList.toggle("active", btn.dataset.presetId === state.presetId);
    for (const btn of exportSizes.children) btn.classList.toggle("active", btn.dataset.sizeId === state.sizeId);
    for (const [id, key] of textBindings) { if (document.activeElement !== $(id)) $(id).value = state.texts[key]; }
    for (const [id, key] of effectBindings) $(id).checked = Boolean(state.effects[key]);
    const current = panel();
    $("selectedPanelLabel").textContent = `Panel ${state.selectedPanel + 1} of ${state.panels.length}`;
    if (current) {
      $("zoomSlider").value = current.zoom;
      $("rotateSlider").value = current.rot;
      panelGradeSelect.value = current.gradeId ?? "";
    }
  }

  // ---------- first paint ----------
  ensurePanels(state, layoutById(state.layoutId));
  syncUi();
  render();
  state.photos = await loadSamplePhotos();
  if (state.photos.length) {
    state.trayPhotoId = state.photos[0].id;
    state.panels = state.panels.map((p, i) => (state.photos[i] ? freshPanel(state.photos[i].id) : p));
    if (shot === "editor") applyEditorScene(state);
    ensurePanels(state, layoutById(state.layoutId));
    syncUi();
    render();
  }
  if (shot === "editor") window.__shotReady = true;
}

bootCoverStudio();
