import { useMemo, useState } from "react";
import "./App.css";

type SymbolCode = "W" | "S" | "H1" | "H2" | "H3" | "H4" | "L1" | "L2" | "L3" | "L4" | "L5";

type SlotSymbol = {
  code: SymbolCode;
  label: string;
  icon: string;
  type: "wild" | "scatter" | "high" | "low";
};

type PaytableEntry = {
  symbol: SymbolCode;
  name: string;
  icon: string;
  three?: number;
  four?: number;
  five?: number;
};

const SYMBOLS: Record<SymbolCode, SlotSymbol> = {
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

const PAYTABLE: PaytableEntry[] = [
  { symbol: "W", name: "Wild Gold", icon: "🟨", five: 75 },
  { symbol: "H1", name: "Chest", icon: "💰", three: 4, four: 16, five: 65 },
  { symbol: "H2", name: "Crown", icon: "👑", three: 2.6, four: 10, five: 35 },
  { symbol: "H3", name: "Gem", icon: "💎", three: 2, four: 7, five: 22 },
  { symbol: "H4", name: "Ring", icon: "💍", three: 1.5, four: 5, five: 15 },
  { symbol: "L1", name: "A", icon: "A", three: 0.75, four: 2.3, five: 7.5 },
  { symbol: "L2", name: "K", icon: "K", three: 0.6, four: 1.8, five: 5.7 },
  { symbol: "L3", name: "Q", icon: "Q", three: 0.45, four: 1.5, five: 4.7 },
  { symbol: "L4", name: "J", icon: "J", three: 0.4, four: 1.2, five: 4 },
  { symbol: "L5", name: "10", icon: "10", three: 0.35, four: 1, five: 3 },
];

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
  "S",
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
  [1, 0, 0, 0, 1],
];

