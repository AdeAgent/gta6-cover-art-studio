// Colour grades as gradient maps. Each grade is a set of colour stops over
// luminance; buildGradientMap bakes it into a 256-entry lookup table, and
// gradePanel runs a panel's pixels through the table plus a contrast curve.

export const COLOR_GRADES = [
  { id: "sunset-strip", name: "Sunset Strip", contrast: 1.12, lift: 0.02,
    stops: [[0, "#160a2e"], [0.28, "#5c1458"], [0.52, "#c22a6d"], [0.74, "#f2663c"], [0.9, "#ffb347"], [1, "#fff3d6"]] },
  { id: "neon-night", name: "Neon Night", contrast: 1.18, lift: 0.0,
    stops: [[0, "#02141f"], [0.3, "#0b3b5c"], [0.52, "#7a1e6e"], [0.72, "#e83e8c"], [0.88, "#37e0d0"], [1, "#eafffb"]] },
  { id: "golden-hour", name: "Golden Hour", contrast: 1.06, lift: 0.03,
    stops: [[0, "#1d0f04"], [0.3, "#5e2f10"], [0.55, "#b06a24"], [0.78, "#eda83e"], [1, "#fff0c2"]] },
  { id: "coral-teal", name: "Coral Teal", contrast: 1.1, lift: 0.02,
    stops: [[0, "#06222b"], [0.32, "#0f5f6b"], [0.55, "#4fae9d"], [0.76, "#f2a65a"], [0.9, "#ff7e5f"], [1, "#ffe8d6"]] },
  { id: "noir-ink", name: "Noir Ink", contrast: 1.28, lift: -0.02,
    stops: [[0, "#050505"], [0.35, "#3a3a3c"], [0.62, "#8e8e93"], [0.85, "#d8d4c8"], [1, "#fdf6e3"]] },
  { id: "retro-print", name: "Retro Print", contrast: 0.94, lift: 0.09,
    stops: [[0, "#2b2135"], [0.3, "#6e4a5e"], [0.55, "#c47a5a"], [0.8, "#eebd7a"], [1, "#f7ead1"]] },
];

export function gradeById(id) {
  return COLOR_GRADES.find((g) => g.id === id) ?? COLOR_GRADES[0];
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const lutCache = new Map();

// Bake a grade into three 256-entry channel tables, contrast curve included.
export function buildGradientMap(grade) {
  if (lutCache.has(grade.id)) return lutCache.get(grade.id);
  const stops = grade.stops.map(([pos, hex]) => [pos, hexToRgb(hex)]);
  const table = { r: new Uint8ClampedArray(256), g: new Uint8ClampedArray(256), b: new Uint8ClampedArray(256) };
  for (let v = 0; v < 256; v++) {
    let t = v / 255;
    t = Math.min(1, Math.max(0, (t - 0.5) * grade.contrast + 0.5 + grade.lift));
    let a = stops[0], b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (const [ch, key] of [[0, "r"], [1, "g"], [2, "b"]]) {
      table[key][v] = Math.round(a[1][ch] + (b[1][ch] - a[1][ch]) * f);
    }
  }
  lutCache.set(grade.id, table);
  return table;
}

// Run a canvas's pixels through a grade in place. Luminance picks the mapped
// colour, then the original chroma is blended back a little so skin and
// saturated objects keep some of themselves (a pure duotone looks printed;
// 0.35 of the original colour keeps it photographic).
export function applyGradeToCanvas(canvas, grade) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  if (!width || !height) return;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const lut = buildGradientMap(grade);
  const keep = 0.35;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
    d[i] = lut.r[lum] * (1 - keep) + d[i] * keep;
    d[i + 1] = lut.g[lum] * (1 - keep) + d[i + 1] * keep;
    d[i + 2] = lut.b[lum] * (1 - keep) + d[i + 2] * keep;
  }
  ctx.putImageData(img, 0, 0);
}

// A CSS gradient string for a grade's swatch in the picker.
export function gradeSwatchCss(grade) {
  return `linear-gradient(100deg, ${grade.stops.map(([, hex]) => hex).join(", ")})`;
}
