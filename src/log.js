function snapshot(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function logSeal(problem, seal, t) {
  if (problem === "doors") {
    console.log(snapshot(seal.doors));
    const host = {};
    seal.hostOpensIfYouPick.forEach((open, pick) => {
      host[t.log.hostOpens(pick + 1)] = open + 1;
    });
    console.log(snapshot(host));
    return;
  }
  if (problem === "prisoners") {
    console.log(seal.fates.map((fate) => t.log.fates[fate]));
    console.log(t.log.willName(t.names[seal.wardenNamesIfYouPick[0]]));
    return;
  }
  console.log(seal.piles.map((pile) => pile.map((card) => t.colors[card])));
  const flips = {};
  seal.piles.forEach((pile, index) => {
    const flip = seal.firstFlipIndex[index];
    flips[t.piles[index]] = t.log.pile(
      pile.map((card) => t.colors[card]),
      flip,
      t.colors[pile[flip]],
    );
  });
  console.log(snapshot(flips));
}

export function logPick(problem, pick, step, t) {
  if (problem === "doors") {
    console.log(t.log.pickedDoor(pick + 1, step.revealed + 1));
    return;
  }
  if (problem === "cards") {
    console.log(t.log.pickedPile(t.piles[pick], t.colors[step.shown]));
  }
}

export function logResult(text) {
  console.log(text);
}
