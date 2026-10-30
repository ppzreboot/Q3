function edit(rows, patches) {
  const out = rows.slice();
  for (const [y, x, chars] of patches) {
    const row = out[y].split("");
    for (let i = 0; i < chars.length; i += 1) row[x + i] = chars[i];
    out[y] = row.join("");
  }
  return out;
}

const HOST_IDLE = [
  "......11111111......",
  ".....1123321111.....",
  "....112332111111....",
  "....11ssssssss11....",
  "....1sssssssssS1....",
  "...s1ss0ssss0sS1S...",
  "...s1ss0ssss0sS1S...",
  "....ssksssssskSS....",
  "....ssss0660ssSS....",
  ".....ssss00ssSS.....",
  "......ssssssSS......",
  "........SSSS........",
  ".....nn6rRRr6nn.....",
  "...Bnn16rRRr61nn1...",
  "..Bnnn15666651nnn1..",
  "..Bnnnn156651nnnn1..",
  "..Bnnnnn1661nnnnn1..",
  "..Bnnnnnn11nnnnnn1..",
  "..Bnnnnnnaannnnnn1..",
  "..Bnnnnnnnnnnnnnn1..",
  "..Bnnnnnnaannnnnn1..",
  "..ssnnnnnnnnnnnnSS..",
  "..ssnnnnnnnnnnnnSS..",
  "....nnnnnnnnnnnn....",
  "....1nnnnnnnnnn1....",
  ".....2111111111.....",
  ".....2111111111.....",
  ".....2111..2111.....",
  ".....2111..2111.....",
  ".....2111..2111.....",
  ".....2111..2111.....",
  ".....2111..2111.....",
  ".....2111..2111.....",
  ".....2111..2111.....",
  "....13111..11131....",
  "....11111..11111....",
];

const HOST_PRESENT = edit(HOST_IDLE, [
  [7, 0, "ss"],
  [8, 0, "ss"],
  [9, 0, "66"],
  [10, 1, "Bn"],
  [11, 2, "Bn"],
  [12, 3, "Bn"],
  [14, 2, ".."],
  [15, 2, ".."],
  [16, 2, ".."],
  [17, 2, ".."],
  [18, 2, ".."],
  [19, 2, ".."],
  [20, 2, ".."],
  [21, 2, ".."],
  [22, 2, ".."],
]);

export const HOST = { rows: HOST_IDLE };
export const HOST_POINT = { rows: HOST_PRESENT };

// the host's build with a green visor; recolour the suit with DEALER_SWAP
export const DEALER = {
  rows: edit(HOST_IDLE, [
    [2, 4, "qGGGGGGGGGGq"],
    [3, 3, "gggggggggggggg"],
  ]),
};
export const DEALER_SWAP = { n: "R", B: "r", r: "1", R: "0" };

const GOAT_ROWS = [
  "..............tt..........",
  "...............tc.........",
  "................tc........",
  ".................66666....",
  "................6666666...",
  ".............55566660666..",
  "..............55666666666.",
  "..66............66666666k.",
  "...66...........66666555..",
  "....666666666666666655....",
  "...666666666666666.55.....",
  "...666666666666655.55.....",
  "...566666666666655.5......",
  "...566666666666655........",
  "....5666666666655.........",
  "....4555555555544.........",
  ".....56.56...56.56........",
  ".....56.56...56.56........",
  ".....56.56...56.56........",
  ".....22.22...22.22........",
];

export const GOAT = { rows: GOAT_ROWS };
export const GOAT_BLEAT = { rows: edit(GOAT_ROWS, [[7, 23, "0k"], [8, 21, "505"]]) };
export const GOAT_BLINK = { rows: edit(GOAT_ROWS, [[5, 20, "5"]]) };

