import { useEffect, useRef, useState } from "react";
import { PROBLEMS } from "./problems.js";
import { assertSeal, judge, reveal, seal } from "./logic.js";
import { clearRecord, loadStore, saveStore } from "./store.js";
import { logPick, logResult, logSeal } from "./log.js";
import { useLang } from "./i18n.jsx";
import { play } from "./sound.js";
import { SiteHeader } from "./SiteHeader.jsx";
import { Stage } from "./pixel/Stage.jsx";
import { Portrait } from "./pixel/Portrait.jsx";

// the phases each step marker covers
const STEP_PHASES = {
  doors: [["pick"], ["announce", "opening"], ["decide"], ["result"]],
  prisoners: [["talk"], ["think"], ["answer"], ["gloat"], ["result"]],
  cards: [["pick"], ["flip"], ["guess"], ["result"]],
};

function waitMs(ms) {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 180 : ms;
}

function speakerOf(id, phase) {
  if (id === "doors") return "host";
  if (id === "cards") return "dealer";
  if (phase === "gloat") return "you";
  if (phase === "result") return "dawn";
  return "jailer";
}

function lineOf(t, id, phase, sealed, pick, decision) {
  if (id === "doors") {
    const T = t.doors;
    if (phase === "pick") return T.pick;
    if (phase === "announce") return T.announce(pick + 1);
    if (phase === "opening") return T.opening;
    const step = reveal("doors", sealed, pick);
    if (phase === "decide") return T.decide(step.revealed + 1, step.alternative + 1, pick + 1);
    const outcome = judge("doors", sealed, pick, decision);
    return T.result(decision === "switch", outcome.finalPick + 1, t.prizes[outcome.token], outcome.win);
  }
  if (id === "prisoners") {
    const T = t.prisoners;
    if (phase === "talk") return T.talk;
    if (phase === "think") return T.think;
    const step = reveal("prisoners", sealed, 0);
    if (phase === "answer") return T.answer(t.names[step.revealed]);
    if (phase === "gloat") return T.gloat(t.names[step.alternative]);
    return T.morning(sealed.fates[0] === "赦免", t.names[step.alternative]);
  }
  const T = t.cards;
  if (phase === "pick") return T.pick;
  if (phase === "flip") return T.flip;
  const step = reveal("cards", sealed, pick);
  if (phase === "guess") return T.guess(t.colors[step.shown]);
  return T.result(t.colors[step.other], judge("cards", sealed, pick, decision).win);
}

function sceneView(id, phase, sealed, pick, decision) {
  if (id === "doors") {
    const step = pick == null || phase === "pick" ? null : reveal("doors", sealed, pick);
    const shown = phase === "opening" || phase === "decide" || phase === "result";
    const finalPick = phase === "result" ? (decision === "stay" ? pick : step.alternative) : null;
    return {
      phase,
      interactive: phase === "pick",
      doors: [0, 1, 2].map((index) => ({
        open: phase === "result" || (shown && index === step.revealed),
        hot: phase === "result" ? index === finalPick : step != null && index === pick,
        content: phase === "result" || (shown && index === step.revealed) ? sealed.doors[index] : null,
        celebrate: phase === "result" && index === finalPick && sealed.doors[index] === "car",
      })),
    };
  }
  if (id === "prisoners") {
    const named = ["answer", "gloat", "result"].includes(phase) ? reveal("prisoners", sealed, 0).revealed : null;
    return { phase, revealed: named, fates: phase === "result" ? sealed.fates : null };
  }
  return {
    phase,
    interactive: phase === "pick",
    win: phase === "result" ? judge("cards", sealed, pick, decision).win : null,
    piles: [0, 1, 2].map((index) => {
      const chosen = pick === index && phase !== "pick";
      const flip = sealed.firstFlipIndex[index];
      return {
        top: sealed.piles[index][flip],
        bottom: sealed.piles[index][1 - flip],
        chosen,
        showTop: chosen || phase === "result",
        showBottom: phase === "result",
      };
    }),
  };
}

