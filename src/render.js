import { PROBLEMS } from "./problems.js";
import { reveal } from "./logic.js";

const PERSON = ["甲", "乙", "丙"];
const PILE = ["甲堆", "乙堆", "丙堆"];
const DOOR_TEXT = { car: "车", goat: "羊" };

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function labelOf(problem, id) {
  return PROBLEMS[problem].decisions.find((item) => item.id === id)?.label || id;
}

function stepOf(session) {
  if (!session?.seal || session.pick === null) return null;
  if (session.phase === "pick" || session.phase === "talk" || session.phase === "think") return null;
  return reveal(session.problem, session.seal, session.pick);
}

function promptText(session, step) {
  const problem = session.problem;
  if (problem === "doors") {
    if (session.phase === "pick") return "选一扇门。";
    if (session.phase === "opening") return "主持人打开了一扇羊门。";
    if (session.phase === "decide") {
      return `主持人打开了 ${step.revealed + 1} 号门，后面是羊。换到 ${step.alternative + 1} 号门，还是留在 ${session.pick + 1} 号门？`;
    }
    const finalIsCar = session.seal.doors[step.finalPick] === "car";
    const how = session.decision === "switch" ? "换门" : "不换";
    return `你选了${how}。最终 ${step.finalPick + 1} 号门后面是${DOOR_TEXT[session.seal.doors[step.finalPick]]}。${finalIsCar ? "这轮获胜。" : "这轮没中。"}`;
  }
  if (problem === "prisoners") {
    if (session.phase === "talk") return "你们三个，明天有两个将被处决。谁被赦免，我不能说。";
    if (session.phase === "think") return "……";
    if (session.phase === "answer") return `好吧，告诉你也无妨。${PERSON[step.revealed]}会被处决。`;
    return morningLine(session.seal, step);
  }
  if (session.phase === "pick") return "选一堆。";
  if (session.phase === "one") return `这张是${step.shown}。`;
  return step.isSame ? `另一张也是${step.other}。` : `另一张是${step.other}。`;
}

function doorMark(session, step, index) {
  const open = session.phase === "result" || (step && index === step.revealed && session.phase !== "pick");
  if (!open) return String(index + 1);
  return DOOR_TEXT[session.seal.doors[index]];
}

function doorCaption(session, step, index) {
  if (session.phase === "opening" || session.phase === "decide") {
    if (index === session.pick) return "你的选择";
    if (step && index === step.revealed) return "主持人打开";
    return "还关着";
  }
  if (session.phase !== "result" || !step) return "";
  if (index === step.finalPick) return "最终选择";
  if (index === step.revealed) return "主持人打开";
  if (index === session.pick) return "最初的选择";
  return "没有选";
}

function renderDoors(session, step) {
  let html = "";
  for (let i = 0; i < 3; i += 1) {
    const yours = session.phase !== "pick" && session.phase !== "result" && i === session.pick;
    const finalPick = session.phase === "result" && step && i === step.finalPick;
    const open = session.phase === "result" || (step && i === step.revealed);
    const enabled = session.phase === "pick";
    const caption = doorCaption(session, step, i);
    const mark = doorMark(session, step, i);
    const cls = ["obj", "door", yours || finalPick ? "is-solid" : "", open ? "is-open" : ""].filter(Boolean).join(" ");
    html +=
      `<div class="slot">` +
      `<button type="button" class="${cls}" data-pick="${i}" aria-disabled="${enabled ? "false" : "true"}" tabindex="${enabled ? "0" : "-1"}" aria-label="${esc(`${i + 1} 号门${open ? `，${mark}` : ""}${caption ? `，${caption}` : ""}`)}">` +
      `<span class="obj-mark">${esc(mark)}</span>` +
      `</button>` +
      `<span class="cap">${esc(caption)}</span>` +
      `</div>`;
  }
  return html;
}

function fateText(session, step, index) {
  if (session.phase === "answer" && step && index === step.revealed) return "处决";
  if (session.phase === "result") return session.seal.fates[index];
  return "";
}

