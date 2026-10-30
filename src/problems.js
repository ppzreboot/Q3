export const PROBLEMS = {
  doors: { mode: "choice", decisions: ["stay", "switch"] },
  prisoners: { mode: "observe", decisions: ["you", "other"] },
  cards: { mode: "choice", decisions: ["sameColor", "otherColor"] },
};

export const PROBLEM_IDS = Object.keys(PROBLEMS);

export const GITHUB = "https://github.com/ppzreboot/Q3";
