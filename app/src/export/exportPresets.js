// The six post sizes the studio exports. The first three are the ones the
// bounty names; story, landscape and banner cover the rest of a feed.

export const EXPORT_SIZES = [
  { id: "square", label: "Square · 1080 × 1080", w: 1080, h: 1080 },
  { id: "portrait", label: "Portrait · 1080 × 1350", w: 1080, h: 1350 },
  { id: "wide", label: "Wide · 1920 × 1080", w: 1920, h: 1080 },
  { id: "story", label: "Story · 1080 × 1920", w: 1080, h: 1920 },
  { id: "landscape", label: "Landscape · 1200 × 675", w: 1200, h: 675 },
  { id: "banner", label: "Banner · 1500 × 500", w: 1500, h: 500 },
];

export function sizeById(id) {
  return EXPORT_SIZES.find((s) => s.id === id) ?? EXPORT_SIZES[2];
}

export function fileSlug(text) {
  const slug = String(text || "cover").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "cover";
}
