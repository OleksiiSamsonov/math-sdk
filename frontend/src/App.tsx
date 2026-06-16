import { useMemo, useState } from "react";
import "./App.css";
import {
  DEFAULT_BOARD,
  PAYTABLE,
  SYMBOLS,
  createMockSpinResult,
  createRandomBoard,
  evaluateBoard,
  type SpinHistoryItem,
  type SymbolCode,
} from "./gameEngine";

export default function App() {
  const [board, setBoard] = useState<SymbolCode[][]>(DEFAULT_BOARD);
  const [bet, setBet] = useState(1);
  const [balance, setBalance] = useState(1000);
  const [lastWin, setLastWin] = useState(0);
  const [lastMultiplier, setLastMultiplier] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [showPaytable, setShowPaytable] = useState(false);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [winningCells, setWinningCells] = useState<Set<string>>(new Set());
  const [spinHistory, setSpinHistory] = useState<SpinHistoryItem[]>([]);

  const currentEvaluation = useMemo(() => evaluateBoard(board, bet), [board, bet]);

  function handleSpin() {
    if (isSpinning || balance < bet) {
      return;
    }

    setIsSpinning(true);
    setLastWin(0);
    setLastMultiplier(0);
    setWinningLines([]);
    setWinningCells(new Set());
    setBalance((currentBalance) => Number((currentBalance - bet).toFixed(2)));

    const spinFrames = 12;
    let currentFrame = 0;

    const interval = window.setInterval(() => {
      setBoard(createRandomBoard());
      currentFrame += 1;

      if (currentFrame >= spinFrames) {
        window.clearInterval(interval);

        const result = createMockSpinResult(bet);
        const nextSpinCount = spinCount + 1;

        setBoard(result.board);
        setLastWin(result.evaluation.totalWin);
        setLastMultiplier(result.evaluation.totalMultiplier);
        setWinningLines(result.evaluation.winningLines);
        setWinningCells(result.evaluation.winningCells);
        setBalance((currentBalance) => Number((currentBalance + result.evaluation.totalWin).toFixed(2)));
        setSpinCount(nextSpinCount);
        setSpinHistory((currentHistory) => [
          {
            id: nextSpinCount,
            bet,
            win: result.evaluation.totalWin,
            multiplier: result.evaluation.totalMultiplier,
            lines: result.evaluation.winningLines,
          },
          ...currentHistory,
        ].slice(0, 5));
        setIsSpinning(false);
      }
    }, 70);
  }

  function handleBetChange(nextBet: number) {
    if (isSpinning) {
      return;
    }

    setBet(nextBet);
  }

  function handleResetBalance() {
    if (isSpinning) {
      return;
    }

    setBalance(1000);
    setLastWin(0);
    setLastMultiplier(0);
    setSpinCount(0);
    setWinningLines([]);
    setWinningCells(new Set());
    setSpinHistory([]);
    setBoard(DEFAULT_BOARD);
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Gold Rush Lines v0.3</p>
          <h1>Gold Rush Lines</h1>
          <p className="subtitle">
            Classic 5×3 video slot prototype with 20 paylines, Wild Gold, highlighted wins, and a separated mock game engine.
          </p>
        </div>

        <div className="status-card">
          <span>Mode</span>
          <strong>Base Game</strong>
          <small>Mock engine connected · Free Spins disabled</small>
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

          <button className="secondary-button reset-button" onClick={handleResetBalance}>
            Reset Balance
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

          {lastWin > 0 && !isSpinning && (
            <div className="win-banner">
              <span>Win</span>
              <strong>{lastWin.toFixed(2)}</strong>
              <small>{lastMultiplier.toFixed(2)}x multiplier</small>
            </div>
          )}

          <div className={`reel-grid ${isSpinning ? "spinning" : ""}`}>
            {board.map((row, rowIndex) =>
              row.map((symbolCode, reelIndex) => {
                const symbol = SYMBOLS[symbolCode];
                const cellKey = `${rowIndex}-${reelIndex}`;
                const isWinningCell = winningCells.has(cellKey) && !isSpinning;

                return (
                  <div
                    className={`slot-cell ${symbol.type} ${isWinningCell ? "winning-cell" : ""}`}
                    key={`${rowIndex}-${reelIndex}`}
                  >
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
            <span>Current Board Multiplier: {currentEvaluation.totalMultiplier.toFixed(2)}x</span>
            <span>
              Winning Lines: {winningLines.length > 0 ? winningLines.join(", ") : "None"}
            </span>
          </div>
        </section>
      </section>

      <section className="history-panel">
        <h2>Spin History</h2>
        {spinHistory.length === 0 ? (
          <p className="empty-history">No spins yet. Press Spin to start testing the prototype.</p>
        ) : (
          <div className="history-list">
            {spinHistory.map((item) => (
              <div className={`history-item ${item.win > 0 ? "history-win" : ""}`} key={item.id}>
                <span>#{item.id}</span>
                <strong>{item.win.toFixed(2)}</strong>
                <small>
                  Bet {item.bet.toFixed(2)} · {item.multiplier.toFixed(2)}x · Lines{" "}
                  {item.lines.length > 0 ? item.lines.join(", ") : "none"}
                </small>
              </div>
            ))}
          </div>
        )}
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
              <div className="paytable-row" key={entry.symbol}>
                <div className="paytable-symbol">
                  <span>{entry.icon}</span>
                  <strong>{entry.name}</strong>
                </div>
                <div>{entry.three ? `${entry.three}x` : "-"}</div>
                <div>{entry.four ? `${entry.four}x` : "-"}</div>
                <div>{entry.five ? `${entry.five}x` : "-"}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}