function renderPrisoners(session, step) {
  let html = "";
  for (let i = 0; i < 3; i += 1) {
    const fate = fateText(session, step, i);
    const you = i === 0 ? "你" : "";
    html +=
      `<div class="slot">` +
      `<div class="obj person${fate ? " has-fate" : ""}" aria-label="${esc(`${PERSON[i]}${you ? "，你" : ""}${fate ? `，${fate}` : ""}`)}">` +
      `<span class="role">${esc(you)}</span>` +
      `<span class="person-name">${PERSON[i]}</span>` +
      `<span class="person-fate">${esc(fate)}</span>` +
      `</div>` +
      `</div>`;
  }
  return html;
}

function cardFace(color) {
  if (!color) return `<span class="card is-back"></span>`;
  const tone = color === "红" ? "is-red" : "is-black";
  return `<span class="card ${tone}">${esc(color)}</span>`;
}

function renderCards(session, step) {
  let html = "";
  for (let i = 0; i < 3; i += 1) {
    const selected = session.pick === i && session.phase !== "pick";
    const showTop = selected;
    const showBottom = selected && session.phase === "result";
    const top = showTop ? session.seal.piles[i][session.seal.firstFlipIndex[i]] : "";
    const bottom = showBottom ? session.seal.piles[i][1 - session.seal.firstFlipIndex[i]] : "";
    let caption = PILE[i];
    if (selected && session.phase === "one") caption = "已翻开一张";
    if (selected && session.phase === "result") caption = step.isSame ? "相同" : "不同";
    const enabled = session.phase === "pick";
    html +=
      `<div class="slot">` +
      `<button type="button" class="pile${selected ? " is-chosen" : ""}" data-pick="${i}" aria-disabled="${enabled ? "false" : "true"}" tabindex="${enabled ? "0" : "-1"}" aria-label="${esc(`${PILE[i]}${top ? `，${top}` : ""}${bottom ? `，${bottom}` : ""}`)}">` +
      `<span class="cards${showBottom ? " is-revealed" : ""}">` +
      `<span class="under">${cardFace(bottom)}</span>` +
      `<span class="over">${cardFace(top)}</span>` +
      `</span>` +
      `</button>` +
      `<span class="cap">${esc(caption)}</span>` +
      `</div>`;
  }
  return html;
}

function figuresHtml(problem, record) {
  const meta = PROBLEMS[problem];
  return meta.decisions.map((decision) => {
    const bucket = record.stats[decision.id];
    const width = bucket.plays === 0 ? 0 : Math.round((bucket.wins / bucket.plays) * 100);
    const sub = meta.mode === "choice" ? `共 ${bucket.plays} 次` : `共 ${bucket.plays} 轮`;
    return (
      `<div class="fig">` +
      `<div class="fig-label">${esc(decision.label)}</div>` +
      `<div class="fig-num">${bucket.wins}</div>` +
      `<div class="fig-sub">${esc(sub)}</div>` +
      `<div class="bar" aria-hidden="true"><span style="width:${width}%"></span></div>` +
      `</div>`
    );
  }).join("");
}

function historyHtml(problem, record) {
  if (!record.history.length) return `<li class="empty">还没有完成的一轮。</li>`;
  const choice = PROBLEMS[problem].mode === "choice";
  return record.history.map((item) => {
    if (!choice) return `<li><span class="detail">${esc(item.detail)}</span></li>`;
    const tag = item.win ? "获胜" : "没中";
    const cls = item.win ? "is-win" : "is-lose";
    return `<li><span>${esc(labelOf(problem, item.decision))}</span><span class="${cls}">${tag}</span><span class="detail">${esc(item.detail)}</span></li>`;
  }).join("");
}

