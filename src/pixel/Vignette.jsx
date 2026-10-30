import { useEffect, useRef } from "react";
import { P } from "./palette.js";
import { box, ellipse, frame, glow, hash, rect } from "./gfx.js";
import { blit } from "./sprite.js";
import { DIGITS, FLAMES, GOAT, GOAT_BLEAT, HEART, JAILER, LANTERN, PRISONER } from "./sprites.js";
import { reduceMotion } from "./motion.js";

const W = 88;
const H = 56;

function doorFrame(ctx, x, n, beat) {
  rect(ctx, x - 1, 3, 36, 50, P.ink);
  rect(ctx, x, 4, 34, 49, P.amber);
  rect(ctx, x, 4, 34, 1, P.yellow);
  rect(ctx, x, 4, 1, 49, P.yellow);
  rect(ctx, x + 33, 4, 1, 49, P.orange);
  rect(ctx, x + 3, 7, 28, 12, P.night);
  blit(ctx, DIGITS[n], x + 14, 8);
  for (let k = 0; k < 6; k += 1) {
    const on = (k + beat) % 3 !== 0;
    rect(ctx, x + 1, 22 + k * 5, 1, 2, on ? P.white : P.copper);
    rect(ctx, x + 32, 22 + k * 5, 1, 2, on ? P.white : P.copper);
  }
}

function doors(ctx, frameNo) {
  rect(ctx, 0, 0, W, H, P.night);
  for (let y = 0; y < 46; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const ray = Math.floor((Math.atan2(y - 40, x - 44) / (Math.PI * 2) + 1) * 20) % 2;
      if (ray) rect(ctx, x, y, 1, 1, P.dusk);
    }
  }
  rect(ctx, 0, 50, W, 6, P.umber);
  rect(ctx, 0, 50, W, 1, P.brown);
  const beat = Math.floor(frameNo / 2);
  // a closed door
  doorFrame(ctx, 6, 1, beat);
  rect(ctx, 9, 20, 28, 33, P.red);
  rect(ctx, 9, 20, 28, 1, P.salmon);
  frame(ctx, 13, 24, 20, 11, P.crimson);
  frame(ctx, 13, 38, 20, 12, P.crimson);
  rect(ctx, 31, 36, 2, 2, P.amber);
  // an open one, with a goat
  doorFrame(ctx, 48, 2, beat + 1);
  rect(ctx, 51, 20, 28, 33, P.ink);
  rect(ctx, 51, 46, 28, 7, P.dusk);
  glow(ctx, 65, 48, 14, 3, P.silver, 0.18, 2);
  rect(ctx, 51, 20, 3, 33, P.crimson);
  const bleat = frameNo % 18 < 5;
  blit(ctx, bleat ? GOAT_BLEAT : GOAT, 53, 29);
}

function prisoners(ctx, frameNo) {
  rect(ctx, 0, 0, W, H, P.ink);
  for (let y = 0; y < 50; y += 7) {
    const off = (y / 7) % 2 ? 7 : 0;
    for (let x = -off; x < W; x += 14) {
      const n = hash(x, y, 2);
      rect(ctx, x + 1, y + 1, 13, 6, n > 0.85 ? P.dusk : P.night);
      rect(ctx, x + 1, y + 1, 12, 1, n > 0.85 ? P.slate : P.dusk);
    }
  }
  rect(ctx, 0, 50, W, 6, P.night);
  rect(ctx, 0, 50, W, 1, P.dusk);
  const flick = reduceMotion ? 0 : frameNo % 3;
  glow(ctx, 52, 16, 26 + flick, 24 + flick, P.orange, 0.09, 3);
  // the cell
  for (let y = 4; y < 50; y += 1) {
    const dy = 24 - y;
    const half = y >= 24 ? 21 : Math.sqrt(Math.max(0, 21 * 21 - dy * dy));
    if (half <= 0) continue;
    rect(ctx, 28 - half - 3, y, half * 2 + 6, 1, P.dusk);
    rect(ctx, 28 - half, y, half * 2, 1, P.ink);
  }
  const blinkNow = frameNo % 24 === 0;
  blit(ctx, PRISONER, 18, 18, { swap: { n: "o", B: "a" }, variant: "0" });
  if (blinkNow) {
    rect(ctx, 25, 23, 1, 2, P.skin);
    rect(ctx, 30, 23, 1, 2, P.skin);
  }
  for (let x = 10; x <= 46; x += 6) {
    const dy = Math.abs(x - 28);
    const top = Math.round(24 - Math.sqrt(Math.max(0, 21 * 21 - dy * dy))) + 1;
    rect(ctx, x - 1, top, 3, 50 - top, P.ink);
    rect(ctx, x, top, 1, 50 - top, P.slate);
  }
  rect(ctx, 7, 32, 42, 2, P.ink);
  rect(ctx, 7, 32, 42, 1, P.steel);
  // torch and jailer
  rect(ctx, 52, 14, 3, 9, P.brown);
  blit(ctx, FLAMES[reduceMotion ? 0 : frameNo % 3], 50, 4);
  blit(ctx, JAILER, 62, 22);
  blit(ctx, LANTERN, 60, 44);
  glow(ctx, 63, 48, 9, 7, P.yellow, 0.12, 2);
}

