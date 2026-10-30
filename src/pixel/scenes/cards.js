import { P } from "../palette.js";
import { box, canvas, dither, ditherEllipse, ellipse, glow, hash, rect, steps, text } from "../gfx.js";
import { blit } from "../sprite.js";
import { CLUB, DIAMOND, HEART, HEART_SMALL, SPADE, SPADE_SMALL } from "../sprites.js";
import { bubble, cached, once, progress, since, tag, twinkle } from "./common.js";

const PRINT = { 0: "G", 2: "G", r: "G", R: "G", k: "G" };

const CX = [136, 240, 344];
const CY = 126;
const CW = 40;
const CH = 56;
const OUTER = { x0: 20, y0: 12, x1: 460, y1: 258, r: 24 };
const INNER = { x0: 32, y0: 24, x1: 448, y1: 246, r: 13 };
const SPOT = { w: 58, h: 76 };
export function hits(view) {
  if (!view?.interactive) return [];
  return CX.map((cx, index) => ({ index, x: cx - SPOT.w / 2 - 4, y: CY - SPOT.h / 2 - 4, w: SPOT.w + 8, h: SPOT.h + 22 }));
}

function roundSpan(r, y) {
  if (y < r.y0 || y >= r.y1) return null;
  let dx = 0;
  if (y < r.y0 + r.r) {
    const dy = r.y0 + r.r - y - 0.5;
    dx = r.r - Math.sqrt(Math.max(0, r.r * r.r - dy * dy));
  } else if (y >= r.y1 - r.r) {
    const dy = y + 0.5 - (r.y1 - r.r);
    dx = r.r - Math.sqrt(Math.max(0, r.r * r.r - dy * dy));
  }
  return [Math.round(r.x0 + dx), Math.round(r.x1 - dx)];
}

function carpet(g, f) {
  const w = f.vx1 - f.vx0;
  rect(g, f.vx0, f.vy0, w, f.vy1 - f.vy0, P.night);
  const T = 16;
  for (let y = Math.floor(f.vy0 / T) * T; y < f.vy1; y += T) {
    for (let x = Math.floor(f.vx0 / T) * T; x < f.vx1; x += T) {
      const cx = x + 8;
      const cy = y + 8;
      for (let k = 0; k < 6; k += 1) {
        rect(g, cx - 6 + k, cy - k, 1, 1, P.dusk);
        rect(g, cx + 6 - k, cy - k, 1, 1, P.dusk);
        rect(g, cx - 6 + k, cy + k, 1, 1, P.dusk);
        rect(g, cx + 6 - k, cy + k, 1, 1, P.dusk);
      }
      rect(g, cx - 1, cy, 3, 1, P.copper);
      rect(g, cx, cy - 1, 1, 3, P.copper);
      rect(g, cx, cy, 1, 1, P.amber);
      rect(g, x, y, 1, 1, P.navy);
    }
  }
}

