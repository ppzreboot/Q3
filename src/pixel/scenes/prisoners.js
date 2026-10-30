import { P } from "../palette.js";
import { box, dither, ditherEllipse, ellipse, glow, hash, lit, rect, steps, text, trapezoid } from "../gfx.js";
import { GHOST, blit } from "../sprite.js";
import { FLAMES, JAILER, LANTERN, NOTE, PRISONER, PRISONER_DOWN, PRISONER_HAPPY } from "../sprites.js";
import { bubble, cached, once, progress, since, tag, through, variant } from "./common.js";

const FLOOR = 194;
const CX = [136, 240, 344];
const HALF = 36;
const SPRING = 122;
const RING = 7;
const TORCHES = [76, 188, 292, 404];
const WIN = { half: 11, top: 22, h: 30 };
const PLAQUE_Y = 68;
const JAILER_X = 50;
const JAILER_FEET = 229;
const SWAPS = [{ n: "o", B: "a" }, null, { n: "M", B: "m" }];

// stone as torchlight sees it, near and nearer
const WARM = {
  [P.night]: P.umber,
  [P.dusk]: P.brown,
  [P.slate]: P.clay,
  [P.pine]: P.leaf,
};
const HOT = {
  [P.ink]: P.umber,
  [P.night]: P.brown,
  [P.dusk]: P.clay,
  [P.slate]: P.tan,
  [P.umber]: P.brown,
  [P.brown]: P.clay,
  [P.clay]: P.tan,
  [P.copper]: P.orange,
  [P.amber]: P.yellow,
  [P.pine]: P.leaf,
};
const DAY = {
  [P.night]: P.dusk,
  [P.dusk]: P.slate,
  [P.slate]: P.steel,
};

export function hits() {
  return [];
}

// horizontal extent of an arch-topped opening at row y
function arch(cx, half, spring, y) {
  if (y >= spring) return [cx - half, cx + half];
  const dy = spring - y;
  if (dy >= half) return null;
  const dx = Math.sqrt(half * half - dy * dy);
  return [Math.round(cx - dx), Math.round(cx + dx)];
}

function stones(g, f) {
  const w = f.vx1 - f.vx0;
  rect(g, f.vx0, f.vy0, w, FLOOR - f.vy0, P.ink);
  const BH = 12;
  const BW = 24;
  for (let y = Math.floor(f.vy0 / BH) * BH; y < FLOOR; y += BH) {
    const row = Math.round(y / BH);
    const off = row & 1 ? BW / 2 : 0;
    for (let x = Math.floor((f.vx0 - off) / BW) * BW + off; x < f.vx1; x += BW) {
      const n = hash(Math.round(x / BW), row, 3);
      const face = n > 0.9 ? P.dusk : P.night;
      const edge = n > 0.9 ? P.slate : P.dusk;
      const h = Math.min(BH - 1, FLOOR - y - 1);
      if (h <= 0) continue;
      rect(g, x + 1, y + 1, BW - 1, h, face);
      rect(g, x + 1, y + 1, BW - 2, 1, edge);
      rect(g, x + 1, y + 1, 1, h - 1, edge);
      if (n < 0.2) rect(g, x + 4 + Math.round(n * 40), y + 4, 3, 1, P.ink);
      if (n > 0.55 && n < 0.6) rect(g, x + 6, y + h - 2, 5, 2, P.pine);
    }
  }
}

