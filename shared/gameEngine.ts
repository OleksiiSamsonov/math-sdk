export type SymbolCode =
  | "W"
  | "S"
  | "H1"
  | "H2"
  | "H3"
  | "H4"
  | "L1"
  | "L2"
  | "L3"
  | "L4"
  | "L5";

export type SymbolType = "wild" | "scatter" | "high" | "low";

export type SlotSymbol = {
  code: SymbolCode;
  label: string;
  icon: string;
  image: string;
  type: SymbolType;
};

export type PaytableEntry = {
  symbol: SymbolCode;
  name: string;
  icon: string;
  image: string;
  three?: number;
  four?: number;
  five?: number;
};

export type LineWin = {
  lineNumber: number;
  symbol: SymbolCode;
  count: number;
  payout: number;
  cells: string[];
};

export type BoardEvaluation = {
  totalMultiplier: number;
  totalWin: number;
  winningLines: number[];
  winningCells: Set<string>;
  lineWins: LineWin[];
};

export type SpinResult = {
  board: SymbolCode[][];
  evaluation: BoardEvaluation;
};

export type SpinHistoryItem = {
  id: number;
  bet: number;
  win: number;
  multiplier: number;
  lines: number[];
};

export const SYMBOLS: Record<SymbolCode, SlotSymbol> = {
  W: {
    code: "W",
    label: "Wild Gold",
    icon: "W",
    image: "/symbols/wild.png",
    type: "wild",
  },
  S: {
    code: "S",
    label: "Scatter Bonus",
    icon: "S",
    image: "/symbols/scatter.png",
    type: "scatter",
  },
  H1: {
    code: "H1",
    label: "Chest",
    icon: "Chest",
    image: "/symbols/chest.png",
    type: "high",
  },
  H2: {
    code: "H2",
    label: "Crown",
    icon: "Crown",
    image: "/symbols/crown.png",
    type: "high",
  },
  H3: {
    code: "H3",
    label: "Gem",
    icon: "Gem",
    image: "/symbols/gem.png",
    type: "high",
  },
  H4: {
    code: "H4",
    label: "Ring",
    icon: "Ring",
    image: "/symbols/ring.png",
    type: "high",
  },
  L1: {
    code: "L1",
    label: "A",
    icon: "A",
    image: "/symbols/a.png",
    type: "low",
  },
  L2: {
    code: "L2",
    label: "K",
    icon: "K",
    image: "/symbols/k.png",
    type: "low",
  },
  L3: {
    code: "L3",
    label: "Q",
    icon: "Q",
    image: "/symbols/q.png",
    type: "low",
  },
  L4: {
    code: "L4",
    label: "J",
    icon: "J",
    image: "/symbols/j.png",
    type: "low",
  },
  L5: {
    code: "L5",
    label: "10",
    icon: "10",
    image: "/symbols/ten.png",
    type: "low",
  },
};

export const PAYTABLE: PaytableEntry[] = [
  {
    symbol: "W",
    name: "Wild Gold",
    icon: "W",
    image: "/symbols/wild.png",
    five: 95,
  },

  {
    symbol: "H1",
    name: "Chest",
    icon: "Chest",
    image: "/symbols/chest.png",
    three: 2.4,
    four: 13,
    five: 80,
  },
  {
    symbol: "H2",
    name: "Crown",
    icon: "Crown",
    image: "/symbols/crown.png",
    three: 1.8,
    four: 9,
    five: 55,
  },
  {
    symbol: "H3",
    name: "Gem",
    icon: "Gem",
    image: "/symbols/gem.png",
    three: 1.4,
    four: 6,
    five: 38,
  },
  {
    symbol: "H4",
    name: "Ring",
    icon: "Ring",
    image: "/symbols/ring.png",
    three: 1,
    four: 4,
    five: 25,
  },

  {
    symbol: "L1",
    name: "A",
    icon: "A",
    image: "/symbols/a.png",
    three: 0.28,
    four: 1.1,
    five: 7,
  },
  {
    symbol: "L2",
    name: "K",
    icon: "K",
    image: "/symbols/k.png",
    three: 0.22,
    four: 0.9,
    five: 5.5,
  },
  {
    symbol: "L3",
    name: "Q",
    icon: "Q",
    image: "/symbols/q.png",
    three: 0.18,
    four: 0.75,
    five: 4.3,
  },
  {
    symbol: "L4",
    name: "J",
    icon: "J",
    image: "/symbols/j.png",
    three: 0.15,
    four: 0.6,
    five: 3.4,
  },
  {
    symbol: "L5",
    name: "10",
    icon: "10",
    image: "/symbols/ten.png",
    three: 0.12,
    four: 0.5,
    five: 2.6,
  },
];

