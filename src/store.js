import { PROBLEMS } from "./problems.js";

const STORAGE_KEY = "q3.experiment.v2";

function emptyStats(problem) {
  const stats = {};
  PROBLEMS[problem].decisions.forEach((decision) => {
    stats[decision.id] = { wins: 0, plays: 0 };
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
    const bucket = rec.stats[decision.id];
    return bucket && typeof bucket.wins === "number" && typeof bucket.plays === "number";
  });
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
          history: data.problems[id].history.slice(0, 30),
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
      console.warn("记录没能写入这台浏览器。", error);
    }
  }
}

export function clearRecord(store, problem) {
  store.problems[problem] = emptyProblem(problem);
}