function cell(g, cx) {
  for (let y = SPRING - HALF - RING; y < FLOOR; y += 1) {
    const o = arch(cx, HALF + RING, SPRING, y);
    if (o) rect(g, o[0], y, o[1] - o[0], 1, P.dusk);
  }
  for (let a = 0; a <= 12; a += 1) {
    const ang = Math.PI - (a / 12) * Math.PI;
    for (let r = HALF; r < HALF + RING; r += 1) {
      rect(g, cx + Math.cos(ang) * r, SPRING - Math.sin(ang) * r, 1, 1, P.ink);
    }
  }
  for (let y = SPRING - HALF - RING; y < FLOOR; y += 1) {
    const o = arch(cx, HALF + RING, SPRING, y);
    if (o) rect(g, o[0], y, 1, 1, P.slate);
  }
  for (let y = SPRING; y < FLOOR; y += 12) {
    rect(g, cx - HALF - RING, y, RING, 1, P.ink);
    rect(g, cx + HALF, y, RING, 1, P.ink);
  }
  for (let y = SPRING - HALF; y < FLOOR; y += 1) {
    const s = arch(cx, HALF, SPRING, y);
    if (s) rect(g, s[0], y, s[1] - s[0], 1, P.ink);
  }
  for (let y = SPRING - HALF + 6; y < FLOOR - 8; y += 8) {
    const off = (y / 8) & 1 ? 6 : 0;
    const s = arch(cx, HALF, SPRING, y);
    if (!s) continue;
    rect(g, s[0] + 3, y, s[1] - s[0] - 6, 1, P.night);
    for (let x = s[0] + 3 + off; x < s[1] - 3; x += 12) rect(g, x, y, 1, 8, P.night);
  }
  rect(g, cx - HALF, FLOOR - 9, HALF * 2, 9, P.night);
  rect(g, cx - HALF, FLOOR - 9, HALF * 2, 1, P.dusk);
  for (let k = 0; k < 26; k += 1) {
    const x = cx + 14 + Math.round(hash(k, cx) * 18);
    const y = FLOOR - 4 - Math.round(hash(k, cx, 2) * 6);
    rect(g, x, y, 2, 1, k % 3 ? P.copper : P.amber);
  }
  for (let y = 134; y < 148; y += 3) rect(g, cx - 27, y, 1, 2, P.slate);
  rect(g, cx - 29, 148, 5, 4, P.slate);
  rect(g, cx - 28, 149, 3, 2, P.ink);

  // the high window above the cell
  for (let y = WIN.top - 4; y < WIN.top + WIN.h + 4; y += 1) {
    const o = arch(cx, WIN.half + 4, WIN.top + WIN.half, y);
    if (o) rect(g, o[0], y, o[1] - o[0], 1, P.dusk);
  }
  for (let y = WIN.top - 4; y < WIN.top + WIN.h + 4; y += 1) {
    const o = arch(cx, WIN.half + 4, WIN.top + WIN.half, y);
    if (o) rect(g, o[0], y, 1, 1, P.slate);
  }
  rect(g, cx - WIN.half - 5, WIN.top + WIN.h + 2, WIN.half * 2 + 10, 3, P.slate);
  rect(g, cx - WIN.half - 5, WIN.top + WIN.h + 4, WIN.half * 2 + 10, 1, P.ink);

  // name plate on the keystone
  box(g, cx - 13, PLAQUE_Y - 1, 26, 17, P.ink, [1]);
  box(g, cx - 12, PLAQUE_Y, 24, 15, P.brown, [1]);
  rect(g, cx - 11, PLAQUE_Y, 22, 1, P.clay);
  rect(g, cx - 11, PLAQUE_Y + 14, 22, 1, P.umber);
}

function scene(g, f) {
  stones(g, f);
  CX.forEach((cx) => cell(g, cx));
  for (const tx of TORCHES) {
    rect(g, tx - 4, 124, 9, 3, P.ink);
    rect(g, tx - 3, 124, 7, 1, P.slate);
    rect(g, tx - 1, 127, 3, 6, P.ink);
    rect(g, tx - 2, 112, 5, 13, P.ink);
    rect(g, tx - 1, 113, 3, 11, P.brown);
    rect(g, tx - 1, 113, 1, 11, P.clay);
  }
  const w = f.vx1 - f.vx0;
  rect(g, f.vx0, FLOOR, w, f.vy1 - FLOOR, P.ink);
  for (let y = FLOOR; y < f.vy1; y += 11) {
    const row = Math.round((y - FLOOR) / 11);
    const bw = 30 + row * 4;
    const off = row & 1 ? bw / 2 : 0;
    for (let x = Math.floor((f.vx0 - off) / bw) * bw + off; x < f.vx1; x += bw) {
      const n = hash(Math.round(x / bw), row, 9);
      rect(g, x + 1, y + 1, bw - 1, 10, n > 0.8 ? P.dusk : P.night);
      rect(g, x + 1, y + 1, bw - 2, 1, n > 0.8 ? P.slate : P.dusk);
    }
  }
  rect(g, f.vx0, FLOOR, w, 2, P.ink);
}

const NIGHT_SKY = [P.ink, P.ink, P.night, P.night, P.night, P.night, P.dusk, P.dusk, P.night];
const DAWN_SKY = [P.plum, P.plum, P.mauve, P.mauve, P.salmon, P.salmon, P.orange, P.amber, P.yellow];

