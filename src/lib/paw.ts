/** Rotated ellipse as a cubic-bezier path (used for the toe beans). */
function toe(cx: number, cy: number, rx: number, ry: number, deg: number) {
  const a = (deg * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  const p = (x: number, y: number) => `${(cx + x * c - y * s).toFixed(2)} ${(cy + x * s + y * c).toFixed(2)}`;
  const k = 0.5523;
  return `M${p(rx, 0)}C${p(rx, k * ry)} ${p(k * rx, ry)} ${p(0, ry)}C${p(-(k * rx), ry)} ${p(-rx, k * ry)} ${p(-rx, 0)}C${p(-rx, -(k * ry))} ${p(-(k * rx), -ry)} ${p(0, -ry)}C${p(k * rx, -ry)} ${p(rx, -(k * ry))} ${p(rx, 0)}Z`;
}

/** The TeddyPups paw print, in a 64×64 box. */
export const PAW_PATH =
  "M32 30.5c-7.6 0-15.6 8.3-15.6 15.5 0 5.4 4.2 8.3 9.2 8.3 2.6 0 4.5-1.1 6.4-1.1s3.8 1.1 6.4 1.1c5 0 9.2-2.9 9.2-8.3 0-7.2-8-15.5-15.6-15.5z" +
  toe(14.6, 29.2, 5.3, 6.9, -28) +
  toe(24.2, 16.6, 5.5, 7.3, -10) +
  toe(39.8, 16.6, 5.5, 7.3, 10) +
  toe(49.4, 29.2, 5.3, 6.9, 28);
