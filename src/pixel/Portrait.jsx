import { useEffect, useRef } from "react";
import { P } from "./palette.js";
import { ellipse, glow, rect } from "./gfx.js";
import { blit } from "./sprite.js";
import { DEALER, DEALER_SWAP, HOST, JAILER, LANTERN, PRISONER_HAPPY } from "./sprites.js";
import { reduceMotion } from "./motion.js";

const S = 32;

function rays(ctx, a, b) {
  rect(ctx, 0, 0, S, S, a);
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const ang = Math.atan2(y - 30, x - 16);
      if (Math.floor((ang / (Math.PI * 2) + 1) * 16) % 2) rect(ctx, x, y, 1, 1, b);
    }
  }
}

function bricks(ctx) {
  rect(ctx, 0, 0, S, S, P.night);
  for (let y = 0; y < S; y += 6) {
    rect(ctx, 0, y, S, 1, P.ink);
    for (let x = (y / 6) % 2 ? 0 : 6; x < S; x += 12) rect(ctx, x, y, 1, 6, P.ink);
  }
}

function blink(ctx, frame, bob) {
  if (frame % 34 !== 0) return;
  rect(ctx, 13, 11 + bob, 1, 2, P.skin);
  rect(ctx, 18, 11 + bob, 1, 2, P.skin);
}

function draw(ctx, who, frame) {
  ctx.imageSmoothingEnabled = false;
  const bob = frame % 12 < 6 ? 0 : 1;
  if (who === "host") {
    rays(ctx, P.night, P.navy);
    rect(ctx, 0, 0, S, 3, P.crimson);
    for (let x = 1; x < S; x += 5) rect(ctx, x, 3, 2, 2, frame % 4 === x % 4 ? P.yellow : P.copper);
    blit(ctx, HOST, 6, 6 + bob);
    blink(ctx, frame, bob);
  } else if (who === "dealer") {
    rect(ctx, 0, 0, S, S, P.pine);
    ellipse(ctx, 16, 10, 22, 16, P.leaf);
    rect(ctx, 0, 27, S, 5, P.brown);
    rect(ctx, 0, 27, S, 1, P.clay);
    blit(ctx, DEALER, 6, 6 + bob, { swap: DEALER_SWAP, variant: "dealer" });
    blink(ctx, frame, bob);
  } else if (who === "jailer") {
    bricks(ctx);
    const flick = frame % 3;
    glow(ctx, 6, 26, 14 + flick, 12 + flick, P.orange, 0.12, 3);
    blit(ctx, JAILER, 6, 6 + bob);
    blink(ctx, frame, bob);
    blit(ctx, LANTERN, 2, 25);
  } else if (who === "you") {
    bricks(ctx);
    glow(ctx, 16, 16, 18, 18, P.yellow, 0.08, 3);
    const hop = frame % 4 < 2 ? 0 : -1;
    blit(ctx, PRISONER_HAPPY, 6, 6 + hop, { swap: { n: "o", B: "a" }, variant: "0" });
    if (frame % 6 < 3) rect(ctx, 27, 6, 2, 2, P.yellow);
    else rect(ctx, 3, 8, 2, 2, P.yellow);
  } else {
    const sky = [P.plum, P.mauve, P.salmon, P.orange, P.amber];
    sky.forEach((c, i) => rect(ctx, 0, i * 5, S, 5, c));
    ellipse(ctx, 16, 25, 9, 9, P.yellow);
    ellipse(ctx, 16, 25, 6, 6, P.white);
    rect(ctx, 0, 25, S, 7, P.night);
    rect(ctx, 0, 25, S, 1, P.dusk);
    for (let k = 0; k < 6; k += 1) {
      if ((frame + k) % 5 === 0) continue;
      rect(ctx, 3 + k * 5, 27 + (k % 2), 2, 1, P.salmon);
    }
  }
}

export function Portrait({ who }) {
  const ref = useRef(null);
  const whoRef = useRef(who);
  whoRef.current = who;

  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    let frame = 0;
    draw(ctx, whoRef.current, 0);
    const timer = setInterval(
      () => {
        if (!reduceMotion) frame += 1;
        draw(ctx, whoRef.current, frame);
      },
      reduceMotion ? 300 : 140,
    );
    return () => clearInterval(timer);
  }, []);

  return <canvas ref={ref} className="portrait" width={S} height={S} aria-hidden="true" />;
}
