/** Keep a regular two-column phone grid; larger text gets a readable single column. */
export function cardGridLayout(width: number, fontScale = 1, pixelScale = 1) {
  const usable = Number.isFinite(width) ? Math.max(0, width) : 0;
  const columns = fontScale > 1.35 || usable < 260 ? 1 : usable >= 960 ? 4 : usable >= 680 ? 3 : 2;
  const scale = Number.isFinite(pixelScale) && pixelScale > 0 ? pixelScale : 1;
  const cellWidth = Math.floor(Math.max(0, (usable - 12 * (columns - 1)) / columns) * scale) / scale;
  return { columns, cellWidth };
}