function table(g, f) {
  carpet(g, f);
  // table shadow on the carpet
  for (let y = OUTER.y0 + 4; y < OUTER.y1 + 5; y += 1) {
    const s = roundSpan({ ...OUTER, y0: OUTER.y0 + 5, y1: OUTER.y1 + 5, x0: OUTER.x0 + 4, x1: OUTER.x1 + 4 }, y);
    if (s) rect(g, s[0], y, s[1] - s[0], 1, P.ink);
  }
  // felt with lamp light
  rect(g, INNER.x0, INNER.y0, INNER.x1 - INNER.x0, INNER.y1 - INNER.y0, P.deep);
  ditherEllipse(g, 240, 132, 250, 150, P.pine, 8);
  ellipse(g, 240, 132, 232, 136, P.pine);
  ditherEllipse(g, 240, 130, 200, 112, P.leaf, 4);
  ditherEllipse(g, 240, 130, 180, 100, P.leaf, 8);
  ditherEllipse(g, 240, 128, 160, 88, P.leaf, 12);
  ellipse(g, 240, 128, 140, 76, P.leaf);
  for (let k = 0; k < 420; k += 1) {
    const x = INNER.x0 + Math.floor(hash(k, 1, 5) * (INNER.x1 - INNER.x0));
    const y = INNER.y0 + Math.floor(hash(k, 2, 5) * (INNER.y1 - INNER.y0));
    const dx = (x - 240) / 140;
    const dy = (y - 128) / 76;
    rect(g, x, y, 1, 1, dx * dx + dy * dy < 1 ? P.pine : P.deep);
  }
  // printed suits
  [SPADE, HEART, CLUB, DIAMOND].forEach((def, k) => {
    const x = 240 - 39 + k * 20;
    blit(g, def, x, 38 + (def === SPADE ? -1 : 0), { swap: PRINT, variant: "print" });
  });
  rect(g, 186, 44, 10, 1, P.leaf);
  rect(g, 284, 44, 10, 1, P.leaf);
  // printed line
  for (let x = 70; x < 410; x += 1) {
    const u = (x - 240) / 170;
    const y = Math.round(212 - 22 * (1 - u * u));
    if ((x & 3) !== 3) rect(g, x, y, 1, 1, P.amber);
  }
  for (let x = 90; x < 390; x += 1) {
    const u = (x - 240) / 150;
    const y = Math.round(218 - 18 * (1 - u * u));
    if ((x & 1) === 0) rect(g, x, y, 1, 1, P.green);
  }
  // rail
  for (let y = OUTER.y0; y < OUTER.y1; y += 1) {
    const o = roundSpan(OUTER, y);
    const i = roundSpan(INNER, y);
    const u = (y - OUTER.y0) / (OUTER.y1 - OUTER.y0);
    const color = u < 0.06 ? P.clay : u > 0.94 ? P.umber : P.brown;
    if (!i) {
      rect(g, o[0], y, o[1] - o[0], 1, color);
    } else {
      rect(g, o[0], y, i[0] - o[0], 1, color);
      rect(g, i[1], y, o[1] - i[1], 1, color);
    }
    rect(g, o[0], y, 1, 1, P.ink);
    rect(g, o[1] - 1, y, 1, 1, P.ink);
    if (i) {
      rect(g, i[0] - 1, y, 1, 1, P.amber);
      rect(g, i[1], y, 1, 1, P.copper);
      rect(g, o[0] + 2, y, 1, 1, y < 135 ? P.clay : P.brown);
    }
  }
  rect(g, OUTER.x0 + OUTER.r, OUTER.y0, OUTER.x1 - OUTER.x0 - OUTER.r * 2, 1, P.ink);
  rect(g, OUTER.x0 + OUTER.r, OUTER.y1 - 1, OUTER.x1 - OUTER.x0 - OUTER.r * 2, 1, P.ink);
  rect(g, OUTER.x0 + OUTER.r, OUTER.y0 + 2, OUTER.x1 - OUTER.x0 - OUTER.r * 2, 1, P.tan);
  rect(g, INNER.x0 + INNER.r, INNER.y0 - 1, INNER.x1 - INNER.x0 - INNER.r * 2, 1, P.amber);
  rect(g, INNER.x0 + INNER.r, INNER.y1, INNER.x1 - INNER.x0 - INNER.r * 2, 1, P.copper);
  // rivets
  for (let x = OUTER.x0 + 40; x < OUTER.x1 - 30; x += 40) {
    rect(g, x, OUTER.y0 + 6, 2, 2, P.amber);
    rect(g, x, OUTER.y1 - 7, 2, 2, P.copper);
  }

  chips(g, 70, 224, [P.red, P.red, P.red, P.red, P.red], P.crimson);
  chips(g, 90, 230, [P.blue, P.blue, P.blue], P.navy);
  chips(g, 58, 236, [P.dusk, P.dusk, P.dusk, P.dusk], P.night);
  chips(g, 410, 230, [P.green, P.green, P.green, P.green], P.leaf);
  chips(g, 392, 236, [P.red, P.red], P.crimson);
  deck(g, 388, 34);
}

function chips(g, cx, base, faces, edge) {
  faces.forEach((face, k) => {
    const y = base - k * 3;
    ellipse(g, cx, y + 2, 9, 4, P.ink);
    ellipse(g, cx, y + 1, 8, 3, edge);
    for (let s = -6; s <= 6; s += 4) rect(g, cx + s, y + 2, 2, 1, P.white);
    ellipse(g, cx, y, 8, 3, face);
    ellipse(g, cx, y, 5, 2, k === faces.length - 1 ? P.white : face);
    if (k === faces.length - 1) ellipse(g, cx, y, 3, 1, face);
  });
}

