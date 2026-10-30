import { KEY, P } from "./pixel/palette.js";

function icon(rows) {
  const rects = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== ".") rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${KEY[ch]}"/>`);
    });
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rows[0].length}" height="${rows.length}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function speaker(muted) {
  const body = new Set();
  const add = (x, y) => body.add(`${x},${y}`);
  for (let y = 4; y <= 7; y += 1) for (let x = 1; x <= 3; x += 1) add(x, y);
  for (let y = 3; y <= 8; y += 1) add(4, y);
  for (let y = 2; y <= 9; y += 1) add(5, y);
  for (let y = 1; y <= 10; y += 1) add(6, y);
  const rects = [];
  const px = (x, y, c) => rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`);
  for (let y = 0; y < 12; y += 1) {
    for (let x = 0; x < 12; x += 1) {
      if (body.has(`${x},${y}`)) px(x, y, x === 6 || y === 4 ? P.white : P.silver);
      else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => body.has(`${x + dx},${y + dy}`))) px(x, y, P.ink);
    }
  }
  if (muted) {
    for (let i = 0; i < 4; i += 1) {
      px(8 + i, 4 + i, P.red);
      px(11 - i, 4 + i, P.red);
    }
  } else {
    for (let y = 4; y <= 7; y += 1) px(9, y, P.cyan);
    px(8, 3, P.cyan);
    px(8, 8, P.cyan);
    for (let y = 3; y <= 8; y += 1) px(11, y, P.cyan);
    px(10, 2, P.cyan);
    px(10, 9, P.cyan);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" shape-rendering="crispEdges">${rects.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const QUESTION_BLOCK = [
  ".0000000000.",
  "0yyyyyyyyya0",
  "0yaa6666aao0",
  "0ya66aa66ao0",
  "0yaaaaa66ao0",
  "0yaaaa66aao0",
  "0yaaa66aaao0",
  "0yaaaaaaaao0",
  "0yaaa66aaao0",
  "0yaaaaaaaao0",
  "0aooooooooo0",
  ".0000000000.",
];

// Nine-slice pixel frames for CSS border-image. bands go from the outside in,
// each [lit, shaded]; the corner is notched two steps deep.
function frame(bands, face) {
  const C = bands.length + 2;
  const N = C * 2 + 2;
  const rects = [];
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const dl = x;
      const dt = y;
      const dr = N - 1 - x;
      const db = N - 1 - y;
      const band = Math.min(dl, dt, dr, db, dl + dt - 2, dr + dt - 2, dl + db - 2, dr + db - 2);
      if (band < 0) continue;
      let color = face;
      if (band < bands.length) {
        const lit = Math.min(dt, dl) <= Math.min(db, dr);
        color = bands[band][lit ? 0 : 1];
      }
      if (color) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${N}" height="${N}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function stars() {
  const dots = [
    [5, 7, 1, P.dusk],
    [29, 3, 1, P.night],
    [41, 19, 2, P.night],
    [17, 31, 1, P.dusk],
    [36, 40, 1, P.slate],
    [9, 44, 2, P.night],
    [25, 22, 1, P.night],
  ];
  const rects = dots.map(([x, y, s, c]) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${c}"/>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" shape-rendering="crispEdges">${rects.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const ink = [P.ink, P.ink];

export const FRAMES = {
  "--frame-win": frame([ink, [P.silver, P.steel], [P.slate, P.dusk]], P.night),
  "--frame-gold": frame([ink, [P.yellow, P.amber], [P.copper, P.rust]], P.night),
  "--frame-red": frame([ink, [P.salmon, P.red], [P.crimson, P.umber]], P.night),
  "--frame-cyan": frame([ink, [P.cyan, P.blue], [P.navy, P.night]], P.night),
  "--frame-stage": frame([ink, [P.slate, P.dusk], [P.night, P.ink]], null),
  "--frame-btn": frame([ink, [P.slate, P.night]], P.dusk),
  "--frame-btn-hover": frame([ink, [P.steel, P.dusk]], P.slate),
  "--frame-btn-down": frame([ink, [P.night, P.slate]], P.dusk),
  "--frame-primary": frame([ink, [P.yellow, P.copper]], P.amber),
  "--frame-primary-hover": frame([ink, [P.white, P.orange]], P.yellow),
  "--frame-primary-down": frame([ink, [P.copper, P.yellow]], P.amber),
  "--frame-chip": frame([ink, [P.dusk, P.ink]], P.night),
  "--stars": stars(),
  "--icon-q": icon(QUESTION_BLOCK),
  "--icon-sound": speaker(false),
  "--icon-mute": speaker(true),
};

export function installFrames(root = document.documentElement) {
  for (const [name, value] of Object.entries(FRAMES)) root.style.setProperty(name, value);
}
