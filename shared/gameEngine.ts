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
  type: SymbolType;
};

export type PaytableEntry = {
  symbol: SymbolCode;
  name: string;
  icon: string;
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
  W: { code: "W", label: "Wild Gold", icon: "🟨", type: "wild" },
  S: { code: "S", label: "Scatter Bonus", icon: "⭐", type: "scatter" },
  H1: { code: "H1", label: "Chest", icon: "💰", type: "high" },
  H2: { code: "H2", label: "Crown", icon: "👑", type: "high" },
  H3: { code: "H3", label: "Gem", icon: "💎", type: "high" },
  H4: { code: "H4", label: "Ring", icon: "💍", type: "high" },
  L1: { code: "L1", label: "A", icon: "A", type: "low" },
  L2: { code: "L2", label: "K", icon: "K", type: "low" },
  L3: { code: "L3", label: "Q", icon: "Q", type: "low" },
  L4: { code: "L4", label: "J", icon: "J", type: "low" },
  L5: { code: "L5", label: "10", icon: "10", type: "low" },
};

export const PAYTABLE: PaytableEntry[] = [
  { symbol: "W", name: "Wild Gold", icon: "🪙", five: 180 },
  { symbol: "H1", name: "Chest", icon: "💰", three: 3.5, four: 22, five: 140 },
  { symbol: "H2", name: "Crown", icon: "👑", three: 2.6, four: 16, five: 95 },
  { symbol: "H3", name: "Gem", icon: "💎", three: 2, four: 11, five: 65 },
  { symbol: "H4", name: "Ring", icon: "💍", three: 1.4, four: 7, five: 42 },
  { symbol: "L1", name: "A", icon: "A", three: 0.45, four: 1.8, five: 12 },
  { symbol: "L2", name: "K", icon: "K", three: 0.35, four: 1.5, five: 9 },
  { symbol: "L3", name: "Q", icon: "Q", three: 0.28, four: 1.2, five: 7 },
  { symbol: "L4", name: "J", icon: "J", three: 0.22, four: 1, five: 5.5 },
  { symbol: "L5", name: "10", icon: "10", three: 0.18, four: 0.8, five: 4 },
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