export const CAR = {
  rows: [
    "...................rrrrrrrrrrrrr....................",
    ".................rrkkkkkkkkkkkkkr...................",
    "................rrCCCC6CC1CCCCCCrr..................",
    "...............rrCCC66CCC1CCCCCCCrr.................",
    "..............rrBCC66CCCC1CCCCCCCCCrr................",
    ".............rrBBBCCCCCCC1CCCCCCCCCBrrrrrr..........",
    "....rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr...",
    "..rrkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkrrr..",
    ".prrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrryyy.",
    ".prrrrrrrrrrrrrrrrrrrRrrrrrrrrrrrrrrrrrrrrrrrrrrryy6.",
    ".RRrrrrrrrrrrrrrrrrrrRrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr.",
    ".RRRRRR00000RRRRRRRRRRRRRRRRRRRRRRR00000RRRRRRRRRRRR.",
    "..RRRR0000000RRRRRRRRRRRRRRRRRRRRR0000000RRRRRRRRRR..",
    "...55R0033300RR5555555555555555RRR0033300R55555555...",
    ".....00355530..................00355530.............",
    ".....00355530..................00355530.............",
    ".....00033300..................00033300.............",
    "......0000000...................0000000.............",
    "........000.......................000...............",
  ],
};

const PRISONER_ROWS = [
  "......u.uu.u.u......",
  ".....uubbbbbbuu.....",
  "....ubbbbbbbbbbu....",
  "....ubsbbssbbsbu....",
  "....bsssssssssSb....",
  "...sbss0ssss0sSbS...",
  "...sbss0ssss0sSbS...",
  "....sssssssssSSS....",
  "....sssss00ssSSS....",
  ".....sssSsSssSS.....",
  "......ssSSSSSS......",
  "........SSSS........",
  ".....6666666655.....",
  "...BBnnnnnnnnnnn1...",
  "..6666666666666555..",
  "..BBnnnnnnnnnnnnn1..",
  "..6666666666666555..",
  "..BBnnnnnnnnnnnnn1..",
  "..6666666666666555..",
  "..ssnnnnnnnnnnnnSS..",
  "..ss666666666655SS..",
  "....nnnnnnnnnnnn....",
  ".....3222222221.....",
  ".....3222..3221.....",
  ".....3222..3221.....",
  ".....3222..3221.....",
  ".....3222..3221.....",
  ".....3222..3221.....",
  ".....3222..3221.....",
  ".....3222..3221.....",
  "....sssS....Ssss....",
];

export const PRISONER = { rows: PRISONER_ROWS };
export const PRISONER_HAPPY = {
  rows: edit(PRISONER_ROWS, [
    [6, 6, "0s0"],
    [6, 11, "0s0"],
    [7, 5, "k"],
    [7, 14, "k"],
    [8, 8, "0660"],
    [9, 9, "00"],
  ]),
};
export const NOTE = {
  rows: ["..yy", "..yy", "..y.", "..y.", "yyy.", "yyy."],
};
export const PRISONER_DOWN = {
  rows: edit(PRISONER_ROWS, [
    [5, 7, "S"],
    [5, 12, "S"],
    [9, 8, "0"],
    [9, 11, "0"],
  ]),
};

export const JAILER = {
  rows: [
    "......22222222......",
    ".....2333222222.....",
    "....22222aa22222....",
    "...00000000000000...",
    "....1sssssssssS1....",
    "...s1ss0ssss0sS1S...",
    "...s1ss0ssss0sS1S...",
    "....sssssSSsssSS....",
    "....ssuuuuuuuuSS....",
    ".....suussssuuS.....",
    "......ssssssSS......",
    "........SSSS........",
    ".....RRrrrrrRRR.....",
    "...rRRrrrarrrRRR1...",
    "..rrRRrrrrrrrRRRR1..",
    "..rrRRrrrarrrRRRR1..",
    "..rrRRrrrrrrrRRRR1..",
    "..rrRRrrrarrrRRRR1..",
    "..rruuuuuaauuuuRR1..",
    "..ssRRrrrrrrrRRaSS..",
    "..ssRRrrrrrrrRyaySS.",
    "....RRrrrrrrrRRaa...",
    "....RRrrrrrrrRRR....",
    ".....2111111111.....",
    ".....2111111111.....",
    ".....2111..2111.....",
    ".....2111..2111.....",
    ".....2111..2111.....",
    ".....2111..2111.....",
    ".....bbuu..bbuu.....",
    "....bbuuu..buuuu....",
    "....uuuuu..uuuuu....",
  ],
};

