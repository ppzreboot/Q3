export const PROBLEMS = {
  doors: {
    title: "三门问题",
    mode: "choice",
    intro:
      "三扇门里，一扇后面是车，另外两扇是羊。你先选一扇。主持人知道门后是什么，会打开剩下两扇里有羊的那一扇，再问你换不换。多做几轮，看换和不换各赢过几次。",
    decisions: [
      { id: "stay", label: "不换" },
      { id: "switch", label: "换门" },
    ],
  },
  prisoners: {
    title: "三囚徒问题",
    mode: "observe",
    intro:
      "你扮演甲。狱卒知道明天谁会被处决，但不会直接告诉你自己的命运。你可以问他乙和丙里谁会被处决，再快进到第二天。多做几轮，看你被赦免几次，以及没被点名的那个人被赦免几次。",
    decisions: [
      { id: "you", label: "甲被赦免" },
      { id: "other", label: "另一人被赦免" },
    ],
  },
  cards: {
    title: "三堆牌",
    mode: "observe",
    intro:
      "三堆牌，每堆两张：两张红、两张黑、一红一黑，左右随机。你选一堆。先翻开一张，停一下，再翻开另一张。多做几轮，看两张相同有几次，不同有几次。",
    decisions: [
      { id: "same", label: "两张相同" },
      { id: "different", label: "两张不同" },
    ],
  },
};

export const PROBLEM_IDS = Object.keys(PROBLEMS);