function sky(ctx, i, dawn, t) {
  const cx = CX[i];
  const level = Math.round(dawn * 16);
  for (let r = 0; r < WIN.h; r += 1) {
    const s = arch(cx, WIN.half, WIN.top + WIN.half, WIN.top + r);
    if (!s) continue;
    const k = Math.min(NIGHT_SKY.length - 1, Math.floor((r / WIN.h) * NIGHT_SKY.length));
    rect(ctx, s[0], WIN.top + r, s[1] - s[0], 1, NIGHT_SKY[k]);
    dither(ctx, s[0], WIN.top + r, s[1] - s[0], 1, DAWN_SKY[k], level);
  }
  if (dawn < 0.5) {
    for (let s = 0; s < 6; s += 1) {
      if ((Math.floor(t * 1.5) + s + i) % 7 === 0) continue;
      const x = cx - WIN.half + 2 + Math.round(hash(s, i) * (WIN.half * 2 - 4));
      const y = WIN.top + 5 + Math.round(hash(s, i, 4) * 16);
      rect(ctx, x, y, 1, 1, s % 3 ? P.silver : P.white);
    }
    if (i === 2) {
      ellipse(ctx, cx + 3, WIN.top + 10, 5, 5, P.sand);
      ellipse(ctx, cx + 5, WIN.top + 9, 4, 4, NIGHT_SKY[2]);
    }
  } else {
    ellipse(ctx, cx - 3, WIN.top + WIN.h, 7, 6, P.yellow);
    ellipse(ctx, cx - 3, WIN.top + WIN.h, 4, 3, P.white);
    rect(ctx, cx - WIN.half, WIN.top + WIN.h, WIN.half * 2, 3, P.slate);
  }
  for (const bx of [cx - 5, cx + 4]) {
    const top = arch(cx, WIN.half, WIN.top + WIN.half, WIN.top + 1) ? WIN.top : WIN.top + 2;
    rect(ctx, bx, top, 2, WIN.h, P.ink);
    rect(ctx, bx, top, 1, WIN.h, P.slate);
  }
  rect(ctx, cx - WIN.half, WIN.top + 16, WIN.half * 2, 2, P.ink);
  rect(ctx, cx - WIN.half, WIN.top + 16, WIN.half * 2, 1, P.slate);
}

function bars(ctx, cx, doorOpen) {
  for (let k = -4; k <= 4; k += 1) {
    const bx = cx + k * 8;
    if (doorOpen > 0 && Math.abs(k) <= 1) continue;
    let top = SPRING - HALF;
    const dy2 = HALF * HALF - (bx - cx) ** 2;
    if (dy2 > 0) top = Math.round(SPRING - Math.sqrt(dy2)) + 1;
    rect(ctx, bx - 1, top, 3, FLOOR - top, P.ink);
    rect(ctx, bx, top, 1, FLOOR - top, P.slate);
    rect(ctx, bx - 1, top, 1, FLOOR - top, P.steel);
  }
  for (const y of [130, 180]) {
    const s = arch(cx, HALF, SPRING, y);
    const parts = doorOpen > 0 ? [[s[0], cx - 12], [cx + 12, s[1]]] : [[s[0], s[1]]];
    for (const [a, b] of parts) {
      rect(ctx, a, y, b - a, 3, P.ink);
      rect(ctx, a, y, b - a, 1, P.steel);
      rect(ctx, a, y + 1, b - a, 1, P.slate);
    }
  }
  if (doorOpen > 0) {
    // the barred door, swung toward us on its left hinge
    const w = Math.max(4, Math.round(24 * (1 - doorOpen)));
    const e = Math.round(4 * doorOpen);
    for (let i = 0; i <= 3; i += 1) {
      const bx = cx - 12 + Math.round((i / 3) * w);
      const up = Math.round((e * i) / 3);
      rect(ctx, bx - 1, 128 - up, 3, FLOOR - 128 + up * 2, P.ink);
      rect(ctx, bx, 128 - up, 1, FLOOR - 128 + up * 2, P.steel);
    }
    rect(ctx, cx - 13, 130, w + 2, 3, P.ink);
    rect(ctx, cx - 13, 180, w + 2, 3, P.ink);
  } else {
    rect(ctx, cx + 9, 150, 7, 8, P.ink);
    rect(ctx, cx + 10, 151, 5, 6, P.amber);
    rect(ctx, cx + 10, 151, 5, 1, P.yellow);
    rect(ctx, cx + 12, 153, 1, 2, P.ink);
  }
}

