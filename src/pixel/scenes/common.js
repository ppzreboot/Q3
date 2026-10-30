import { P } from "../palette.js";
import { box, canvas, hash, recolor, rect, text, textWidth } from "../gfx.js";

export const W = 480;
export const H = 270;
// the part of the 480×270 design that must always stay on screen
export const SAFE = { w: 400, h: 236 };

// ms since `active` last became true; -1 while inactive
export function since(anim, key, active, now, still) {
  if (!active) {
    anim[key] = null;
    return -1;
  }
  if (anim[key] == null) anim[key] = now;
  return still ? 1e9 : now - anim[key];
}

// true the first time it is asked within a round
export function once(anim, key) {
  if (anim[`once:${key}`]) return false;
  anim[`once:${key}`] = true;
  return true;
}

export function progress(elapsed, delay, duration) {
  if (elapsed < 0) return 0;
  return Math.max(0, Math.min(1, (elapsed - delay) / duration));
}

const layers = new Map();

// a layer that only changes with the visible area, painted in design coordinates
export function cached(name, f, paint) {
  const w = f.vx1 - f.vx0;
  const h = f.vy1 - f.vy0;
  const key = `${name}:${f.vx0}:${f.vy0}:${w}:${h}`;
  let layer = layers.get(name);
  if (!layer || layer.key !== key) {
    const c = canvas(w, h);
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.setTransform(1, 0, 0, 1, -f.vx0, -f.vy0);
    paint(g, c);
    layer = { key, canvas: c };
    layers.set(name, layer);
  }
  return layer.canvas;
}

// a recoloured copy of a cached layer, rebuilt with it
export function variant(name, f, source, map) {
  return cached(name, f, (g, c) => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(source, 0, 0);
    recolor(c, map);
  });
}

const scratch = { layer: null, mask: null };

function fresh(c, w, h) {
  if (!c || c.width !== w || c.height !== h) return canvas(w, h);
  const g = c.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
  g.clearRect(0, 0, w, h);
  return c;
}

// draw `layer` only where `mask` paints (mask is drawn in design coordinates)
export function through(ctx, f, layer, mask) {
  const w = f.vx1 - f.vx0;
  const h = f.vy1 - f.vy0;
  scratch.mask = fresh(scratch.mask, w, h);
  const m = scratch.mask.getContext("2d");
  m.setTransform(1, 0, 0, 1, -f.vx0, -f.vy0);
  mask(m);
  scratch.layer = fresh(scratch.layer, w, h);
  const g = scratch.layer.getContext("2d");
  g.drawImage(layer, 0, 0);
  g.globalCompositeOperation = "destination-in";
  g.drawImage(scratch.mask, 0, 0);
  g.globalCompositeOperation = "source-over";
  ctx.drawImage(scratch.layer, f.vx0, f.vy0);
}

export function tag(ctx, str, cx, y, opts = {}) {
  const { color = P.white, border = P.steel, bg = P.ink } = opts;
  const w = textWidth(str) + 2;
  const h = 15;
  const x = Math.round(cx - w / 2);
  box(ctx, x - 1, y - 1, w + 2, h + 2, P.ink, [1]);
  box(ctx, x, y, w, h, border, [1]);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, bg);
  text(ctx, str, cx, y, { color, outline: null });
}

// speech bubble whose tail points down at (tx, ty)
export function bubble(ctx, str, tx, ty, opts = {}) {
  const { color = P.ink, bg = P.white, edge = P.ink } = opts;
  const w = textWidth(str) + 4;
  const h = 16;
  const x = Math.round(tx - w / 2);
  const y = ty - h - 3;
  box(ctx, x - 1, y - 1, w + 2, h + 2, edge, [2, 1]);
  box(ctx, x, y, w, h, bg, [1]);
  rect(ctx, tx - 1, y + h, 3, 1, bg);
  rect(ctx, tx - 2, y + h, 1, 1, edge);
  rect(ctx, tx + 2, y + h, 1, 1, edge);
  rect(ctx, tx, y + h + 1, 1, 1, bg);
  rect(ctx, tx - 1, y + h + 1, 1, 1, edge);
  rect(ctx, tx + 1, y + h + 1, 1, 1, edge);
  rect(ctx, tx, y + h + 2, 1, 1, edge);
  text(ctx, str, tx, y + 1, { color, outline: null });
}

const CONFETTI = [P.red, P.amber, P.yellow, P.green, P.blue, P.cyan, P.mauve, P.white, P.salmon];

export function confetti(ctx, elapsed, x0, x1, top, bottom, count = 110) {
  if (elapsed < 0) return;
  const t = elapsed / 1000;
  for (let i = 0; i < count; i += 1) {
    const tt = t - hash(i, 1) * 2.4;
    if (tt < 0) continue;
    const speed = 26 + hash(i, 2) * 34;
    const y = top + tt * speed;
    if (y > bottom) continue;
    const x = x0 + hash(i, 3) * (x1 - x0) + Math.sin(tt * (2 + hash(i, 4) * 3) + i) * 7;
    piece(ctx, x, y, i, tt);
  }
}

function piece(ctx, x, y, i, tt) {
  const turn = Math.floor(tt * 9 + i) % 4;
  ctx.fillStyle = CONFETTI[i % CONFETTI.length];
  if (turn === 0) ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
  else if (turn === 1) ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
  else if (turn === 2) ctx.fillRect(Math.round(x), Math.round(y), 1, 2);
  else ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

// a cannon at (x0, y0) firing up and toward `dir` (+1 right, -1 left)
export function cannon(ctx, elapsed, x0, y0, dir, bottom, count = 70, seed = 0) {
  if (elapsed < 0) return;
  const t = elapsed / 1000;
  const g = 170;
  const fall = 34;
  for (let i = 0; i < count; i += 1) {
    const tt = t - hash(i, seed, 1) * 0.35;
    if (tt < 0) continue;
    const ang = (58 + hash(i, seed, 2) * 30) * (Math.PI / 180);
    const v = 150 + hash(i, seed, 3) * 110;
    const vx = Math.cos(ang) * v * dir;
    const vy = Math.sin(ang) * v;
    const cap = (fall + vy) / g;
    let y;
    if (tt < cap) y = y0 - vy * tt + 0.5 * g * tt * tt;
    else y = y0 - vy * cap + 0.5 * g * cap * cap + fall * (tt - cap);
    if (y > bottom) continue;
    const k = 1.6;
    const x = x0 + (vx * (1 - Math.exp(-k * tt))) / k + (tt > cap ? Math.sin(tt * 4 + i) * 5 : 0);
    piece(ctx, x, y, i + seed, tt);
  }
}

// four-point glint
export function twinkle(ctx, x, y, size, color = P.white, core = P.yellow) {
  if (size <= 0) return;
  rect(ctx, x - size, y, size * 2 + 1, 1, color);
  rect(ctx, x, y - size, 1, size * 2 + 1, color);
  if (size > 1) rect(ctx, x, y, 1, 1, core);
}
