import { KEY, P } from "./palette.js";
import { canvas } from "./gfx.js";

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}

const GRAYS = ["1", "2", "3", "4"];

// cold, desaturated version of any sprite
export const GHOST = Object.fromEntries(
  Object.entries(KEY).map(([ch, hex]) => {
    const l = luminance(hex) / 255;
    return [ch, GRAYS[Math.min(GRAYS.length - 1, Math.floor(l * GRAYS.length))]];
  }),
);

export function build(rows, opts = {}) {
  const { outline = true, swap = null, outlineColor = P.ink } = opts;
  const h = rows.length;
  const w = Math.max(...rows.map((row) => row.length));
  const pad = outline ? 1 : 0;
  const c = canvas(w + pad * 2, h + pad * 2);
  const g = c.getContext("2d");
  const at = (x, y) => (y >= 0 && y < h && x >= 0 && x < rows[y].length ? rows[y][x] : ".");
  for (let y = -pad; y < h + pad; y += 1) {
    for (let x = -pad; x < w + pad; x += 1) {
      const ch = at(x, y);
      let color = null;
      if (ch !== ".") {
        const key = (swap && swap[ch]) || ch;
        color = KEY[key] || key;
      } else if (
        outline &&
        (at(x - 1, y) !== "." || at(x + 1, y) !== "." || at(x, y - 1) !== "." || at(x, y + 1) !== ".")
      ) {
        color = outlineColor;
      }
      if (color) {
        g.fillStyle = color;
        g.fillRect(x + pad, y + pad, 1, 1);
      }
    }
  }
  return c;
}

const cache = new Map();

export function sprite(def, variant = "", swap = null) {
  const key = def;
  let byVariant = cache.get(key);
  if (!byVariant) {
    byVariant = new Map();
    cache.set(key, byVariant);
  }
  let c = byVariant.get(variant);
  if (!c) {
    c = build(def.rows, { outline: def.outline !== false, swap, outlineColor: def.outlineColor });
    byVariant.set(variant, c);
  }
  return c;
}

// x, y: top-left of the art (the outline sits one pixel outside)
export function blit(ctx, def, x, y, opts = {}) {
  const { flip = false, swap = null, variant = "", alpha = 1 } = opts;
  const img = sprite(def, variant, swap);
  const pad = def.outline === false ? 0 : 1;
  const dx = Math.round(x) - pad;
  const dy = Math.round(y) - pad;
  if (alpha < 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
  }
  if (flip) {
    ctx.save();
    ctx.translate(dx + img.width, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(img, dx, dy);
  }
  if (alpha < 1) ctx.restore();
}