function historyText(t, id, item) {
  if (id === "doors" && item.final != null) return t.doors.history(item.final + 1, t.prizes[item.prize]);
  if (id === "prisoners" && item.named != null) {
    return t.prisoners.history(t.names[item.named], t.prisoners.morning(item.youLive, t.names[item.other]));
  }
  if (id === "cards" && item.shown) return t.cards.history(t.colors[item.shown], t.colors[item.other]);
  return item.detail || "";
}

function Story({ story }) {
  return story.map((para, index) =>
    para ? <p key={index}>{para}</p> : <div key={index} className="gap" />,
  );
}

export function Sim({ id }) {
  const problem = PROBLEMS[id];
  const { t } = useLang();
  const text = t.problems[id];
  const [store, setStore] = useState(loadStore);
  const [round, setRound] = useState(null);
  const [introOpen, setIntroOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const roundToken = useRef(0);
  const timers = useRef(new Set());
  const advanceRef = useRef(null);
  const serialRef = useRef(0);

  function clearTimers() {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current.clear();
  }

  function later(fn, ms) {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      fn();
    }, waitMs(ms));
    timers.current.add(timer);
  }

  function commit(recipe) {
    setStore((prev) => {
      const next = structuredClone(prev);
      recipe(next.problems[id]);
      if (next.problems[id].history.length > 30) next.problems[id].history.length = 30;
      saveStore(next);
      return next;
    });
  }

  function arm(my, ms, fn) {
    let done = false;
    const run = () => {
      if (done || my !== roundToken.current) return;
      done = true;
      advanceRef.current = null;
      clearTimers();
      fn();
    };
    advanceRef.current = run;
    later(run, ms);
  }

  function startRound() {
    clearTimers();
    advanceRef.current = null;
    roundToken.current += 1;
    serialRef.current += 1;
    const sealed = seal(id);
    assertSeal(id, sealed);
    logSeal(id, sealed, t);
    setRound({
      serial: serialRef.current,
      seal: sealed,
      phase: id === "prisoners" ? "talk" : "pick",
      pick: id === "prisoners" ? 0 : null,
      decision: null,
      waiting: false,
      resultAt: 0,
    });
  }

  useEffect(() => {
    startRound();
    return () => {
      roundToken.current += 1;
      clearTimers();
    };
    // restart when the problem changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setConfirmClear(false);
  }, [id]);

  useEffect(() => {
    if (!introOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setIntroOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [introOpen]);

  if (!round) return null;
  const { seal: sealed, phase, pick, decision, waiting } = round;
  const view = sceneView(id, phase, sealed, pick, decision);
  const record = store.problems[id];
  const speaker = speakerOf(id, phase);
  const stepIndex = STEP_PHASES[id].findIndex((phases) => phases.includes(phase));
  let tone = "";
  if (phase === "result") {
    const won = id === "prisoners" ? sealed.fates[0] === "赦免" : judge(id, sealed, pick, decision).win;
    tone = won ? "is-win" : "is-lose";
  }

  function patch(partial) {
    setRound((prev) => ({ ...prev, ...partial }));
  }

  function onPick(index) {
    if (phase !== "pick" || id === "prisoners") return;
    const my = roundToken.current;
    play("pick");
    if (id === "doors") {
      logPick("doors", index, reveal("doors", sealed, index), t);
      patch({ pick: index, phase: "announce", waiting: true });
      later(() => play("drumroll"), 200);
      arm(my, 2800, () => {
        patch({ phase: "opening" });
        arm(my, 2600, () => patch({ phase: "decide", waiting: false }));
      });
      return;
    }
    logPick("cards", index, reveal("cards", sealed, index), t);
    patch({ pick: index, phase: "flip", waiting: true });
    arm(my, 1600, () => patch({ phase: "guess", waiting: false }));
  }

  function ask() {
    if (phase !== "talk") return;
    const my = roundToken.current;
    play("click");
    patch({ phase: "think", waiting: true });
    later(() => play("tick"), 150);
    arm(my, 2600, () => {
      const step = reveal("prisoners", sealed, 0);
      logResult(t.prisoners.answer(t.names[step.revealed]));
      play("ominous");
      patch({ phase: "answer" });
      arm(my, 2800, () => {
        play("gloat");
        patch({ phase: "gloat", waiting: false });
      });
    });
  }

  function dawn() {
    if (phase !== "gloat") return;
    play("dawn");
    const step = reveal("prisoners", sealed, 0);
    const youLive = sealed.fates[0] === "赦免";
    const winner = youLive ? "you" : "other";
    commit((rec) => {
      for (const key of PROBLEMS.prisoners.decisions) {
        rec.stats[key].plays += 1;
        if (key === winner) rec.stats[key].wins += 1;
      }
      rec.history.unshift({ decision: winner, named: step.revealed, other: step.alternative, youLive });
    });
    logResult(t.prisoners.morning(youLive, t.names[step.alternative]));
    patch({ phase: "result", decision: winner, resultAt: Date.now() });
  }

  function choose(next) {
    if (phase !== "decide") return;
    play("click");
    const outcome = judge("doors", sealed, pick, next);
    commit((rec) => {
      rec.stats[next].plays += 1;
      if (outcome.win) rec.stats[next].wins += 1;
      rec.history.unshift({ decision: next, win: outcome.win, final: outcome.finalPick, prize: outcome.token });
    });
    logResult(t.doors.result(next === "switch", outcome.finalPick + 1, t.prizes[outcome.token], outcome.win));
    patch({ phase: "result", decision: next, resultAt: Date.now() });
  }

  function guess(next) {
    if (phase !== "guess") return;
    play("click");
    const outcome = judge("cards", sealed, pick, next);
    commit((rec) => {
      rec.stats[next].plays += 1;
      if (outcome.win) rec.stats[next].wins += 1;
      rec.history.unshift({ decision: next, win: outcome.win, shown: outcome.shown, other: outcome.other });
    });
    logResult(t.cards.result(t.colors[outcome.other], outcome.win));
    patch({ phase: "result", decision: next, resultAt: Date.now() });
  }

  let actions = null;
  if (waiting) {
    actions = (
      <button
        className="btn primary"
        type="button"
        onClick={() => {
          play("click");
          advanceRef.current?.();
        }}
      >
        {t.next}
      </button>
    );
  } else if (id === "prisoners" && phase === "talk") {
    actions = (
      <button className="btn primary" type="button" onClick={ask}>
        {t.prisoners.ask}
      </button>
    );
  } else if (id === "prisoners" && phase === "gloat") {
    actions = (
      <button className="btn primary" type="button" onClick={dawn}>
        {t.prisoners.tomorrow}
      </button>
    );
  } else if (phase === "pick") {
    const labels = id === "doors" ? [1, 2, 3].map((n) => t.door(n)) : t.piles;
    actions = labels.map((label, index) => (
      <button key={label} className="btn" type="button" onClick={() => onPick(index)}>
        {label}
      </button>
    ));
  } else if (id === "doors" && phase === "decide") {
    actions = (
      <>
        <button className="btn" type="button" onClick={() => choose("stay")}>
          {t.doors.stay}
        </button>
        <button className="btn primary" type="button" onClick={() => choose("switch")}>
          {t.doors.switch}
        </button>
      </>
    );
  } else if (id === "cards" && phase === "guess") {
    const shown = reveal("cards", sealed, pick).shown;
    actions = ["红", "黑"].map((color) => {
      const same = color === shown;
      return (
        <button key={color} className="btn" type="button" onClick={() => guess(same ? "sameColor" : "otherColor")}>
          {same ? t.cards.same(t.colors[color]) : t.cards.other(t.colors[color])}
        </button>
      );
    });
  } else if (phase === "result") {
    actions = (
      <button
        className="btn primary"
        type="button"
        onClick={() => {
          if (Date.now() - round.resultAt < 300) return;
          play("click");
          startRound();
        }}
      >
        {t.nextRound}
      </button>
    );
  }

  return (
    <div className="sim">
      <SiteHeader title={text.title} onIntro={() => setIntroOpen(true)} />
      <div className="sim-body">
        <div className="sim-main">
          <div className="stage-wrap">
            <Stage id={id} serial={round.serial} view={view} onPick={onPick} text={t} />
          </div>
          <section className={`dialogue frame ${tone}`} aria-live="polite">
            <div className="pips">
              {t.steps[id].map((label, index) => (
                <span key={label} className={index === stepIndex ? "on" : index < stepIndex ? "done" : undefined}>
                  {label}
                </span>
              ))}
            </div>
            <div className="dialogue-row">
              <Portrait who={speaker} />
              <div className="dialogue-copy">
                <div className="speaker">{t.speakers[speaker]}</div>
                <p className="line">
                  {lineOf(t, id, phase, sealed, pick, decision)}
                  {waiting ? <i className="caret" aria-hidden="true" /> : null}
                </p>
              </div>
              <div className="actions">{actions}</div>
            </div>
          </section>
        </div>
        <aside className="ledger">
          <h2>{t.record}</h2>
          {problem.decisions.map((key, index) => {
            const bucket = record.stats[key];
            const rate = bucket.plays ? Math.round((bucket.wins / bucket.plays) * 100) : null;
            return (
              <div key={key} className="stat">
                <div className="stat-label">{text.decisions[key]}</div>
                <div className="stat-value">
                  {bucket.wins}
                  <span> / {bucket.plays}</span>
                  <span className="stat-rate">{rate == null ? "—" : `${rate}%`}</span>
                </div>
                <div className={`bar bar-${index}`}>
                  <i style={{ width: rate == null ? 0 : `${rate}%` }} />
                </div>
              </div>
            );
          })}
          {confirmClear ? (
            <div className="confirm">
              <span>{t.clearAsk}</span>
              <button
                className="btn danger"
                type="button"
                onClick={() => {
                  const next = structuredClone(store);
                  clearRecord(next, id);
                  saveStore(next);
                  setStore(next);
                  setConfirmClear(false);
                }}
              >
                {t.clearYes}
              </button>
              <button className="btn" type="button" onClick={() => setConfirmClear(false)}>
                {t.cancel}
              </button>
            </div>
          ) : (
            <button className="btn danger" type="button" onClick={() => setConfirmClear(true)}>
              {t.clear}
            </button>
          )}
          <h3>{t.recent}</h3>
          {record.history.length === 0 ? (
            <p className="empty">{t.empty}</p>
          ) : (
            <ul className="history">
              {record.history.map((item, index) => (
                <li key={`${index}-${item.decision}`} className={`pick-${problem.decisions.indexOf(item.decision)}`}>
                  {problem.mode === "choice" ? (
                    <div className="h-title">
                      {text.decisions[item.decision]} ·{" "}
                      <span className={item.win ? "won" : undefined}>{item.win ? t.won : t.lost}</span>
                    </div>
                  ) : null}
                  <div className="h-detail">{historyText(t, id, item)}</div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
      {introOpen ? (
        <div className="scrim" onClick={() => setIntroOpen(false)}>
          <div
            className="modal frame"
            role="dialog"
            aria-modal="true"
            aria-labelledby="intro-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="intro-title">{text.title}</h2>
              <button className="text-btn" type="button" onClick={() => setIntroOpen(false)}>
                {t.close}
              </button>
            </div>
            <div className="story">
              <Story story={text.story} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
