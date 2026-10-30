import { P } from "./palette.js";

export const FONT_FAMILY = '"Fusion Pixel 12px Prop zh-Hans"';
const FONT = `12px ${FONT_FAMILY}`;

export function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

export function rect(ctx, x, y, w, h, color) {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const rw = Math.round(x + w) - x0;
  const rh = Math.round(y + h) - y0;
  if (rw <= 0 || rh <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x0, y0, rw, rh);
}

export function frame(ctx, x, y, w, h, color, t = 1) {
  rect(ctx, x, y, w, t, color);
  rect(ctx, x, y + h - t, w, t, color);
  rect(ctx, x, y + t, t, h - t * 2, color);
  rect(ctx, x + w - t, y + t, t, h - t * 2, color);
}

// corner[i] is how far row i (from the top and from the bottom) is pulled in
export function box(ctx, x, y, w, h, color, corner = [1]) {
  const n = Math.min(corner.length, Math.floor(h / 2));
  for (let i = 0; i < n; i += 1) {
    rect(ctx, x + corner[i], y + i, w - corner[i] * 2, 1, color);
    rect(ctx, x + corner[i], y + h - 1 - i, w - corner[i] * 2, 1, color);
  }
  rect(ctx, x, y + n, w, h - n * 2, color);
}

export function ellipse(ctx, cx, cy, rx, ry, color) {
  if (rx <= 0 || ry <= 0) return;
  ctx.fillStyle = color;
  const top = Math.floor(cy - ry);
  const bottom = Math.ceil(cy + ry);
  for (let y = top; y < bottom; y += 1) {
    const dy = (y + 0.5 - cy) / ry;
    if (dy <= -1 || dy >= 1) continue;
    const half = rx * Math.sqrt(1 - dy * dy);
    const x0 = Math.round(cx - half);
    const x1 = Math.round(cx + half);
    if (x1 > x0) ctx.fillRect(x0, y, x1 - x0, 1);
  }
}

// a horizontal slice per row, linearly between two spans
export function trapezoid(ctx, y0, y1, topL, topR, botL, botR, color) {
  const h = y1 - y0;
  if (h <= 0) return;
  ctx.fillStyle = color;
  for (let y = Math.round(y0); y < Math.round(y1); y += 1) {
    const u = (y - y0 + 0.5) / h;
    const l = Math.round(topL + (botL - topL) * u);
    const r = Math.round(topR + (botR - topR) * u);
    if (r > l) ctx.fillRect(l, y, r - l, 1);
  }
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const patterns = new Map();

export function pattern(ctx, color, level) {
  const key = `${color}:${level}`;
  let pat = patterns.get(key);
  if (!pat) {
    const c = canvas(4, 4);
    const g = c.getContext("2d");
    g.fillStyle = color;
    for (let i = 0; i < 16; i += 1) {
      if (BAYER[i] < level) g.fillRect(i % 4, Math.floor(i / 4), 1, 1);
    }
    pat = ctx.createPattern(c, "repeat");
    patterns.set(key, pat);
  }
  return pat;
}

// level: 0 (nothing) .. 16 (solid)
export function dither(ctx, x, y, w, h, color, level) {
  const lv = Math.round(level);
  if (lv <= 0) return;
  if (lv >= 16) {
    rect(ctx, x, y, w, h, color);
    return;
  }
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const rw = Math.round(x + w) - x0;
  const rh = Math.round(y + h) - y0;
  if (rw <= 0 || rh <= 0) return;
  ctx.fillStyle = pattern(ctx, color, lv);
  ctx.fillRect(x0, y0, rw, rh);
}

export function ditherEllipse(ctx, cx, cy, rx, ry, color, level) {
  const lv = Math.round(level);
  if (lv <= 0) return;
  ellipse(ctx, cx, cy, rx, ry, lv >= 16 ? color : pattern(ctx, color, lv));
}

export function lit(ctx, alpha, fn, mode = "lighter") {
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  fn();
  ctx.restore();
}

// stepped radial light: each band adds the same amount
export function glow(ctx, cx, cy, rx, ry, color, alpha = 0.16, bands = 3) {
  if (alpha <= 0) return;
  lit(ctx, alpha, () => {
    for (let i = 0; i < bands; i += 1) {
      const f = 1 - i / bands;
      ellipse(ctx, cx, cy, rx * f, ry * f, color);
    }
  });
}

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// swap exact palette colours in place, e.g. to make a torch-lit copy of a layer
export function recolor(c, map) {
  const g = c.getContext("2d");
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const table = new Map(Object.entries(map).map(([from, to]) => [parseInt(from.slice(1), 16), hexRgb(to)]));
  for (let i = 0; i < d.length; i += 4) {
    const to = table.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    if (to) {
      d[i] = to[0];
      d[i + 1] = to[1];
      d[i + 2] = to[2];
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

// deterministic noise for scattering details
export function hash(x, y = 0, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function steps(t, n) {
  const u = Math.max(0, Math.min(1, t));
  return Math.round(u * n) / n;
}

let fontReady = typeof document === "undefined" || !document.fonts?.load;
const textCache = new Map();

if (!fontReady) {
  document.fonts.load(FONT, "甲乙丙你咩相同不同处决赦免").then(
    () => {
      fontReady = true;
      textCache.clear();
    },
    () => {
      fontReady = true;
    },
  );
}

function tint(mask, color) {
  const c = canvas(mask.width, mask.height);
  const g = c.getContext("2d");
  g.drawImage(mask, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

function glyphs(str) {
  const probe = canvas(1, 1).getContext("2d");
  probe.font = FONT;
  const w = Math.ceil(probe.measureText(str).width) + 2;
  const c = canvas(w, 14);
  const g = c.getContext("2d");
  g.font = FONT;
  g.textBaseline = "top";
  g.fillStyle = "#fff";
  g.fillText(str, 1, 1);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const on = d[i + 3] >= 128;
    d[i] = 255;
    d[i + 1] = 255;
    d[i + 2] = 255;
    d[i + 3] = on ? 255 : 0;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function textImage(str, color = P.white, outline = P.ink) {
  if (!fontReady) return null;
  const key = `${str}|${color}|${outline}`;
  let out = textCache.get(key);
  if (out) return out;
  const mask = glyphs(str);
  out = canvas(mask.width + 2, mask.height + 2);
  const g = out.getContext("2d");
  if (outline) {
    const o = tint(mask, outline);
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2], [0, 0], [2, 0], [0, 2], [2, 2]]) {
      g.drawImage(o, dx, dy);
    }
  }
  g.drawImage(tint(mask, color), 1, 1);
  textCache.set(key, out);
  return out;
}

export function text(ctx, str, x, y, opts = {}) {
  const img = textImage(str, opts.color, opts.outline === undefined ? P.ink : opts.outline);
  if (!img) return 0;
  const align = opts.align || "center";
  const dx = align === "center" ? Math.round(x - img.width / 2) : align === "right" ? Math.round(x - img.width) : Math.round(x);
  ctx.drawImage(img, dx, Math.round(y));
  return img.width;
}

export function textWidth(str) {
  const img = textImage(str, P.white, P.ink);
  return img ? img.width : str.length * 12;
}