export const WEIGHTED_REEL: SymbolCode[] = [
  "L5",
  "L5",
  "L5",
  "L5",

  "L4",
  "L4",
  "L4",
  "L4",

  "L3",
  "L3",
  "L3",
  "L3",

  "L2",
  "L2",
  "L2",

  "L1",
  "L1",
  "L1",

  "H4",
  "H4",
  "H4",

  "H3",
  "H3",
  "H3",

  "H2",
  "H2",

  "H1",
  "H1",

  "W",
  "W",

  "S",
];

export const PAYLINES: number[][] = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1],
  [0, 1, 1, 1, 2],
  [2, 1, 1, 1, 0],
  [0, 1, 0, 1, 2],
  [2, 1, 2, 1, 0],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 2, 1, 0, 2],
  [2, 0, 1, 2, 0],
  [0, 0, 2, 0, 0],
  [2, 2, 0, 2, 2],
  [1, 0, 0, 0, 1],
];

export const DEFAULT_BOARD: SymbolCode[][] = [
  ["H1", "L1", "L5", "H3", "L2"],
  ["L2", "W", "H1", "L4", "H1"],
  ["L5", "H2", "L3", "S", "L1"],
];

export function getRandomSymbol(): SymbolCode {
  const index = Math.floor(Math.random() * WEIGHTED_REEL.length);
  return WEIGHTED_REEL[index];
}

export function createRandomBoard(): SymbolCode[][] {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 5 }, () => getRandomSymbol())
  );
}

export function getPayout(symbol: SymbolCode, count: number): number {
  const entry = PAYTABLE.find((item) => item.symbol === symbol);

  if (!entry) {
    return 0;
  }

  if (count >= 5) {
    return entry.five ?? 0;
  }

  if (count === 4) {
    return entry.four ?? 0;
  }

  if (count === 3) {
    return entry.three ?? 0;
  }

  return 0;
}

export function evaluateLine(
  lineSymbols: SymbolCode[],
  line: number[],
  lineNumber: number
): LineWin | null {
  const firstNonWild = lineSymbols.find((symbol) => symbol !== "W" && symbol !== "S");

  if (!firstNonWild) {
    const wildCount = lineSymbols.filter((symbol) => symbol === "W").length;
    const payout = getPayout("W", wildCount);

    if (payout <= 0) {
      return null;
    }

    return {
      lineNumber,
      symbol: "W",
      count: wildCount,
      payout,
      cells: line.slice(0, wildCount).map((rowIndex, reelIndex) => `${rowIndex}-${reelIndex}`),
    };
  }

  let count = 0;

  for (const symbol of lineSymbols) {
    if (symbol === firstNonWild || symbol === "W") {
      count += 1;
    } else {
      break;
    }
  }

  if (count < 3) {
    return null;
  }

  const payout = getPayout(firstNonWild, count);

  if (payout <= 0) {
    return null;
  }

  return {
    lineNumber,
    symbol: firstNonWild,
    count,
    payout,
    cells: line.slice(0, count).map((rowIndex, reelIndex) => `${rowIndex}-${reelIndex}`),
  };
}

export function evaluateBoard(board: SymbolCode[][], bet: number): BoardEvaluation {
  let totalMultiplier = 0;
  const lineWins: LineWin[] = [];
  const winningCells = new Set<string>();

  PAYLINES.forEach((line, lineIndex) => {
    const lineSymbols = line.map((rowIndex, reelIndex) => board[rowIndex][reelIndex]);
    const result = evaluateLine(lineSymbols, line, lineIndex + 1);

    if (result) {
      totalMultiplier += result.payout;
      lineWins.push(result);
      result.cells.forEach((cell) => winningCells.add(cell));
    }
  });

  return {
    totalMultiplier,
    totalWin: Number((totalMultiplier * bet).toFixed(2)),
    winningLines: lineWins.map((win) => win.lineNumber),
    winningCells,
    lineWins,
  };
}

export function createMockSpinResult(bet: number): SpinResult {
  const board = createRandomBoard();
  const evaluation = evaluateBoard(board, bet);

  return {
    board,
    evaluation,
  };
}