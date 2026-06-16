import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  DEFAULT_BOARD,
  PAYTABLE,
  SYMBOLS,
  createRandomBoard,
  evaluateBoard,
  type SpinHistoryItem,
  type SymbolCode,
} from "./gameEngine";
import { requestSpin } from "./mockApi";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function App() {
  const [board, setBoard] = useState<SymbolCode[][]>(DEFAULT_BOARD);
  const [bet, setBet] = useState(1);
  const [balance, setBalance] = useState(1000);
  const [lastWin, setLastWin] = useState(0);
  const [displayedWin, setDisplayedWin] = useState(0);
  const [lastMultiplier, setLastMultiplier] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [showPaytable, setShowPaytable] = useState(false);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [winningCells, setWinningCells] = useState<Set<string>>(new Set());
  const [spinHistory, setSpinHistory] = useState<SpinHistoryItem[]>([]);
  const [apiError, setApiError] = useState("");
  const [stoppedReels, setStoppedReels] = useState<Set<number>>(new Set());

  const currentEvaluation = useMemo(() => evaluateBoard(board, bet), [board, bet]);
  useEffect(() => {
  if (lastWin <= 0 || isSpinning) {
    setDisplayedWin(0);
    return;
  }

  const duration = lastMultiplier >= 5 ? 1300 : 800;
  const startTime = window.performance.now();
  let animationFrame = 0;

  function animate(currentTime: number) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const nextValue = Number((lastWin * easedProgress).toFixed(2));

    setDisplayedWin(nextValue);

    if (progress < 1) {
      animationFrame = window.requestAnimationFrame(animate);
    } else {
      setDisplayedWin(lastWin);
    }
  }

  animationFrame = window.requestAnimationFrame(animate);

  return () => {
    window.cancelAnimationFrame(animationFrame);
  };
}, [lastWin, lastMultiplier, isSpinning]);

  const isBigWin = lastMultiplier >= 3 && lastWin > 0 && !isSpinning;
  const isMegaWin = lastMultiplier >= 4 && lastWin > 0 && !isSpinning;
  const winLevelText = isMegaWin ? "MEGA WIN" : "BIG WIN";

  async function handleSpin() {
  if (isSpinning) {
    return;
  }

  if (balance < bet) {
    setApiError("Insufficient balance.");
    return;
  }

  setApiError("");
  setIsSpinning(true);
  setStoppedReels(new Set());
  setLastWin(0);
  setDisplayedWin(0);
  setLastMultiplier(0);
  setWinningLines([]);
  setWinningCells(new Set());

  const response = await requestSpin({
    bet,
    balance,
  });

  if (!response.success) {
    setApiError(response.message);
    setIsSpinning(false);
    setStoppedReels(new Set());
    return;
  }

  const finalBoard = response.result.board;
  const stoppedReelIndexes = new Set<number>();

  const animationInterval = window.setInterval(() => {
    const randomBoard = createRandomBoard();

    setBoard((currentBoard) =>
      currentBoard.map((row, rowIndex) =>
        row.map((_symbolCode, reelIndex) => {
          if (stoppedReelIndexes.has(reelIndex)) {
            return finalBoard[rowIndex][reelIndex];
          }

          return randomBoard[rowIndex][reelIndex];
        })
      )
    );
  }, 55);

  for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
    await wait(260);

    stoppedReelIndexes.add(reelIndex);
    setStoppedReels(new Set(stoppedReelIndexes));

    setBoard((currentBoard) =>
      currentBoard.map((row, rowIndex) =>
        row.map((symbolCode, currentReelIndex) => {
          if (currentReelIndex === reelIndex) {
            return finalBoard[rowIndex][currentReelIndex];
          }

          return symbolCode;
        })
      )
    );
  }

  await wait(180);

  window.clearInterval(animationInterval);

  const nextSpinCount = spinCount + 1;

  setBoard(finalBoard);
  setLastWin(response.result.evaluation.totalWin);
  setLastMultiplier(response.result.evaluation.totalMultiplier);
  setWinningLines(response.result.evaluation.winningLines);
  setWinningCells(new Set(response.result.evaluation.winningCells));
  setBalance(response.balanceAfterWin);
  setSpinCount(nextSpinCount);
  setSpinHistory((currentHistory) =>
    [
      {
        id: nextSpinCount,
        bet,
        win: response.result.evaluation.totalWin,
        multiplier: response.result.evaluation.totalMultiplier,
        lines: response.result.evaluation.winningLines,
      },
      ...currentHistory,
    ].slice(0, 5)
  );

  setIsSpinning(false);
  setStoppedReels(new Set());
}

  function handleBetChange(nextBet: number) {
    if (isSpinning) {
      return;
    }

    setApiError("");
    setBet(nextBet);
  }

  function handleResetBalance() {
    if (isSpinning) {
      return;
    }

    setBalance(1000);
    setLastWin(0);
    setDisplayedWin(0);
    setLastMultiplier(0);
    setSpinCount(0);
    setWinningLines([]);
    setWinningCells(new Set());
    setSpinHistory([]);
    setBoard(DEFAULT_BOARD);
    setApiError("");
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Gold Rush Lines v0.4</p>
          <h1>Gold Rush Lines</h1>
          <p className="subtitle">
            Classic 5×3 video slot prototype with 20 paylines, Wild Gold, highlighted wins,
            separated mock game engine, and mock API spin flow.
          </p>
        </div>

        <div className="status-card">
          <span>Mode</span>
          <strong>Base Game</strong>
          <small>Mock API connected · Free Spins disabled</small>
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
            <strong>{displayedWin.toFixed(2)}</strong>
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
              <strong>{displayedWin.toFixed(2)}</strong>
              <small>{lastMultiplier.toFixed(2)}x multiplier</small>
            </div>
          )}

          <div className={`reel-grid ${isSpinning ? "spinning" : ""}`}>
            {board.map((row, rowIndex) =>
              row.map((symbolCode, reelIndex) => {
                const symbol = SYMBOLS[symbolCode];
                const cellKey = `${rowIndex}-${reelIndex}`;
                const isWinningCell = winningCells.has(cellKey) && !isSpinning;
                const isReelStopped = stoppedReels.has(reelIndex);
                const isReelSpinning = isSpinning && !isReelStopped;

                return (
                  <div
                    className={`slot-cell ${symbol.type} ${isWinningCell ? "winning-cell" : ""} ${
                      isReelSpinning ? "reel-spinning-cell" : ""
                    } ${isReelStopped ? "reel-stopped-cell" : ""}`}
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

            <button className="spin-button" onClick={handleSpin} disabled={isSpinning}>
              {isSpinning ? "Spinning..." : "Spin"}
            </button>
          </div>

          <div className="result-strip">
            <span>Current Board Multiplier: {currentEvaluation.totalMultiplier.toFixed(2)}x</span>
            <span>
              Winning Lines: {winningLines.length > 0 ? winningLines.join(", ") : "None"}
            </span>
          </div>

          {apiError && <div className="api-error">{apiError}</div>}
          {isBigWin && (
          <div className={`big-win-overlay ${isMegaWin ? "mega-win-overlay" : ""}`}>
          <div className="big-win-card">
          <span>{winLevelText}</span>
          <strong>{displayedWin.toFixed(2)}</strong>
          <small>{lastMultiplier.toFixed(2)}x multiplier</small>
          </div>
          </div>
        )}
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