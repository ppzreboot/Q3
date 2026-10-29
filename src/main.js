import "./styles.css";
import { PROBLEMS, PROBLEM_IDS } from "./problems.js";
import { assertSeal, judge, reveal, seal } from "./logic.js";
import { clearRecord, loadStore, saveStore } from "./store.js";
import { logPick, logResult, logSeal } from "./log.js";
import { cardDetail, doorDetail, prisonerDetail, renderHome, renderSim } from "./render.js";

const store = loadStore();
const app = document.querySelector("#app");
const timers = new Set();

let token = 0;
const session = {
  problem: "",
  phase: "pick",
  seal: null,
  pick: null,
  decision: null,
  resultShownAt: 0,
  resetArmed: false,
};

function pathProblem() {
  const name = location.pathname.replace(/\/+$/, "").split("/").pop();
  return PROBLEM_IDS.includes(name) ? name : "";
}

function waitMs(ms) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 180;
  return ms;
}

function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id);
    fn();
  }, waitMs(ms));
  timers.add(id);
}

function clearTimers() {
  for (const id of timers) clearTimeout(id);
  timers.clear();
}

function alive(my) {
  return my === token && session.problem === pathProblem();
}

function paint() {
  const problem = pathProblem();
  if (!problem) {
    document.title = "三个问题";
    app.innerHTML = renderHome();
    return;
  }
  document.title = PROBLEMS[problem].title;
  app.innerHTML = renderSim(session, store.problems[problem]);
}

function pushHistory(problem, item) {
  const history = store.problems[problem].history;
  history.unshift(item);
  if (history.length > 30) history.length = 30;
  saveStore(store);
}

function recordChoice(problem, decision, win, detail) {
  const bucket = store.problems[problem].stats[decision];
  bucket.plays += 1;
  if (win) bucket.wins += 1;
  pushHistory(problem, { decision, win, detail });
}

function recordObserve(problem, winnerId, detail) {
  const stats = store.problems[problem].stats;
  for (const decision of PROBLEMS[problem].decisions) {
    stats[decision.id].plays += 1;
    if (decision.id === winnerId) stats[decision.id].wins += 1;
  }
  pushHistory(problem, { decision: winnerId, detail });
}

function showDawn() {
  if (session.problem !== "prisoners" || session.phase !== "answer") return;
  const step = reveal("prisoners", session.seal, 0);
  const youPardoned = session.seal.fates[0] === "赦免";
  session.phase = "result";
  session.decision = youPardoned ? "you" : "other";
  session.resultShownAt = Date.now();
  const detail = prisonerDetail(session.seal, step);
  recordObserve("prisoners", session.decision, detail);
  logResult("prisoners", detail);
  paint();
}

function finishCards(my) {
  if (!alive(my) || session.phase !== "one") return;
  const step = reveal("cards", session.seal, session.pick);
  session.phase = "result";
  session.decision = step.isSame ? "same" : "different";
  session.resultShownAt = Date.now();
  const detail = cardDetail(step);
  recordObserve("cards", session.decision, detail);
  logResult("cards", detail);
  paint();
}

function begin(problem) {
  clearTimers();
  token += 1;
  const sealed = seal(problem);
  assertSeal(problem, sealed);
  session.problem = problem;
  session.seal = sealed;
  session.pick = problem === "prisoners" ? 0 : null;
  session.decision = null;
  session.resultShownAt = 0;
  session.resetArmed = false;
  session.phase = problem === "prisoners" ? "talk" : "pick";
  logSeal(problem, sealed);
  paint();
}

function leave() {
  clearTimers();
  token += 1;
  session.problem = "";
  session.seal = null;
  session.pick = null;
  session.decision = null;
  session.phase = "pick";
  session.resetArmed = false;
}

function syncRoute() {
  const problem = pathProblem();
  if (!problem) {
    leave();
    paint();
    return;
  }
  if (session.problem !== problem || !session.seal) begin(problem);
  else paint();
}

function go(pathname) {
  const next = pathname.replace(/\/+$/, "") || "/";
  const current = location.pathname.replace(/\/+$/, "") || "/";
  if (next === current) return;
  history.pushState(null, "", next);
  syncRoute();
}

function onPick(index) {
  if (session.phase !== "pick") return;
  if (session.problem === "prisoners") return;
  if (index !== 0 && index !== 1 && index !== 2) return;
  session.resetArmed = false;
  session.pick = index;
  const my = token;
  if (session.problem === "doors") {
    session.phase = "opening";
    const step = reveal("doors", session.seal, index);
    logPick("doors", index, step);
    paint();
    later(() => {
      if (!alive(my) || session.phase !== "opening") return;
      session.phase = "decide";
      paint();
    }, 800);
    return;
  }
  session.phase = "one";
  const step = reveal("cards", session.seal, index);
  logPick("cards", index, step);
  paint();
  later(() => finishCards(my), 1400);
}

function onAct(act) {
  if (session.problem !== "prisoners") return;
  if (act === "ask" && session.phase === "talk") {
    const my = token;
    session.phase = "think";
    paint();
    later(() => {
      if (!alive(my) || session.phase !== "think") return;
      session.phase = "answer";
      const step = reveal("prisoners", session.seal, 0);
      logResult("prisoners", `告知${["甲", "乙", "丙"][step.revealed]}`);
      paint();
    }, 1100);
    return;
  }
  if (act === "dawn") showDawn();
}

function onDecision(decision) {
  if (session.problem !== "doors" || session.phase !== "decide") return;
  if (!PROBLEMS.doors.decisions.some((item) => item.id === decision)) return;
  const outcome = judge("doors", session.seal, session.pick, decision);
  session.phase = "result";
  session.decision = decision;
  session.resultShownAt = Date.now();
  session.resetArmed = false;
  recordChoice("doors", decision, outcome.win, doorDetail(session, reveal("doors", session.seal, session.pick)));
  const how = decision === "switch" ? "换门" : "不换";
  logResult("doors", `${how}，最终 ${outcome.finalPick + 1} 号门是 ${outcome.token}，${outcome.win ? "获胜" : "没中"}`);
  paint();
}

function onNext() {
  if (session.phase !== "result") return;
  if (Date.now() - session.resultShownAt < 300) return;
  begin(session.problem);
}

function onReset() {
  if (!session.problem) return;
  if (!session.resetArmed) {
    session.resetArmed = true;
    paint();
    return;
  }
  clearRecord(store, session.problem);
  saveStore(store);
  session.resetArmed = false;
  paint();
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (link && link.origin === location.origin) {
    event.preventDefault();
    go(link.pathname);
    return;
  }
  const pick = event.target.closest("[data-pick]");
  if (pick && pick.getAttribute("aria-disabled") !== "true") {
    onPick(Number(pick.dataset.pick));
    return;
  }
  const decision = event.target.closest("[data-decision]");
  if (decision) {
    onDecision(decision.dataset.decision);
    return;
  }
  const act = event.target.closest("[data-act]");
  if (act) {
    onAct(act.dataset.act);
    return;
  }
  if (event.target.closest("#next")) {
    onNext();
    return;
  }
  if (event.target.closest("#reset")) onReset();
});

document.addEventListener("click", (event) => {
  if (!session.resetArmed) return;
  if (event.target.closest("#reset, [data-pick], [data-decision], #next, a[href]")) return;
  session.resetArmed = false;
  paint();
});

document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (session.phase !== "pick") return;
  if (event.key === "1" || event.key === "2" || event.key === "3") onPick(Number(event.key) - 1);
});

window.addEventListener("popstate", syncRoute);
syncRoute();
