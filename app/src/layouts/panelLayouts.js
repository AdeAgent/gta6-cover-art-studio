// Panel layouts as normalized geometry. Every panel starts life as a rect in
// 0..1 cover space; a layout's `shear` then slants the whole panel area
// sideways as a panel's y grows, which is what makes the gutters diagonal.
// The renderer turns rects into polygons, so any export size reflows.

// Panel area: panels live above the title band. `band` is the fraction of the
// cover's height the lettering band takes at the bottom.
function rect(x, y, w, h, extra = {}) {
  return { x, y, w, h, rot: 0, frame: false, ...extra };
}

export const PANEL_LAYOUTS = [
  {
    id: "slant-six", name: "Slant Six", shear: 0.11, band: 0.235,
    panels: [
      rect(0, 0, 0.485, 0.765),
      rect(0.485, 0, 0.515, 0.255),
      rect(0.485, 0.255, 0.2575, 0.255), rect(0.7425, 0.255, 0.2575, 0.255),
      rect(0.485, 0.51, 0.2575, 0.255), rect(0.7425, 0.51, 0.2575, 0.255),
    ],
  },
  {
    id: "hero-four", name: "Hero + Four", shear: 0.06, band: 0.235,
    panels: [
      rect(0, 0, 0.56, 0.765),
      rect(0.56, 0, 0.22, 0.3825), rect(0.78, 0, 0.22, 0.3825),
      rect(0.56, 0.3825, 0.22, 0.3825), rect(0.78, 0.3825, 0.22, 0.3825),
    ],
  },
  {
    id: "slant-triptych", name: "Slant Triptych", shear: 0.17, band: 0.235,
    panels: [
      rect(0, 0, 0.34, 0.765), rect(0.33, 0, 0.34, 0.765), rect(0.66, 0, 0.34, 0.765),
    ],
  },
  {
    id: "nine-grid", name: "Nine Grid", shear: 0, band: 0.235,
    panels: [
      rect(0, 0, 1 / 3, 0.255), rect(1 / 3, 0, 1 / 3, 0.255), rect(2 / 3, 0, 1 / 3, 0.255),
      rect(0, 0.255, 1 / 3, 0.255), rect(1 / 3, 0.255, 1 / 3, 0.255), rect(2 / 3, 0.255, 1 / 3, 0.255),
      rect(0, 0.51, 1 / 3, 0.255), rect(1 / 3, 0.51, 1 / 3, 0.255), rect(2 / 3, 0.51, 1 / 3, 0.255),
    ],
  },
  {
    id: "polaroid-scatter", name: "Polaroid Scatter", shear: 0, band: 0.235, scatter: true,
    panels: [
      rect(0.03, 0.03, 0.5, 0.62, { rot: -4, frame: true }),
      rect(0.52, 0.02, 0.42, 0.5, { rot: 3.5, frame: true }),
      rect(0.55, 0.42, 0.4, 0.33, { rot: -2, frame: true }),
    ],
  },
  {
    id: "diagonal-duo", name: "Diagonal Duo", shear: 0, band: 0.235, diagonal: true,
    panels: [rect(0, 0, 1, 0.765), rect(0, 0, 1, 0.765)],
  },
  {
    id: "film-strip", name: "Film Strip", shear: 0, band: 0.235, strip: true,
    panels: [
      rect(0.045, 0.012, 0.91, 0.177), rect(0.045, 0.201, 0.91, 0.177),
      rect(0.045, 0.39, 0.91, 0.177), rect(0.045, 0.579, 0.91, 0.177),
    ],
  },
  {
    id: "full-bleed", name: "Full Bleed + Inset", shear: 0, band: 0, bleed: true,
    panels: [
      rect(0, 0, 1, 1),
      rect(0.665, 0.475, 0.30, 0.27, { frame: true }),
    ],
  },
];

export function layoutById(id) {
  return PANEL_LAYOUTS.find((l) => l.id === id) ?? PANEL_LAYOUTS[0];
}

// The four corners of a panel as a polygon in cover pixels. Shear shifts x by
// (centreY - y) * shear * height, so vertical edges lean while the panel area
// as a whole stays inside the cover.
export function panelPolygon(panel, layout, width, height) {
  const areaH = height * (1 - (layout.band || 0));
  const cx = (panel.x + panel.w / 2) * width;
  const cy = (panel.y + panel.h / 2) * height;
  const shear = (layout.shear || 0);
  const corners = [
    [panel.x, panel.y], [panel.x + panel.w, panel.y],
    [panel.x + panel.w, panel.y + panel.h], [panel.x, panel.y + panel.h],
  ].map(([nx, ny]) => {
    let px = nx * width + (0.3825 - ny) * shear * areaH;
    let py = ny * height;
    if (panel.rot) {
      const rad = (panel.rot * Math.PI) / 180;
      const dx = px - cx, dy = py - cy;
      px = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
      py = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
    }
    return [px, py];
  });
  return { points: corners, cx, cy };
}

export function layoutPanelsForSize(layout, width, height) {
  return layout.panels.map((panel) => panelPolygon(panel, layout, width, height));
}

// Title-safe zone: the lettering band plus, for the bleed layout, a scrim
// strip at the foot of the photo. Faces belong above this line.
export function titleSafeBottom(layout, height) {
  return height * (1 - (layout.band || 0.235));
}

export function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
