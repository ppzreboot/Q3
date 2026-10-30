import { P } from "../palette.js";
import { box, canvas, ellipse, frame, glow, hash, lit, rect, steps, trapezoid } from "../gfx.js";
import { blit } from "../sprite.js";
import { CAR, DIGITS, GOAT, GOAT_BLEAT, GOAT_BLINK, HOST, HOST_POINT, STAR } from "../sprites.js";
import { bubble, cached, cannon, confetti, once, progress, since, tag, twinkle } from "./common.js";

const FLOOR = 198;
const LIP = 224;
const CX = [136, 240, 344];
const FRAME_HALF = 42;
const FRAME_TOP = 58;
const DOOR_HALF = 36;
const DOOR_TOP = 84;
const LEAF_W = DOOR_HALF * 2;
const LEAF_H = FLOOR - DOOR_TOP;
const HOST_X = 394;
const HOST_FEET = 219;
const ARCH = { rx: 192, ry: 150 };
const CURTAIN = 32;

export function hits(view) {
  if (!view?.interactive) return [];
  return CX.map((cx, index) => ({
    index,
    x: cx - FRAME_HALF,
    y: FRAME_TOP,
    w: FRAME_HALF * 2,
    h: FLOOR - FRAME_TOP + 4,
  }));
}

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function sunburst(g, f) {
  const w = f.vx1 - f.vx0;
  const h = Math.min(f.vy1, FLOOR) - f.vy0;
  if (w <= 0 || h <= 0) return;
  const img = g.createImageData(w, h);
  const d = img.data;
  const dark = [P.ink, P.ink, P.night, P.night].map(rgb);
  const light = [P.ink, P.night, P.dusk, P.navy].map(rgb);
  for (let py = 0; py < h; py += 1) {
    const y = f.vy0 + py;
    for (let px = 0; px < w; px += 1) {
      const x = f.vx0 + px;
      const dx = x - 240;
      const dy = (y - 150) * 1.3;
      const r = Math.sqrt(dx * dx + dy * dy);
      const ray = Math.floor((Math.atan2(dy, dx) / (Math.PI * 2) + 1) * 36) & 1;
      const th = BAYER[((y & 3) << 2) | (x & 3)] / 16;
      const lv = Math.max(0, Math.min(3, Math.floor(Math.max(0, 1 - r / 330) * 3.6 + th - 0.4)));
      const c = ray ? light[lv] : dark[lv];
      const o = (py * w + px) * 4;
      d[o] = c[0];
      d[o + 1] = c[1];
      d[o + 2] = c[2];
      d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

function archPoint(theta) {
  return [240 + ARCH.rx * Math.cos(theta), FLOOR - ARCH.ry * Math.sin(theta)];
}

function curtain(g, x0, x1, y0, y1, side) {
  for (let x = x0; x < x1; x += 1) {
    const k = (((x - x0) % 11) + 11) % 11;
    const color = k < 2 ? P.umber : k < 4 ? P.crimson : k < 7 ? P.red : k < 8 ? P.salmon : P.crimson;
    rect(g, x, y0, 1, y1 - y0, color);
  }
  const edge = side === "left" ? x1 - 3 : x0;
  rect(g, edge, y0, 3, y1 - y0, P.amber);
  rect(g, side === "left" ? x1 - 3 : x0 + 2, y0, 1, y1 - y0, P.copper);
  rect(g, side === "left" ? x1 : x0 - 1, y0, 1, y1 - y0, P.ink);
  const ropeY = 146;
  rect(g, x0, ropeY, x1 - x0, 4, P.amber);
  rect(g, x0, ropeY, x1 - x0, 1, P.yellow);
  rect(g, x0, ropeY + 3, x1 - x0, 1, P.copper);
  const knot = side === "left" ? x1 - 6 : x0 + 2;
  rect(g, knot, ropeY - 1, 4, 6, P.amber);
  rect(g, knot + 1, ropeY + 5, 2, 9, P.amber);
  rect(g, knot, ropeY + 13, 4, 3, P.copper);
}

function backdrop(g, f) {
  sunburst(g, f);
  const w = f.vx1 - f.vx0;

  // the arch the chase lights hang on
  for (let i = 0; i <= 260; i += 1) {
    const [x, y] = archPoint(Math.PI - (i / 260) * Math.PI);
    rect(g, x - 1, y - 1, 3, 3, P.umber);
  }
  for (let i = 0; i <= 260; i += 1) {
    const [x, y] = archPoint(Math.PI - (i / 260) * Math.PI);
    rect(g, x, y, 1, 1, P.copper);
  }

  // back wall meets the stage
  rect(g, f.vx0, FLOOR - 8, w, 8, P.ink);
  rect(g, f.vx0, FLOOR - 9, w, 1, P.night);

  // valance
  const vTop = Math.min(f.vy0, 0);
  rect(g, f.vx0, vTop, w, 22 - vTop, P.crimson);
  for (let x = Math.floor(f.vx0 / 12) * 12; x < f.vx1; x += 12) {
    rect(g, x, vTop, 3, 22 - vTop, P.red);
    rect(g, x + 3, vTop, 1, 22 - vTop, P.salmon);
    rect(g, x + 8, vTop, 2, 22 - vTop, P.umber);
  }
  for (let x = f.vx0; x < f.vx1; x += 1) {
    const u = ((((x - 12) % 48) + 48) % 48) / 24 - 1;
    const sag = Math.round(8 * (1 - u * u));
    rect(g, x, 22, 1, sag, (x & 7) < 2 ? P.red : P.crimson);
    rect(g, x, 22 + sag, 1, 2, P.amber);
    rect(g, x, 24 + sag, 1, 1, P.copper);
    if ((x & 1) === 0) rect(g, x, 25 + sag, 1, 2, P.copper);
  }
  for (let x = Math.floor((f.vx0 - 12) / 48) * 48 + 12; x < f.vx1 + 48; x += 48) {
    rect(g, x - 2, 20, 5, 4, P.amber);
    rect(g, x - 1, 24, 3, 6, P.amber);
    rect(g, x - 2, 30, 5, 4, P.copper);
    rect(g, x - 1, 24, 1, 6, P.yellow);
  }
  rect(g, f.vx0, 4, w, 2, P.amber);
  rect(g, f.vx0, 4, w, 1, P.yellow);

  // light cans
  for (const cx of CX) {
    rect(g, cx - 1, 26, 3, 6, P.ink);
    box(g, cx - 6, 30, 13, 8, P.ink, [1]);
    rect(g, cx - 5, 31, 11, 5, P.dusk);
    rect(g, cx - 5, 31, 11, 1, P.slate);
    rect(g, cx - 4, 36, 9, 2, P.yellow);
  }

  curtain(g, f.vx0, f.vx0 + CURTAIN, f.vy0, FLOOR + 2, "left");
  curtain(g, f.vx1 - CURTAIN, f.vx1, f.vy0, FLOOR + 2, "right");
}

let leafImage = null;

function panel(g, x, y, w, h) {
  rect(g, x, y, w, h, P.crimson);
  rect(g, x + 2, y + 2, w - 3, h - 3, P.red);
  rect(g, x + 1, y + h - 1, w - 1, 1, P.salmon);
  rect(g, x + w - 1, y + 1, 1, h - 1, P.salmon);
  frame(g, x + 5, y + 5, w - 10, h - 10, P.amber);
  rect(g, x + 5, y + 5, w - 10, 1, P.yellow);
}

function leaf() {
  if (leafImage) return leafImage;
  const c = canvas(LEAF_W, LEAF_H);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  rect(g, 0, 0, LEAF_W, LEAF_H, P.red);
  rect(g, 0, 0, LEAF_W, 1, P.salmon);
  rect(g, 0, 0, 1, LEAF_H, P.salmon);
  rect(g, LEAF_W - 2, 0, 2, LEAF_H, P.crimson);
  rect(g, 0, LEAF_H - 3, LEAF_W, 3, P.crimson);
  panel(g, 9, 9, LEAF_W - 18, 42);
  panel(g, 9, 59, LEAF_W - 18, 44);
  blit(g, STAR, LEAF_W / 2 - 4, 27);
  rect(g, LEAF_W - 14, 51, 6, 7, P.ink);
  rect(g, LEAF_W - 13, 52, 4, 5, P.amber);
  rect(g, LEAF_W - 13, 52, 2, 2, P.yellow);
  rect(g, LEAF_W - 10, 55, 1, 2, P.orange);
  leafImage = c;
  return c;
}

function drawLeaf(ctx, cx, theta, hover) {
  const img = leaf();
  const x0 = cx - DOOR_HALF;
  const s = Math.sin(theta);
  const w = Math.max(6, Math.round(LEAF_W * Math.cos(theta)));
  const e = Math.round(5 * s);
  const cols = [];
  for (let i = 0; i < w; i += 1) {
    const u = (i + 0.5) / w;
    const sx = Math.min(LEAF_W - 1, Math.floor(u * LEAF_W));
    const top = DOOR_TOP - Math.round(e * u);
    const bottom = FLOOR + Math.round(e * u);
    ctx.drawImage(img, sx, 0, 1, LEAF_H, x0 + i, top, 1, bottom - top);
    cols.push([x0 + i, top, bottom - top]);
  }
  if (s > 0.01) {
    ctx.save();
    ctx.globalAlpha = 0.6 * s;
    ctx.fillStyle = P.ink;
    for (const [x, y, h] of cols) ctx.fillRect(x, y, 1, h);
    ctx.restore();
    const [ex, ey, eh] = cols[cols.length - 1];
    rect(ctx, ex + 1, ey, 1, eh, P.ink);
  }
  if (hover && s < 0.01) lit(ctx, 0.1, () => rect(ctx, x0, DOOR_TOP, LEAF_W, LEAF_H, P.white));
}

function interior(ctx, i, door, t, opened) {
  const cx = CX[i];
  const x = cx - DOOR_HALF;
  rect(ctx, x, DOOR_TOP, LEAF_W, LEAF_H, P.night);
  for (let k = 0; k < LEAF_W; k += 8) rect(ctx, x + k, DOOR_TOP, 3, LEAF_H - 16, P.ink);
  rect(ctx, x, DOOR_TOP, LEAF_W, 8, P.ink);
  rect(ctx, x, FLOOR - 16, LEAF_W, 16, P.dusk);
  rect(ctx, x, FLOOR - 16, LEAF_W, 1, P.slate);
  rect(ctx, x, FLOOR - 4, LEAF_W, 4, P.night);
  lit(ctx, 0.09, () => trapezoid(ctx, DOOR_TOP + 4, FLOOR - 6, cx - 6, cx + 6, cx - 30, cx + 30, P.white));
  lit(ctx, 0.07, () => trapezoid(ctx, DOOR_TOP + 4, FLOOR - 6, cx - 3, cx + 3, cx - 18, cx + 18, P.white));
  glow(ctx, cx, FLOOR - 9, 30, 5, door.celebrate ? P.yellow : P.silver, 0.14, 3);
  if (door.content === "goat") {
    const cycle = (t + i * 1.7) % 3.4;
    const bleating = opened > 0.9 && cycle < 1.1;
    const blinking = !bleating && cycle > 2.6 && cycle < 2.75;
    const def = bleating ? GOAT_BLEAT : blinking ? GOAT_BLINK : GOAT;
    ellipse(ctx, cx + 2, FLOOR - 7, 14, 2, P.ink);
    blit(ctx, def, cx - 12, FLOOR - 27);
    return bleating;
  }
  if (door.content === "car") {
    ellipse(ctx, cx, FLOOR - 6, 28, 3, P.ink);
    blit(ctx, CAR, cx - 26, FLOOR - 26);
  }
  return false;
}

function bulbs(ctx, cx, mode, t) {
  const spots = [];
  for (let x = cx - 38; x <= cx + 38; x += 8) spots.push([x, FRAME_TOP + 2]);
  for (let y = FRAME_TOP + 10; y <= FLOOR - 6; y += 8) {
    spots.push([cx - FRAME_HALF + 2, y]);
    spots.push([cx + FRAME_HALF - 4, y]);
  }
  spots.forEach(([x, y], k) => {
    let on = false;
    if (mode === "chase") on = (k + Math.floor(t * 9)) % 4 !== 0;
    else if (mode === "rush") on = (k + Math.floor(t * 24)) % 3 === 0;
    else if (mode === "flash") on = (k + Math.floor(t * 6)) % 2 === 0;
    else if (mode === "on") on = true;
    rect(ctx, x, y, 2, 2, on ? P.yellow : P.copper);
    if (on) rect(ctx, x, y, 1, 1, P.white);
  });
}

function drawFrame(ctx, i, mode, t) {
  const cx = CX[i];
  const x = cx - FRAME_HALF;
  const w = FRAME_HALF * 2;
  const h = FLOOR - FRAME_TOP;
  rect(ctx, x - 1, FRAME_TOP - 1, w + 2, h + 1, P.ink);
  rect(ctx, x, FRAME_TOP, w, h, P.amber);
  rect(ctx, x, FRAME_TOP, w, 1, P.yellow);
  rect(ctx, x, FRAME_TOP, 1, h, P.yellow);
  rect(ctx, x + w - 1, FRAME_TOP, 1, h, P.orange);
  rect(ctx, x + 5, FRAME_TOP + 5, w - 10, h - 5, P.copper);
  rect(ctx, x + 6, FRAME_TOP + 6, w - 12, h - 6, P.ink);
  // name plate
  box(ctx, cx - 30, FRAME_TOP + 7, 60, 18, P.night, [1]);
  rect(ctx, cx - 29, FRAME_TOP + 8, 58, 1, P.dusk);
  rect(ctx, cx - 30, FRAME_TOP + 24, 60, 1, P.ink);
  blit(ctx, DIGITS[i + 1], cx - 3, FRAME_TOP + 10);
  for (const side of [-1, 1]) {
    const bx = cx + side * 20 - 1;
    const on = mode !== "off" && (mode !== "chase" || Math.floor(t * 3 + i) % 2 === 0);
    rect(ctx, bx, FRAME_TOP + 14, 3, 3, on ? P.yellow : P.copper);
    if (on) rect(ctx, bx, FRAME_TOP + 14, 1, 1, P.white);
  }
  rect(ctx, x + 6, DOOR_TOP - 2, w - 12, 2, P.amber);
  rect(ctx, x + 6, DOOR_TOP - 2, w - 12, 1, P.yellow);
  bulbs(ctx, cx, mode, t);
}

// a pulsing gold rim around the player's door
function halo(ctx, i, t, still) {
  const x = CX[i] - FRAME_HALF - 3;
  const y = FRAME_TOP - 3;
  const w = FRAME_HALF * 2 + 6;
  const h = FLOOR - y;
  const color = still || Math.floor(t * 4) % 2 ? P.yellow : P.white;
  glow(ctx, CX[i], (FRAME_TOP + FLOOR) / 2, FRAME_HALF + 16, (FLOOR - FRAME_TOP) / 2 + 12, P.yellow, 0.05, 2);
  rect(ctx, x - 1, y - 1, w + 2, 1, P.ink);
  rect(ctx, x - 1, y, 1, h, P.ink);
  rect(ctx, x + w, y, 1, h, P.ink);
  rect(ctx, x, y, w, 2, color);
  rect(ctx, x, y, 2, h, color);
  rect(ctx, x + w - 2, y, 2, h, color);
}

// "your pick" label with a little pointer under it
function pickTag(ctx, str, cx, y) {
  tag(ctx, str, cx, y, { color: P.ink, border: P.amber, bg: P.yellow });
  for (let r = 0; r < 4; r += 1) {
    const half = 3 - r;
    rect(ctx, cx - half - 1, y + 16 + r, 1, 1, P.ink);
    rect(ctx, cx + half + 1, y + 16 + r, 1, 1, P.ink);
    rect(ctx, cx - half, y + 16 + r, half * 2 + 1, 1, P.yellow);
  }
  rect(ctx, cx, y + 20, 1, 1, P.ink);
}

function floor(ctx, f) {
  const w = f.vx1 - f.vx0;
  for (let y = FLOOR; y < LIP; y += 5) {
    const row = (y - FLOOR) / 5;
    rect(ctx, f.vx0, y, w, 5, P.umber);
    rect(ctx, f.vx0, y, w, 1, P.brown);
    rect(ctx, f.vx0, y + 4, w, 1, P.ink);
    const start = Math.floor(f.vx0 / 46) * 46 + (row % 2) * 23;
    for (let x = start; x < f.vx1; x += 46) rect(ctx, x, y + 1, 1, 3, P.ink);
  }
}

function reflect(ctx, f, rows, alpha) {
  const src = f.canvas;
  const sy = FLOOR - rows + f.oy;
  if (sy < 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(0, FLOOR * 2);
  ctx.scale(1, -1);
  ctx.drawImage(src, 0, sy, src.width, rows, f.vx0, FLOOR - rows, src.width, rows);
  ctx.restore();
}

function lip(ctx, f, t) {
  const w = f.vx1 - f.vx0;
  rect(ctx, f.vx0, LIP, w, 1, P.yellow);
  rect(ctx, f.vx0, LIP + 1, w, 2, P.amber);
  rect(ctx, f.vx0, LIP + 3, w, 1, P.orange);
  rect(ctx, f.vx0, LIP + 4, w, 12, P.crimson);
  rect(ctx, f.vx0, LIP + 4, w, 1, P.red);
  for (let x = Math.floor(f.vx0 / 16) * 16; x < f.vx1; x += 16) {
    rect(ctx, x + 4, LIP + 8, 8, 4, P.umber);
    rect(ctx, x + 5, LIP + 9, 6, 2, P.red);
  }
  rect(ctx, f.vx0, LIP + 15, w, 1, P.umber);
  rect(ctx, f.vx0, LIP + 16, w, f.vy1 - LIP - 16, P.ink);
  for (let x = Math.floor(f.vx0 / 40) * 40 + 20; x < f.vx1; x += 40) {
    const flick = Math.floor(t * 5 + x) % 7 === 0 ? 0.04 : 0;
    rect(ctx, x - 5, LIP - 2, 11, 2, P.ink);
    rect(ctx, x - 4, LIP - 2, 9, 1, P.yellow);
    glow(ctx, x, LIP - 2, 14, 4, P.yellow, 0.1 + flick, 2);
  }
}

function audience(ctx, f, t, cheer) {
  const rows = [
    { y: 252, gap: 21, r: 7, off: 3, seed: 1 },
    { y: 268, gap: 25, r: 8, off: 14, seed: 2 },
    { y: 286, gap: 23, r: 9, off: 6, seed: 3 },
  ];
  for (const row of rows) {
    if (row.y - row.r - 10 > f.vy1) continue;
    const start = Math.floor((f.vx0 - row.off) / row.gap) * row.gap + row.off;
    for (let x = start; x < f.vx1 + row.gap; x += row.gap) {
      const k = Math.round(x / row.gap);
      const jx = Math.round(hash(k, row.seed) * 6) - 3;
      const phase = hash(k, row.seed + 7);
      let hop = 0;
      if (cheer) hop = Math.floor(t * 5 + phase * 4) % 2 ? 3 : 0;
      else if ((t * 0.5 + phase) % 1 < 0.04) hop = 1;
      const cx = x + jx;
      const cy = row.y - hop;
      if (cheer) {
        const up = Math.floor(t * 5 + phase * 4) % 2 ? 0 : 2;
        rect(ctx, cx - row.r - 3, cy - row.r - 6 + up, 3, 10, P.dusk);
        rect(ctx, cx + row.r, cy - row.r - 6 + up, 3, 10, P.dusk);
        rect(ctx, cx - row.r - 2, cy - row.r - 5 + up, 2, 9, P.night);
        rect(ctx, cx + row.r + 1, cy - row.r - 5 + up, 2, 9, P.night);
      }
      ellipse(ctx, cx, cy + row.r + 6, row.r + 6, 7, P.dusk);
      ellipse(ctx, cx, cy + row.r + 7, row.r + 6, 7, P.night);
      ellipse(ctx, cx, cy, row.r, row.r, P.dusk);
      ellipse(ctx, cx, cy + 1, row.r, row.r, P.night);
    }
  }
}

function cone(ctx, topX, bottomX, spread, color, alpha) {
  lit(ctx, alpha, () => trapezoid(ctx, 38, FLOOR + 6, topX - 4, topX + 5, bottomX - spread, bottomX + spread, color));
  lit(ctx, alpha * 0.8, () =>
    trapezoid(ctx, 38, FLOOR + 6, topX - 2, topX + 3, bottomX - spread * 0.55, bottomX + spread * 0.55, color),
  );
  glow(ctx, bottomX, FLOOR + 5, spread + 6, 6, color, alpha * 1.4, 3);
}

function motes(ctx, x, spread, t, count, color) {
  for (let i = 0; i < count; i += 1) {
    const y = 60 + ((hash(i, 11) * 140 + t * (4 + hash(i, 12) * 6)) % 136);
    const u = (y - 38) / (FLOOR - 38);
    const px = x + (hash(i, 13) - 0.5) * 2 * spread * u + Math.sin(t + i) * 2;
    if ((Math.floor(t * 2) + i) % 5 === 0) continue;
    rect(ctx, px, y, 1, 1, color);
  }
}

export function paint(ctx, f) {
  const { view, anim, now, still } = f;
  const t = still ? 0 : now / 1000;
  const dt = anim.last == null ? 0 : Math.min(0.1, (now - anim.last) / 1000);
  anim.last = now;

  ctx.drawImage(cached("doors", f, (g) => backdrop(g, f)), f.vx0, f.vy0);

  // chase lights along the arch
  const archBulbs = 34;
  for (let k = 0; k <= archBulbs; k += 1) {
    const [x, y] = archPoint(Math.PI - (k / archBulbs) * Math.PI);
    if (x < f.vx0 + CURTAIN + 2 || x > f.vx1 - CURTAIN - 3) continue;
    const on = still || (k + Math.floor(t * 8)) % 3 !== 0;
    rect(ctx, x - 1, y - 1, 3, 3, P.ink);
    rect(ctx, x - 1, y - 1, 2, 2, on ? P.yellow : P.copper);
    if (on) rect(ctx, x - 1, y - 1, 1, 1, P.white);
  }
  for (let k = 0; k < 22; k += 1) {
    const x = f.vx0 + CURTAIN + 6 + k * Math.max(10, (f.vx1 - f.vx0 - CURTAIN * 2 - 12) / 21);
    const on = still || (k + Math.floor(t * 6)) % 4 !== 0;
    rect(ctx, x, 14, 2, 2, on ? P.yellow : P.copper);
  }

  const hover = f.hover;
  const { phase } = view;
  const hotIndex = view.doors.findIndex((door) => door.hot);
  const celebrate = view.doors.some((door) => door.celebrate);
  const phaseAt = since(anim, `phase:${phase}`, true, now, still);
  const opens = view.doors.map((door, i) => {
    const elapsed = since(anim, `open${i}`, door.open, now, still);
    let delay = 0;
    if (phase === "opening" || phase === "decide") delay = 650;
    if (phase === "result") delay = door.hot ? 900 : 150;
    return { elapsed, p: steps(progress(elapsed, delay, 560), 7), delay };
  });

  const bleats = [];
  view.doors.forEach((door, i) => {
    let mode = "off";
    if (view.interactive) mode = hover === i ? "on" : "chase";
    else if (door.hot) mode = "flash";
    else if (phase === "announce") mode = "rush";
    drawFrame(ctx, i, mode, t);
    const open = opens[i].p;
    if (open > 0) {
      if (once(anim, `swing${i}`)) f.cue("swing");
      if (interior(ctx, i, door, t, open)) bleats.push(i);
    } else {
      rect(ctx, CX[i] - DOOR_HALF, DOOR_TOP, LEAF_W, LEAF_H, P.ink);
    }
    drawLeaf(ctx, CX[i], (open * Math.PI) / 2, hover === i && view.interactive);
    if (open >= 1 && door.content === "goat" && phase !== "result" && once(anim, `baa${i}`)) f.cue("baa");
    if (phase === "decide" && door.open && !door.hot) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      rect(ctx, CX[i] - FRAME_HALF, FRAME_TOP, FRAME_HALF * 2, FLOOR - FRAME_TOP, P.ink);
      ctx.restore();
    }
  });
  if (phase === "result" && hotIndex >= 0 && opens[hotIndex].p >= 1 && once(anim, "verdict")) {
    f.cue(celebrate ? "win" : "lose");
  }
  if (hotIndex >= 0) halo(ctx, hotIndex, t, still);

  floor(ctx, f);
  reflect(ctx, f, 26, 0.34);
  ctx.save();
  ctx.globalAlpha = 0.45;
  rect(ctx, f.vx0, FLOOR, f.vx1 - f.vx0, 2, P.ink);
  ctx.restore();

  // host
  let point = false;
  if (phase === "announce") point = !still && Math.floor(t * 2.5) % 2 === 0;
  else if (phase === "opening") point = phaseAt < 2200;
  else if (phase === "result") point = celebrate && opens[hotIndex]?.elapsed > 900;
  else if (phase === "pick") point = !still && t % 5 > 4.2;
  const bob = still ? 0 : Math.floor(t * 1.6) % 2;
  const hostY = HOST_FEET - 36;
  ellipse(ctx, HOST_X + 10, HOST_FEET + 1, 12, 2, P.umber);
  ctx.save();
  ctx.beginPath();
  ctx.rect(f.vx0, FLOOR, f.vx1 - f.vx0, LIP - FLOOR);
  ctx.clip();
  ctx.globalAlpha = 0.22;
  ctx.translate(0, HOST_FEET * 2 + 2);
  ctx.scale(1, -1);
  blit(ctx, point ? HOST_POINT : HOST, HOST_X, hostY);
  ctx.restore();
  blit(ctx, point ? HOST_POINT : HOST, HOST_X, hostY + bob);
  if (!still && t % 3.7 < 0.15) {
    rect(ctx, HOST_X + 7, hostY + bob + 5, 1, 2, P.skin);
    rect(ctx, HOST_X + 12, hostY + bob + 5, 1, 2, P.skin);
    rect(ctx, HOST_X + 7, hostY + bob + 6, 1, 1, P.skinDark);
    rect(ctx, HOST_X + 12, hostY + bob + 6, 1, 1, P.skinDark);
  }

  lip(ctx, f, t);
  audience(ctx, f, t, celebrate && opens[hotIndex]?.elapsed > 1100);

  // spotlights
  if (view.interactive) {
    const target = hover >= 0 ? CX[hover] : 240 + 104 * Math.sin(t * 0.7);
    anim.spot = anim.spot == null ? target : anim.spot + (target - anim.spot) * (1 - Math.exp(-dt * 7));
    cone(ctx, 240, anim.spot, 40, P.yellow, 0.09);
    motes(ctx, anim.spot, 36, t, 14, P.sand);
  } else if (hotIndex >= 0) {
    const cx = CX[hotIndex];
    const lost = phase === "result" && !celebrate;
    cone(ctx, cx, cx, 44, lost ? P.steel : P.yellow, lost ? 0.08 : 0.12);
    motes(ctx, cx, 40, t, 12, lost ? P.silver : P.yellow);
    const bounce = still ? 0 : Math.floor(t * 3) % 2;
    pickTag(ctx, f.t.scene.yourPick, cx, FRAME_TOP - 25 + bounce);
  }

  // effects
  bleats.forEach((i) => bubble(ctx, f.t.scene.baa, CX[i] + 9, FLOOR - 29));
  view.doors.forEach((door, i) => {
    if (door.content !== "car" || opens[i].p < 1) return;
    const cx = CX[i];
    for (let k = 0; k < 4; k += 1) {
      const life = (t * 1.3 + k * 0.37 + i) % 1.6;
      if (life > 0.6) continue;
      const size = life < 0.2 ? 1 : life < 0.4 ? 2 : 1;
      twinkle(ctx, cx - 22 + Math.round(hash(k, i, Math.floor(t * 1.3 + k * 0.37)) * 44), FLOOR - 28 + Math.round(hash(k, 9, Math.floor(t)) * 12), size);
    }
  });
  if (celebrate && hotIndex >= 0) {
    const party = opens[hotIndex].elapsed - opens[hotIndex].delay - 450;
    if (party >= 0 && once(anim, "pop")) {
      f.cue("pop", -0.7);
      f.cue("pop", 0.7);
    }
    confetti(ctx, party - 300, f.vx0, f.vx1, f.vy0 - 4, LIP + 12, 70);
    cannon(ctx, party, f.vx0 + CURTAIN + 6, LIP - 2, 1, f.vy1, 80, 1);
    cannon(ctx, party, f.vx1 - CURTAIN - 6, LIP - 2, -1, f.vy1, 80, 2);
  }
}