function deck(g, x, y) {
  for (let k = 5; k >= 1; k -= 1) {
    box(g, x + k, y + k, CW, CH, P.ink, [1]);
    rect(g, x + k, y + k + CH - 2, CW - 1, 1, k % 2 ? P.silver : P.steel);
  }
  g.drawImage(cardImage("back"), x, y);
}

const cards = new Map();

function cardImage(kind) {
  if (cards.has(kind)) return cards.get(kind);
  const c = canvas(CW, CH);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  box(g, 0, 0, CW, CH, P.ink, [2, 1]);
  if (kind === "back") {
    box(g, 1, 1, CW - 2, CH - 2, P.white, [1]);
    rect(g, CW - 2, 2, 1, CH - 4, P.silver);
    rect(g, 2, CH - 2, CW - 4, 1, P.silver);
    rect(g, 4, 4, CW - 8, CH - 8, P.navy);
    for (let y = 4; y < CH - 4; y += 1) {
      for (let x = 4; x < CW - 4; x += 1) {
        if ((x + y) % 6 === 0 || (x - y + 600) % 6 === 0) rect(g, x, y, 1, 1, P.blue);
      }
    }
    rect(g, 4, 4, CW - 8, 1, P.ink);
    rect(g, 4, 4, 1, CH - 8, P.ink);
    rect(g, 6, 6, CW - 12, 1, P.cyan);
    rect(g, 6, CH - 7, CW - 12, 1, P.cyan);
    rect(g, 6, 6, 1, CH - 12, P.cyan);
    rect(g, CW - 7, 6, 1, CH - 12, P.cyan);
    const mx = CW / 2;
    const my = CH / 2;
    for (let k = 0; k < 5; k += 1) rect(g, mx - k, my - 4 + k, k * 2, 1, P.amber);
    for (let k = 0; k < 4; k += 1) rect(g, mx - 3 + k, my + 1 + k, (3 - k) * 2, 1, P.amber);
    rect(g, mx - 1, my - 2, 2, 2, P.yellow);
  } else {
    const red = kind === "红";
    box(g, 1, 1, CW - 2, CH - 2, P.white, [1]);
    rect(g, CW - 2, 2, 1, CH - 4, P.silver);
    rect(g, 2, CH - 2, CW - 4, 1, P.silver);
    const big = red ? HEART : SPADE;
    const small = red ? HEART_SMALL : SPADE_SMALL;
    const ink = red ? P.red : P.ink;
    // the rank, a pixel "A"
    const A = [".0.", "0.0", "000", "0.0", "0.0"];
    A.forEach((row, ry) => {
      for (let rx = 0; rx < 3; rx += 1) if (row[rx] === "0") rect(g, 4 + rx, 4 + ry, 1, 1, ink);
    });
    blit(g, small, 3, 11);
    g.save();
    g.translate(CW, CH);
    g.scale(-1, -1);
    A.forEach((row, ry) => {
      for (let rx = 0; rx < 3; rx += 1) if (row[rx] === "0") rect(g, 4 + rx, 4 + ry, 1, 1, ink);
    });
    blit(g, small, 3, 11);
    g.restore();
    blit(g, big, CW / 2 - 5, CH / 2 - (red ? 5 : 6));
  }
  cards.set(kind, c);
  return c;
}

function card(ctx, x, y, kind, flip, lift = 0) {
  // flip: 0 shows the back, 1 the face
  const p = steps(flip, 8);
  const narrow = Math.abs(Math.cos(p * Math.PI));
  const w = Math.max(2, Math.round(CW * narrow));
  const dx = Math.round(x + (CW - w) / 2);
  const up = Math.round(lift + Math.sin(p * Math.PI) * 5);
  ctx.save();
  ctx.globalAlpha = 0.5;
  box(ctx, dx + 2 + Math.round(up / 2), y + 3, w, CH, P.ink, [2, 1]);
  ctx.restore();
  ctx.drawImage(cardImage(p < 0.5 ? "back" : kind), dx, y - up, w, CH);
}