export const LANTERN = {
  rows: [
    "..22..",
    ".2..2.",
    "222222",
    "2yyyy2",
    "2yaay2",
    "2yaay2",
    "2yyyy2",
    "222222",
    ".2222.",
  ],
};

export const FLAMES = [
  {
    outline: false,
    rows: [
      "...o...",
      "...oa..",
      "..oa...",
      "..aya..",
      ".oayao.",
      ".ayyya.",
      "oayyyao",
      "oayyyao",
      ".oaaao.",
      "..ooo..",
    ],
  },
  {
    outline: false,
    rows: [
      "..o....",
      "..ao...",
      "...ao..",
      "..aya..",
      ".oaya..",
      ".ayyyao",
      "oayyyao",
      "oayyyao",
      ".oaaao.",
      "..ooo..",
    ],
  },
  {
    outline: false,
    rows: [
      ".......",
      "....o..",
      "...oa..",
      "..oyao.",
      ".oayao.",
      ".ayyya.",
      "oayyyao",
      "oayyyao",
      ".oaaao.",
      "..ooo..",
    ],
  },
];

export const HEART = {
  outline: false,
  rows: [
    ".rrr...rrr.",
    "rkkrr.rrrrr",
    "rkrrrrrrrrr",
    "rrrrrrrrrrr",
    "rrrrrrrrrrR",
    ".rrrrrrrrR.",
    "..rrrrrrR..",
    "...rrrrR...",
    "....rrR....",
    ".....R.....",
  ],
};

export const SPADE = {
  outline: false,
  rows: [
    ".....0.....",
    "....000....",
    "...00000...",
    "..0020000..",
    ".002000000.",
    "00200000000",
    "00000000000",
    "00000000000",
    ".000.0.000.",
    ".....0.....",
    "....000....",
    "...00000...",
  ],
};

export const CLUB = {
  outline: false,
  rows: [
    "....000....",
    "...00000...",
    "...00000...",
    ".00.000.00.",
    "00000000000",
    "00000000000",
    ".00..0..00.",
    ".....0.....",
    "....000....",
  ],
};

export const DIAMOND = {
  outline: false,
  rows: [
    "....0....",
    "...000...",
    "..00000..",
    ".0000000.",
    "000000000",
    ".0000000.",
    "..00000..",
    "...000...",
    "....0....",
  ],
};

export const HEART_SMALL = {
  outline: false,
  rows: ["rr.rr", "rrrrr", ".rrr.", "..r.."],
};

export const SPADE_SMALL = {
  outline: false,
  rows: ["..0..", ".000.", "00000", "00000", "..0..", ".000."],
};

export const STAR = {
  rows: [
    "....y....",
    "...yaa...",
    "yaaaaaaao",
    ".yaaaaao.",
    "..aaaao..",
    ".aaaoaao.",
    ".ao...ao.",
  ],
};

export const DIGITS = {
  1: {
    rows: [
      "..yaa..",
      ".yaaa..",
      "yaaaa..",
      "..aaa..",
      "..aaa..",
      "..aaa..",
      "..aaa..",
      "..aaa..",
      "..aao..",
      "yaaaaaa",
      "ooooooo",
    ],
  },
  2: {
    rows: [
      ".yaaaa.",
      "ya...aa",
      ".....aa",
      ".....aa",
      "....yao",
      "...yao.",
      "..yao..",
      ".yao...",
      "yao....",
      "yaaaaaa",
      "ooooooo",
    ],
  },
  3: {
    rows: [
      ".yaaaa.",
      "ya...aa",
      ".....aa",
      ".....ao",
      "..yaaa.",
      ".....aa",
      ".....aa",
      ".....aa",
      "ya...ao",
      ".yaaaa.",
      "..ooo..",
    ],
  },
};