function miniCard(ctx, x, y, face) {
  box(ctx, x - 1, y - 1, 22, 30, P.ink, [1]);
  box(ctx, x, y, 20, 28, P.white, [1]);
  rect(ctx, x + 19, y + 1, 1, 26, P.silver);
  if (face) {
    blit(ctx, HEART, x + 4, y + 9);
    return;
  }
  rect(ctx, x + 2, y + 2, 16, 24, P.navy);
  for (let yy = 0; yy < 24; yy += 1) {
    for (let xx = 0; xx < 16; xx += 1) {
      if ((xx + yy) % 4 === 0 || (xx - yy + 64) % 4 === 0) rect(ctx, x + 2 + xx, y + 2 + yy, 1, 1, P.blue);
    }
  }
  rect(ctx, x + 9, y + 12, 2, 4, P.amber);
  rect(ctx, x + 8, y + 13, 4, 2, P.amber);
}

function cards(ctx, frameNo) {
  rect(ctx, 0, 0, W, H, P.deep);
  ellipse(ctx, 44, 30, 46, 30, P.pine);
  ellipse(ctx, 44, 30, 34, 22, P.leaf);
  rect(ctx, 0, 0, W, 3, P.brown);
  rect(ctx, 0, 3, W, 1, P.amber);
  rect(ctx, 0, 52, W, 4, P.brown);
  rect(ctx, 0, 51, W, 1, P.copper);
  ctx.save();
  ctx.globalAlpha = 0.5;
  box(ctx, 21, 18, 22, 30, P.ink, [1]);
  box(ctx, 47, 18, 22, 30, P.ink, [1]);
  ctx.restore();
  miniCard(ctx, 19, 15, true);
  miniCard(ctx, 45, 15, false);
  const bob = !reduceMotion && frameNo % 6 < 3 ? 1 : 0;
  box(ctx, 50, 1 + bob, 11, 12, P.ink, [1]);
  box(ctx, 51, 2 + bob, 9, 10, P.white, [1]);
  const q = [".000.", "0...0", "...0.", "..0..", ".....", "..0.."];
  q.forEach((row, ry) => {
    for (let rx = 0; rx < 5; rx += 1) if (row[rx] === "0") rect(ctx, 53 + rx, 4 + ry + bob, 1, 1, P.ink);
  });
  // chips
  [[10, 44, P.red, P.crimson], [76, 44, P.blue, P.navy]].forEach(([cx, cy, face, edge]) => {
    for (let k = 0; k < 3; k += 1) {
      ellipse(ctx, cx, cy - k * 2 + 1, 6, 3, P.ink);
      ellipse(ctx, cx, cy - k * 2, 5, 2, edge);
      ellipse(ctx, cx, cy - k * 2 - 1, 5, 2, face);
    }
  });
}

const PAINT = { doors, prisoners, cards };

export function Vignette({ kind }) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    let frameNo = 0;
    PAINT[kind](ctx, 0);
    if (reduceMotion) return undefined;
    const timer = setInterval(() => {
      frameNo += 1;
      PAINT[kind](ctx, frameNo);
    }, 160);
    return () => clearInterval(timer);
  }, [kind]);

  return <canvas ref={ref} className="vignette" width={W} height={H} aria-hidden="true" />;
}
