import express from "express";
import cors from "cors";

type SymbolCode = "W" | "S" | "H1" | "H2" | "H3" | "H4" | "L1" | "L2" | "L3" | "L4" | "L5";

type SpinRequest = {
  bet: number;
  balance: number;
};

type LineWin = {
  lineNumber: number;
  symbol: SymbolCode;
  count: number;
  payout: number;
  cells: string[];
};

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

const PAYTABLE = [
  { symbol: "W", three: 0, four: 0, five: 75 },
  { symbol: "H1", three: 4, four: 16, five: 65 },
  { symbol: "H2", three: 2.6, four: 10, five: 35 },
  { symbol: "H3", three: 2, four: 7, five: 22 },
  { symbol: "H4", three: 1.5, four: 5, five: 15 },
  { symbol: "L1", three: 0.75, four: 2.3, five: 7.5 },
  { symbol: "L2", three: 0.6, four: 1.8, five: 5.7 },
  { symbol: "L3", three: 0.45, four: 1.5, five: 4.7 },
  { symbol: "L4", three: 0.4, four: 1.2, five: 4 },
  { symbol: "L5", three: 0.35, four: 1, five: 3 }
] as const;

const WEIGHTED_REEL: SymbolCode[] = [
  "L5", "L5", "L5", "L5", "L5", "L5",
  "L4", "L4", "L4", "L4", "L4",
  "L3", "L3", "L3", "L3", "L3",
  "L2", "L2", "L2", "L2",
  "L1", "L1", "L1", "L1",
  "H4", "H4", "H4",
  "H3", "H3",
  "H2", "H2",
  "H1",
  "W",
  "S"
];

const PAYLINES: number[][] = [
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
  [1, 0, 0, 0, 1]
];

function getRandomSymbol(): SymbolCode {
  const index = Math.floor(Math.random() * WEIGHTED_REEL.length);
  return WEIGHTED_REEL[index];
}

function createRandomBoard(): SymbolCode[][] {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 5 }, () => getRandomSymbol())
  );
}

function getPayout(symbol: SymbolCode, count: number): number {
  const entry = PAYTABLE.find((item) => item.symbol === symbol);

  if (!entry) {
    return 0;
  }

  if (count >= 5) return entry.five;
  if (count === 4) return entry.four;
  if (count === 3) return entry.three;

  return 0;
}

function evaluateLine(lineSymbols: SymbolCode[], line: number[], lineNumber: number): LineWin | null {
  const firstNonWild = lineSymbols.find((symbol) => symbol !== "W" && symbol !== "S");

  if (!firstNonWild) {
    const wildCount = lineSymbols.filter((symbol) => symbol === "W").length;
    const payout = getPayout("W", wildCount);

    if (payout <= 0) return null;

    return {
      lineNumber,
      symbol: "W",
      count: wildCount,
      payout,
      cells: line.slice(0, wildCount).map((rowIndex, reelIndex) => `${rowIndex}-${reelIndex}`)
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

  if (count < 3) return null;

  const payout = getPayout(firstNonWild, count);

  if (payout <= 0) return null;

  return {
    lineNumber,
    symbol: firstNonWild,
    count,
    payout,
    cells: line.slice(0, count).map((rowIndex, reelIndex) => `${rowIndex}-${reelIndex}`)
  };
}

function evaluateBoard(board: SymbolCode[][], bet: number) {
  let totalMultiplier = 0;
  const lineWins: LineWin[] = [];
  const winningCells: string[] = [];

  PAYLINES.forEach((line, lineIndex) => {
    const lineSymbols = line.map((rowIndex, reelIndex) => board[rowIndex][reelIndex]);
    const result = evaluateLine(lineSymbols, line, lineIndex + 1);

    if (result) {
      totalMultiplier += result.payout;
      lineWins.push(result);
      result.cells.forEach((cell) => winningCells.push(cell));
    }
  });

  return {
    totalMultiplier,
    totalWin: Number((totalMultiplier * bet).toFixed(2)),
    winningLines: lineWins.map((win) => win.lineNumber),
    winningCells: Array.from(new Set(winningCells)),
    lineWins
  };
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "gold-rush-lines-backend"
  });
});

app.post("/api/spin", (req, res) => {
  const { bet, balance } = req.body as SpinRequest;

  if (typeof bet !== "number" || bet <= 0) {
    return res.status(400).json({
      success: false,
      message: "Bet must be greater than zero."
    });
  }

  if (typeof balance !== "number" || balance < bet) {
    return res.status(400).json({
      success: false,
      message: "Insufficient balance."
    });
  }

  const board = createRandomBoard();
  const evaluation = evaluateBoard(board, bet);

  const balanceAfterBet = Number((balance - bet).toFixed(2));
  const balanceAfterWin = Number((balanceAfterBet + evaluation.totalWin).toFixed(2));

  return res.json({
    success: true,
    result: {
      board,
      evaluation
    },
    balanceAfterBet,
    balanceAfterWin
  });
});

app.listen(port, () => {
  console.log(`Gold Rush Lines mock backend running on http://localhost:${port}`);
});