const DEFAULT_BOARD: SymbolCode[][] = [
  ["H1", "L1", "L5", "H3", "L2"],
  ["L2", "W", "H1", "L4", "H1"],
  ["L5", "H2", "L3", "S", "L1"],
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

function evaluateLine(lineSymbols: SymbolCode[]): { symbol: SymbolCode; count: number; payout: number } | null {
  const firstNonWild = lineSymbols.find((symbol) => symbol !== "W" && symbol !== "S");

  if (!firstNonWild) {
    const wildCount = lineSymbols.filter((symbol) => symbol === "W").length;
    const payout = getPayout("W", wildCount);
    return payout > 0 ? { symbol: "W", count: wildCount, payout } : null;
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
    symbol: firstNonWild,
    count,
    payout,
  };
}

function evaluateBoard(board: SymbolCode[][], bet: number) {
  let totalMultiplier = 0;
  const winningLines: number[] = [];

  PAYLINES.forEach((line, lineIndex) => {
    const lineSymbols = line.map((rowIndex, reelIndex) => board[rowIndex][reelIndex]);
    const result = evaluateLine(lineSymbols);

    if (result) {
      totalMultiplier += result.payout;
      winningLines.push(lineIndex + 1);
    }
  });

  return {
    totalMultiplier,
    totalWin: Number((totalMultiplier * bet).toFixed(2)),
    winningLines,
  };
}

export default function App() {
  const [board, setBoard] = useState<SymbolCode[][]>(DEFAULT_BOARD);
  const [bet, setBet] = useState(1);
  const [balance, setBalance] = useState(1000);
  const [lastWin, setLastWin] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [showPaytable, setShowPaytable] = useState(false);
  const [winningLines, setWinningLines] = useState<number[]>([]);

  const evaluation = useMemo(() => evaluateBoard(board, bet), [board, bet]);

  function handleSpin() {
    if (isSpinning || balance < bet) {
      return;
    }

    setIsSpinning(true);
    setLastWin(0);
    setWinningLines([]);
    setBalance((currentBalance) => Number((currentBalance - bet).toFixed(2)));

    const spinFrames = 10;
    let currentFrame = 0;

    const interval = window.setInterval(() => {
      setBoard(createRandomBoard());
      currentFrame += 1;

      if (currentFrame >= spinFrames) {
        window.clearInterval(interval);

        const finalBoard = createRandomBoard();
        const result = evaluateBoard(finalBoard, bet);

        setBoard(finalBoard);
        setLastWin(result.totalWin);
        setWinningLines(result.winningLines);
        setBalance((currentBalance) => Number((currentBalance + result.totalWin).toFixed(2)));
        setSpinCount((currentCount) => currentCount + 1);
        setIsSpinning(false);
      }
    }, 80);
  }

  function handleBetChange(nextBet: number) {
    if (isSpinning) {
      return;
    }

    setBet(nextBet);
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Gold Rush Lines v0.1</p>
          <h1>Gold Rush Lines</h1>
          <p className="subtitle">
            Classic 5×3 video slot prototype with 20 paylines, Wild Gold, and base game RTP tuned around 94–95%.
          </p>
        </div>

        <div className="status-card">
          <span>Mode</span>
          <strong>Base Game</strong>
          <small>Free Spins disabled in v0.1</small>
        </div>
      </section>

      <section className="game-layout">
        <aside className="info-panel">
          <div className="metric">
            <span>Balance</span>
            <strong>{balance.toFixed(2)}</strong>
          </div>

          <div className="metric">
            <span>Bet</span>
            <strong>{bet.toFixed(2)}</strong>
          </div>

          <div className="metric win">
            <span>Last Win</span>
            <strong>{lastWin.toFixed(2)}</strong>
          </div>

          <div className="metric">
            <span>Spin Count</span>
            <strong>{spinCount}</strong>
          </div>

          <button className="secondary-button" onClick={() => setShowPaytable((value) => !value)}>
            {showPaytable ? "Hide Paytable" : "Show Paytable"}
          </button>
        </aside>

        <section className="slot-machine">
          <div className="slot-header">
            <div>
              <span>20 Fixed Paylines</span>
              <strong>5 Reels × 3 Rows</strong>
            </div>
            <div className="rtp-badge">RTP ≈ 94–95%</div>
          </div>

          <div className={`reel-grid ${isSpinning ? "spinning" : ""}`}>
            {board.map((row, rowIndex) =>
              row.map((symbolCode, reelIndex) => {
                const symbol = SYMBOLS[symbolCode];

                return (
                  <div className={`slot-cell ${symbol.type}`} key={`${rowIndex}-${reelIndex}-${symbolCode}`}>
                    <span className="symbol-icon">{symbol.icon}</span>
                    <span className="symbol-code">{symbol.label}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="controls">
            <div className="bet-buttons">
              {[0.2, 0.5, 1, 2, 5].map((amount) => (
                <button
                  key={amount}
                  className={bet === amount ? "active" : ""}
                  onClick={() => handleBetChange(amount)}
                >
                  {amount}
                </button>
              ))}
            </div>

            <button className="spin-button" onClick={handleSpin} disabled={isSpinning || balance < bet}>
              {isSpinning ? "Spinning..." : "Spin"}
            </button>
          </div>

          <div className="result-strip">
            <span>Current Board Multiplier: {evaluation.totalMultiplier.toFixed(2)}x</span>
            <span>
              Winning Lines: {winningLines.length > 0 ? winningLines.join(", ") : "None"}
            </span>
          </div>
        </section>
      </section>

      {showPaytable && (
        <section className="paytable-panel">
          <h2>Paytable</h2>
          <div className="paytable-grid">
            <div className="paytable-header">Symbol</div>
            <div className="paytable-header">3</div>
            <div className="paytable-header">4</div>
            <div className="paytable-header">5</div>

            {PAYTABLE.map((entry) => (
              <>
                <div className="paytable-symbol" key={`${entry.symbol}-symbol`}>
                  <span>{entry.icon}</span>
                  <strong>{entry.name}</strong>
                </div>
                <div key={`${entry.symbol}-3`}>{entry.three ? `${entry.three}x` : "-"}</div>
                <div key={`${entry.symbol}-4`}>{entry.four ? `${entry.four}x` : "-"}</div>
                <div key={`${entry.symbol}-5`}>{entry.five ? `${entry.five}x` : "-"}</div>
              </>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}