function flicker(t, i, still) {
  return still ? 0 : Math.floor(t * 7 + i * 3) % 3;
}

function pool(g, x, y, rx, ry) {
  ditherEllipse(g, x, y, rx + 7, ry + 6, P.white, 4);
  ditherEllipse(g, x, y, rx + 3, ry + 3, P.white, 9);
  ellipse(g, x, y, rx, ry, P.white);
}

function torch(ctx, tx, i, t, still, dawn) {
  const frame = FLAMES[still ? 0 : (Math.floor(t * 9) + i * 2) % FLAMES.length];
  blit(ctx, frame, tx - 3, 101);
  const flick = flicker(t, i, still);
  glow(ctx, tx, 108, 12 + flick, 12 + flick, P.yellow, 0.1 * (1 - dawn * 0.5), 2);
  glow(ctx, tx, 128, 40, 50, P.orange, 0.035 * (1 - dawn * 0.7), 2);
}

export function paint(ctx, f) {
  const { view, anim, now, still } = f;
  const t = still ? 0 : now / 1000;
  const cold = cached("prisoners", f, (g) => scene(g, f));
  const warm = variant("prisoners-warm", f, cold, WARM);
  const hot = variant("prisoners-hot", f, cold, HOT);
  const day = variant("prisoners-day", f, cold, DAY);

  const dawnAt = since(anim, "dawn", view.phase === "result", now, still);
  const dawn = steps(progress(dawnAt, 0, 1600), 8);
  const phaseAt = since(anim, `phase:${view.phase}`, true, now, still);

  ctx.drawImage(cold, f.vx0, f.vy0);
  if (dawn > 0) {
    through(ctx, f, day, (g) => dither(g, f.vx0, f.vy0, f.vx1 - f.vx0, f.vy1 - f.vy0, P.white, dawn * 16));
  }
  const fade = 1 - dawn * 0.55;
  const swing = still ? 0 : Math.round(Math.sin(t * 2.2));
  const lanternX = JAILER_X + 2 + swing;
  const lanternY = JAILER_FEET - 3;
  through(ctx, f, warm, (g) => {
    TORCHES.forEach((tx, i) => {
      const flick = flicker(t, i, still);
      pool(g, tx, 114, (40 + flick) * fade, (38 + flick) * fade);
      pool(g, tx, FLOOR + 12, 34 * fade, 9 * fade);
    });
    pool(g, lanternX, lanternY, 26 * fade, 20 * fade);
  });
  through(ctx, f, hot, (g) => {
    TORCHES.forEach((tx, i) => {
      const flick = flicker(t, i, still);
      pool(g, tx, 112, (16 + flick) * fade, (16 + flick) * fade);
      pool(g, tx, FLOOR + 11, 16 * fade, 4 * fade);
    });
    pool(g, lanternX, lanternY + 4, 9, 6);
  });

  CX.forEach((cx, i) => sky(ctx, i, dawn, t));

  const fates = view.fates;
  const named = view.revealed;
  const told = view.phase === "answer" || view.phase === "gloat";
  const gloating = view.phase === "gloat";
  const people = CX.map((cx, i) => {
    // overnight fates show once the sun is up; the one the jailer named is already known
    const fate = fates && (dawn >= 1 || named === i) ? fates[i] : null;
    const doomed = (told && named === i) || fate === "处决";
    const free = fate === "赦免";
    const out = free ? steps(progress(dawnAt, 2000, 700), 5) : 0;
    const door = free ? steps(progress(dawnAt, 1650, 400), 4) : 0;
    return { cx, i, fate, doomed, free, out, door };
  });
  if (people.some((p) => p.door > 0) && once(anim, "clank")) f.cue("clank");
  if (fates && dawn >= 1 && once(anim, "verdict")) f.cue(fates[0] === "赦免" ? "win" : "lose");

  const drawPerson = (p) => {
    const happy = gloating && p.i === 0;
    let bob = still ? 0 : Math.floor(t * 1.3 + p.i * 0.7) % 2;
    if (happy && !still) bob = Math.floor(t * 6) % 2 ? -2 : 0;
    const feet = FLOOR - 2 + Math.round(p.out * 16);
    const x = p.cx - 10 - Math.round(p.out * 4);
    const y = feet - 31 + (p.doomed ? 1 : bob);
    if (p.free && dawn > 0) glow(ctx, x + 10, feet, 18, 4, P.yellow, 0.2 * dawn, 3);
    ellipse(ctx, x + 10, feet + 1, 10, 2, P.ink);
    const ghost = p.fate === "处决";
    const def = p.doomed ? PRISONER_DOWN : happy ? PRISONER_HAPPY : PRISONER;
    blit(ctx, def, x, y, { swap: ghost ? GHOST : SWAPS[p.i], variant: `${p.i}${ghost ? "g" : ""}` });
    if (!ghost && !happy && !still && (t + p.i * 1.9) % 4.3 < 0.13) {
      rect(ctx, x + 7, y + 5, 1, 2, P.skin);
      rect(ctx, x + 12, y + 5, 1, 2, P.skin);
    }
  };

  people.forEach((p) => {
    if (p.out < 0.5) drawPerson(p);
    bars(ctx, p.cx, p.door);
    if (p.out >= 0.5) drawPerson(p);
  });

  // 甲 can't keep the grin off his face
  if (gloating && !still) {
    for (let k = 0; k < 3; k += 1) {
      const life = (phaseAt / 1000 + k * 0.6) % 1.8;
      const nx = CX[0] + 10 + k * 5 + Math.round(Math.sin(life * 5 + k) * 2);
      blit(ctx, NOTE, nx, FLOOR - 40 - Math.round(life * 22));
    }
  }

  // light through the high windows
  CX.forEach((cx) => {
    const shaft = (color, alpha) =>
      lit(ctx, alpha, () =>
        trapezoid(ctx, WIN.top + WIN.h + 4, FLOOR + 14, cx - WIN.half + 2, cx + WIN.half - 2, cx - 2, cx + 30, color),
      );
    shaft(P.steel, 0.05 * (1 - dawn));
    shaft(P.yellow, 0.13 * dawn);
    if (dawn > 0) glow(ctx, cx + 14, FLOOR + 12, 22, 4, P.yellow, 0.14 * dawn, 2);
  });

  TORCHES.forEach((tx, i) => torch(ctx, tx, i, t, still, dawn));

  const words = f.t.scene;
  people.forEach((p) => {
    const color = p.doomed ? P.salmon : p.free ? P.yellow : P.sand;
    text(ctx, f.t.names[p.i], p.cx, PLAQUE_Y + 1, { color, outline: P.umber });
    if (p.doomed) tag(ctx, p.fate ? words.executed : words.doomed, p.cx, 96, { color: P.salmon, border: P.red });
    else if (p.free) tag(ctx, words.pardoned, p.cx, 96, { color: P.yellow, border: P.amber });
  });
  const you = people[0];
  const bounce = still ? 0 : Math.round(Math.sin(t * 5) * 1.5);
  const youY = FLOOR - 2 + Math.round(you.out * 16) - 31 - 17;
  text(ctx, words.you, you.cx - Math.round(you.out * 4), youY + bounce - (gloating ? 3 : 0), { color: P.cyan });

  // jailer
  const jy = JAILER_FEET - 32;
  ellipse(ctx, JAILER_X + 10, JAILER_FEET + 1, 12, 2, P.ink);
  const jbob = still ? 0 : Math.floor(t * 1.2) % 2;
  blit(ctx, JAILER, JAILER_X, jy + jbob);
  rect(ctx, lanternX, jy + 21 + jbob, 1, 3, P.ink);
  blit(ctx, LANTERN, lanternX - 3, jy + 24 + jbob);
  glow(ctx, lanternX, jy + 29, 8, 8, P.yellow, 0.14, 2);

  if (view.phase === "think") {
    const dots = ".".repeat(1 + (Math.floor(still ? 2 : phaseAt / 380) % 3));
    bubble(ctx, dots.padEnd(3, " "), JAILER_X + 12, jy - 2);
  } else if (view.phase === "answer" && phaseAt < 1400) {
    bubble(ctx, "！", JAILER_X + 12, jy - 2, { color: P.red });
  }

  if (dawn > 0) {
    lit(ctx, 0.04 * dawn, () => rect(ctx, f.vx0, f.vy0, f.vx1 - f.vx0, f.vy1 - f.vy0, P.salmon), "screen");
  }
}
