const CAR = "car";
const GOAT = "goat";
const PARDON = "赦免";
const DOOM = "处决";
const RED = "红";
const BLACK = "黑";

function fail(message) {
  throw new Error(message);
}

export function randomInt(n) {
  if (!Number.isInteger(n) || n <= 0 || n > 0x100000000) fail("n");
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    return Math.floor(Math.random() * n);
  }
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  let value = 0;
  do {
    cryptoObj.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % n;
}

function shuffle(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.keys(value).forEach((key) => freeze(value[key]));
  return value;
}

function remaining(pick, revealed) {
  const rest = [0, 1, 2].filter((index) => index !== pick && index !== revealed);
  if (rest.length !== 1) fail("没有唯一的剩余选项");
  return rest[0];
}

function assertPick(pick) {
  if (pick !== 0 && pick !== 1 && pick !== 2) fail("选择必须是 0、1 或 2");
}

function sealDoors() {
  const doors = shuffle([CAR, GOAT, GOAT]);
  const goats = [];
  doors.forEach((door, index) => {
    if (door === GOAT) goats.push(index);
  });
  const hostOpensIfYouPick = doors.map((door, pick) => {
    if (door === CAR) return goats[randomInt(goats.length)];
    return goats.find((index) => index !== pick);
  });
  return freeze({ doors, hostOpensIfYouPick });
}

function sealPrisoners() {
  const fates = shuffle([PARDON, DOOM, DOOM]);
  const doomed = [];
  fates.forEach((fate, index) => {
    if (fate === DOOM) doomed.push(index);
  });
  const wardenNamesIfYouPick = fates.map((fate, pick) => {
    if (fate === PARDON) return doomed[randomInt(doomed.length)];
    return doomed.find((index) => index !== pick);
  });
  return freeze({ fates, wardenNamesIfYouPick });
}

function sealCards() {
  const piles = shuffle([
    shuffle([RED, RED]),
    shuffle([BLACK, BLACK]),
    shuffle([RED, BLACK]),
  ]);
  return freeze({
    piles,
    firstFlipIndex: [randomInt(2), randomInt(2), randomInt(2)],
  });
}

export function seal(problem) {
  if (problem === "doors") return sealDoors();
  if (problem === "prisoners") return sealPrisoners();
  if (problem === "cards") return sealCards();
  fail("未知问题");
}

export function assertSeal(problem, sealed) {
  if (problem === "doors") {
    if (!sealed || sealed.doors?.length !== 3) fail("门的布局无效");
    const cars = sealed.doors.filter((door) => door === CAR).length;
    const goats = sealed.doors.filter((door) => door === GOAT).length;
    if (cars !== 1 || goats !== 2) fail("必须是一辆车、两只羊");
    if (sealed.hostOpensIfYouPick?.length !== 3) fail("主持人的记录无效");
    sealed.hostOpensIfYouPick.forEach((open, pick) => {
      if (open !== 0 && open !== 1 && open !== 2) fail("主持人打开的门无效");
      if (open === pick) fail("主持人不能打开你选的门");
      if (sealed.doors[open] !== GOAT) fail("主持人必须打开羊门");
      if (sealed.doors[pick] === GOAT) {
        const otherGoat = sealed.doors.findIndex((door, index) => door === GOAT && index !== pick);
        if (open !== otherGoat) fail("你选中羊时，主持人只能打开另一扇羊门");
      }
    });
    return;
  }

  if (problem === "prisoners") {
    if (!sealed || sealed.fates?.length !== 3) fail("囚犯的布局无效");
    const pardons = sealed.fates.filter((fate) => fate === PARDON).length;
    const dooms = sealed.fates.filter((fate) => fate === DOOM).length;
    if (pardons !== 1 || dooms !== 2) fail("必须是一人赦免、两人处决");
    if (sealed.wardenNamesIfYouPick?.length !== 3) fail("看守的记录无效");
    sealed.wardenNamesIfYouPick.forEach((named, pick) => {
      if (named !== 0 && named !== 1 && named !== 2) fail("看守指出的人无效");
      if (named === pick) fail("看守不能指出你押的人");
      if (sealed.fates[named] !== DOOM) fail("看守必须指出将被处决的人");
      if (sealed.fates[pick] === DOOM) {
        const otherDoom = sealed.fates.findIndex((fate, index) => fate === DOOM && index !== pick);
        if (named !== otherDoom) fail("你押中处决者时，看守只能指出另一个处决者");
      }
    });
    return;
  }

  if (problem === "cards") {
    if (!sealed || sealed.piles?.length !== 3) fail("牌堆无效");
    const signature = sealed.piles
      .map((pile) => {
        if (!Array.isArray(pile) || pile.length !== 2) fail("每堆必须是两张牌");
        return pile.slice().sort().join("+");
      })
      .sort()
      .join("|");
    if (signature !== "红+红|红+黑|黑+黑") fail("三堆必须是红红、黑黑、红黑");
    if (sealed.firstFlipIndex?.length !== 3) fail("翻牌记录无效");
    sealed.firstFlipIndex.forEach((index) => {
      if (index !== 0 && index !== 1) fail("先翻开的下标必须是 0 或 1");
    });
    return;
  }

  fail("未知问题");
}

export function reveal(problem, sealed, pick) {
  assertPick(pick);
  if (problem === "doors") {
    const opened = sealed.hostOpensIfYouPick[pick];
    if (sealed.doors[opened] !== GOAT || opened === pick) fail("主持人的记录与布局矛盾");
    return { revealed: opened, alternative: remaining(pick, opened) };
  }
  if (problem === "prisoners") {
    const named = sealed.wardenNamesIfYouPick[pick];
    if (sealed.fates[named] !== DOOM || named === pick) fail("看守的记录与布局矛盾");
    return { revealed: named, alternative: remaining(pick, named) };
  }
  if (problem === "cards") {
    const shownIndex = sealed.firstFlipIndex[pick];
    const shown = sealed.piles[pick][shownIndex];
    const other = sealed.piles[pick][1 - shownIndex];
    return { shownIndex, shown, other, isSame: shown === other };
  }
  fail("未知问题");
}

export function judge(problem, sealed, pick, decision) {
  const step = reveal(problem, sealed, pick);
  if (problem === "cards") {
    if (decision !== "same" && decision !== "different") fail("牌的选择无效");
    return {
      ...step,
      decision,
      win: decision === "same" ? step.isSame : !step.isSame,
    };
  }
  if (decision !== "stay" && decision !== "switch") fail("选择无效");
  const finalPick = decision === "stay" ? pick : step.alternative;
  const token = problem === "doors" ? sealed.doors[finalPick] : sealed.fates[finalPick];
  const win = problem === "doors" ? token === CAR : token === PARDON;
  return { ...step, finalPick, token, decision, win };
}
