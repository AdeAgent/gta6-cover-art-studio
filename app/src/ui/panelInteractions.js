// Pointer work on the cover canvas: click a panel to select it (or to place
// the tray's chosen photo), drag to pan its photo, wheel to zoom, and drag
// one panel onto another to swap their photos.

import { layoutById, layoutPanelsForSize, pointInPolygon } from "../layouts/panelLayouts.js";

export function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

export function panelIndexAt(state, canvas, event) {
  const { x, y } = canvasPoint(canvas, event);
  const layout = layoutById(state.layoutId);
  const polys = layoutPanelsForSize(layout, canvas.width, canvas.height);
  for (let i = polys.length - 1; i >= 0; i--) {
    if (pointInPolygon(x, y, polys[i].points)) return i;
  }
  return -1;
}

// hooks: {onSelect(i), onPlace(i), onDragStart(), onChange(), trayPhotoId()}
export function enablePanelPanZoom(canvas, state, hooks) {
  let drag = null;

  canvas.addEventListener("pointerdown", (event) => {
    const index = panelIndexAt(state, canvas, event);
    if (index < 0) return;
    canvas.setPointerCapture(event.pointerId);
    if (state.selectedPanel !== index) hooks.onSelect(index);
    const panel = state.panels[index];
    drag = {
      index,
      startX: event.clientX, startY: event.clientY,
      panX: panel ? panel.panX : 0, panY: panel ? panel.panY : 0,
      moved: false,
    };
    hooks.onDragStart();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const panel = state.panels[drag.index];
    if (!panel || !panel.photoId) return;
    const rect = canvas.getBoundingClientRect();
    const dx = ((event.clientX - drag.startX) / rect.width) * 2.2;
    const dy = ((event.clientY - drag.startY) / rect.height) * 2.2;
    if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 4) drag.moved = true;
    panel.panX = Math.min(1, Math.max(-1, drag.panX + dx));
    panel.panY = Math.min(1, Math.max(-1, drag.panY + dy));
    hooks.onChange(false);
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!drag) return;
    const wasDrag = drag.moved;
    const from = drag.index;
    drag = null;
    if (!wasDrag) {
      // a plain click: place the tray photo if one is chosen for placing
      const trayId = hooks.trayPhotoId();
      if (trayId) { hooks.onPlace(from); return; }
      hooks.onChange(false);
      return;
    }
    // a drag that ends over another panel swaps the two photos
    const to = panelIndexAt(state, canvas, event);
    if (to >= 0 && to !== from) hooks.onSwap(from, to);
    else hooks.onChange(true);
  });

  canvas.addEventListener("wheel", (event) => {
    const index = panelIndexAt(state, canvas, event);
    if (index < 0) return;
    const panel = state.panels[index];
    if (!panel || !panel.photoId) return;
    event.preventDefault();
    if (state.selectedPanel !== index) hooks.onSelect(index);
    const factor = event.deltaY < 0 ? 1.07 : 1 / 1.07;
    panel.zoom = Math.min(3, Math.max(1, panel.zoom * factor));
    hooks.onChange(false);
  }, { passive: false });
}

// Dragging a tray photo onto the canvas drops it on the panel under the
// pointer; files dropped anywhere land in the tray via the caller's handler.
export function enablePhotoDrop(canvas, state, hooks) {
  canvas.addEventListener("dragover", (event) => event.preventDefault());
  canvas.addEventListener("drop", (event) => {
    event.preventDefault();
    const photoId = event.dataTransfer.getData("text/slant-six-photo");
    if (!photoId) return; // files are the caller's business
    const index = panelIndexAt(state, canvas, event);
    if (index >= 0) hooks.onDropPhoto(index, photoId);
  });
}