export function renderHome() {
  const entries = Object.entries(PROBLEMS).map(([id, problem], index) => (
    `<li><a class="entry" href="/${id}">` +
    `<span class="idx">${String(index + 1).padStart(2, "0")}</span>` +
    `<span class="entry-title">${esc(problem.title)}</span>` +
    `<span class="entry-intro">${esc(problem.intro)}</span>` +
    `</a></li>`
  )).join("");
  return `<main class="home"><h1>三个问题</h1><ol class="index">${entries}</ol></main>`;
}

export function renderSim(session, record) {
  const step = stepOf(session);
  if (session.phase === "result" && session.problem === "doors" && step) {
    const finalPick = session.decision === "stay" ? session.pick : step.alternative;
    step.finalPick = finalPick;
  }
  let stage = "";
  if (session.problem === "doors") stage = renderDoors(session, step);
  else if (session.problem === "prisoners") stage = renderPrisoners(session, step);
  else stage = renderCards(session, step);

  const speech = speechBox(session, step);
  const resetLabel = session.resetArmed ? "再点一次，确认清空" : "清空记录";
  return (
    `<main class="shell">` +
    `<header class="top">` +
    `<a class="back" href="/">返回</a>` +
    `<h1>${esc(PROBLEMS[session.problem].title)}</h1>` +
    `</header>` +
    `<div class="workspace">` +
    `<section class="play">` +
    `<div class="stage-wrap"><div class="stage">${stage}</div></div>` +
    speech +
    `</section>` +
    `<aside class="ledger">` +
    `<div class="ledger-pin">` +
    `<h2>记录</h2>` +
    `<div class="figures">${figuresHtml(session.problem, record)}</div>` +
    `<button type="button" class="reset${session.resetArmed ? " is-armed" : ""}" id="reset">${esc(resetLabel)}</button>` +
    `</div>` +
    `<div class="ledger-scroll">` +
    `<h3 class="recent-title">最近的轮次</h3>` +
    `<ol class="recent">${historyHtml(session.problem, record)}</ol>` +
    `</div>` +
    `</aside>` +
    `</div>` +
    `</main>`
  );
}

function speechBox(session, step) {
  const name = session.problem === "prisoners"
    ? (session.phase === "result" ? "第二天" : "狱卒")
    : session.problem === "doors" ? "主持人" : "";
  const thinking = session.phase === "think" ? " is-thinking" : "";
  let actions = "";
  if (session.problem === "prisoners" && session.phase === "talk") {
    actions = `<button type="button" class="choice" data-act="ask">问问乙和丙</button>`;
  } else if (session.problem === "prisoners" && session.phase === "answer") {
    actions = `<button type="button" class="choice" data-act="dawn">快进到明天</button>`;
  } else if (session.problem === "doors" && session.phase === "decide") {
    actions = PROBLEMS.doors.decisions.map((decision) => (
      `<button type="button" class="choice" data-decision="${decision.id}">${esc(decision.label)}</button>`
    )).join("");
  } else if (session.phase === "result") {
    const label = session.problem === "prisoners" ? "开始下一轮" : "下一轮";
    actions = `<button type="button" class="choice" id="next">${label}</button>`;
  }
  const who = name ? `<div class="speech-name">${name}</div>` : "";
  return (
    `<div class="speech${thinking}">` +
    who +
    `<p class="speech-text" aria-live="polite">${esc(promptText(session, step))}</p>` +
    `<div class="speech-actions">${actions}</div>` +
    `</div>`
  );
}

export function doorDetail(session, step) {
  const finalPick = session.decision === "stay" ? session.pick : step.alternative;
  return `最终 ${finalPick + 1} 号门是${DOOR_TEXT[session.seal.doors[finalPick]]}`;
}

export function morningLine(seal, step) {
  const other = PERSON[step.alternative];
  if (seal.fates[0] === "赦免") return `${other}被处决了。你被赦免。`;
  return `你被处决了。${other}被赦免。`;
}

export function prisonerDetail(seal, step) {
  const named = PERSON[step.revealed];
  return `${named}会被处决。${morningLine(seal, step)}`;
}

export function cardDetail(step) {
  return `${step.shown}，${step.other}。${step.isSame ? "相同" : "不同"}`;
}
