import { PROBLEMS } from "./problems.js";

const STORAGE_KEY = "q3.experiment.v2";

function emptyStats(problem) {
  const stats = {};
  PROBLEMS[problem].decisions.forEach((decision) => {
    stats[decision] = { wins: 0, plays: 0 };
  });
  return stats;
}

function emptyProblem(problem) {
  return { stats: emptyStats(problem), history: [] };
}

function freshStore() {
  return {
    version: 2,
    problems: {
      doors: emptyProblem("doors"),
      prisoners: emptyProblem("prisoners"),
      cards: emptyProblem("cards"),
    },
  };
}

function recordIsValid(problem, rec) {
  if (!rec || !rec.stats || !Array.isArray(rec.history)) return false;
  return PROBLEMS[problem].decisions.every((decision) => {
    const bucket = rec.stats[decision];
    return bucket && typeof bucket.wins === "number" && typeof bucket.plays === "number";
  });
}

const NAME_INDEX = { 甲: 0, 乙: 1, 丙: 2 };

// rounds saved before the history was structured only kept a Chinese sentence
function upgrade(id, item) {
  if (!item || typeof item.detail !== "string") return item;
  if (id === "doors" && item.final == null) {
    const m = item.detail.match(/^最终 (\d) 号门是(车|羊)$/);
    if (m) return { ...item, final: Number(m[1]) - 1, prize: m[2] === "车" ? "car" : "goat" };
  }
  if (id === "prisoners" && item.named == null) {
    let m = item.detail.match(/^(乙|丙)会被处决。(?:(乙|丙)被处决了。你被赦免。|你被处决了。(乙|丙)被赦免。)$/);
    if (m) {
      const youLive = Boolean(m[2]);
      return { ...item, named: NAME_INDEX[m[1]], other: NAME_INDEX[m[2] || m[3]], youLive };
    }
    m = item.detail.match(/^(乙|丙)被处决。(甲|乙|丙)被处决。(甲|乙|丙)被赦免。$/);
    if (m) {
      const youLive = m[3] === "甲";
      const other = youLive ? m[2] : m[3];
      return { ...item, named: NAME_INDEX[m[1]], other: NAME_INDEX[other], youLive };
    }
  }
  return item;
}

export function loadStore() {
  const store = freshStore();
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!data?.problems) return store;
    for (const id of Object.keys(PROBLEMS)) {
      if (recordIsValid(id, data.problems[id])) {
        store.problems[id] = {
          stats: data.problems[id].stats,
          history: data.problems[id].history.slice(0, 30).map((item) => upgrade(id, item)),
        };
      }
    }
    return store;
  } catch {
    return store;
  }
}

let warned = false;

export function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    if (!warned) {
      warned = true;
      console.warn("Could not save the record in this browser.", error);
    }
  }
}

export function clearRecord(store, problem) {
  store.problems[problem] = emptyProblem(problem);
}