function spot(ctx, cx, color, label, labelColor) {
  const x = cx - SPOT.w / 2;
  const y = CY - SPOT.h / 2;
  box(ctx, x, y, SPOT.w, SPOT.h, color, [3, 2, 1]);
  box(ctx, x + 1, y + 1, SPOT.w - 2, SPOT.h - 2, P.leaf, [2, 1]);
  dither(ctx, x + 3, y + 3, SPOT.w - 6, SPOT.h - 6, P.pine, 6);
  text(ctx, label, cx, y + SPOT.h + 3, { color: labelColor, outline: P.deep });
}

export function paint(ctx, f) {
  const { view, anim, now, still } = f;
  const t = still ? 0 : now / 1000;
  ctx.drawImage(cached("cards", f, (g) => table(g, f)), f.vx0, f.vy0);

  const hover = f.hover;
  const chosen = view.piles.findIndex((pile) => pile.chosen);
  const others = [0, 1, 2].filter((k) => k !== chosen);
  view.piles.forEach((pile, i) => {
    const hot = view.interactive && hover === i;
    const color = pile.chosen ? P.amber : hot ? P.yellow : P.green;
    spot(ctx, CX[i], color, f.t.piles[i], pile.chosen || hot ? P.yellow : P.green);
  });

  // lamp
  glow(ctx, 240, 120, 150, 90, P.yellow, 0.025, 3);

  const y = CY - CH / 2;
  let verdict = null;
  view.piles.forEach((pile, i) => {
    const cx = CX[i];
    const mine = pile.chosen;
    // your pile opens first; the other two turn over afterwards so the deal can be checked
    const lag = mine ? 0 : 950 + others.indexOf(i) * 300;
    const openAt = since(anim, `spread${i}`, mine || view.phase === "result", now, still);
    const topAt = since(anim, `top${i}`, pile.showTop, now, still);
    const bottomAt = since(anim, `bottom${i}`, pile.showBottom, now, still);
    const spread = steps(progress(openAt, lag, 380), 6);
    const eased = spread * spread * (3 - 2 * spread);
    const topFlip = progress(topAt, mine ? 420 : lag + 380, 460);
    const bottomFlip = progress(bottomAt, mine ? 200 : lag + 560, 460);
    if (topFlip > 0 && once(anim, `flipTop${i}`)) f.cue("flip");
    if (bottomFlip > 0 && once(anim, `flipBottom${i}`)) f.cue("flip");
    const hot = view.interactive && hover === i;
    const lift = hot ? 2 : 0;
    const bx = cx - CW / 2 + 2 - Math.round(eased * 24);
    const tx = cx - CW / 2 + Math.round(eased * 22);
    if (hot) glow(ctx, cx, CY, 36, 46, P.yellow, 0.05, 2);
    card(ctx, bx, y + 2 - Math.round(eased * 2), pile.bottom, bottomFlip, lift);
    card(ctx, tx, y, pile.top, topFlip, lift);
    if (chosen >= 0 && !mine) {
      ctx.save();
      ctx.globalAlpha = view.phase === "result" ? 0.2 : 0.45;
      const x0 = Math.min(bx, tx) - 1;
      rect(ctx, x0, y - 1, Math.max(bx, tx) + CW + 3 - x0, CH + 6, P.deep);
      ctx.restore();
    }
    if (mine && view.phase === "guess") {
      const bob = still ? 0 : Math.floor(t * 3) % 2;
      bubble(ctx, "?", bx + CW / 2, y - 2 - bob);
    }
    if (mine && pile.showBottom && bottomFlip >= 1) verdict = cx;
  });
  if (verdict != null) {
    if (once(anim, "verdict")) f.cue(view.win ? "right" : "wrong");
    tag(ctx, view.win ? f.t.scene.right : f.t.scene.wrong, verdict, y - 26, {
      color: view.win ? P.yellow : P.white,
      border: view.win ? P.amber : P.steel,
    });
    if (view.win) {
      for (let k = 0; k < 6; k += 1) {
        const life = (t * 1.2 + k * 0.29) % 1.7;
        if (life > 0.5) continue;
        const seed = Math.floor(t * 1.2 + k * 0.29);
        const x = verdict - 48 + Math.round(hash(k, seed, 3) * 96);
        const sy = CY - 32 + Math.round(hash(k, seed, 4) * 64);
        twinkle(ctx, x, sy, life < 0.15 || life > 0.35 ? 1 : 2, P.white, P.yellow);
      }
    }
  }
}
