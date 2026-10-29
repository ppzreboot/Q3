function snapshot(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

const PERSON = ["甲", "乙", "丙"];
const PILE = ["甲堆", "乙堆", "丙堆"];

export function logSeal(problem, seal) {
  if (problem === "doors") {
    console.log(snapshot(seal.doors));
    const host = {};
    seal.hostOpensIfYouPick.forEach((open, pick) => {
      host[`选${pick + 1}`] = open + 1;
    });
    console.log(snapshot(host));
    return;
  }
  if (problem === "prisoners") {
    console.log(snapshot(seal.fates));
    console.log(`将告知${PERSON[seal.wardenNamesIfYouPick[0]]}`);
    return;
  }
  console.log(snapshot(seal.piles));
  const flips = {};
  seal.piles.forEach((pile, index) => {
    const flip = seal.firstFlipIndex[index];
    flips[PILE[index]] = { 两张牌: snapshot(pile), 先翻开下标: flip, 先翻开: pile[flip] };
  });
  console.log(snapshot(flips));
}

export function logPick(problem, pick, step) {
  if (problem === "doors") {
    console.log(`选了 ${pick + 1} 号门，打开 ${step.revealed + 1} 号门`);
    return;
  }
  if (problem === "cards") {
    console.log(`选了${PILE[pick]}，先翻${step.shown}`);
  }
}

export function logResult(problem, text) {
  console.log(text);
}
