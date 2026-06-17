import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function playTone(
  isSoundEnabled: boolean,
  frequency: number,
  durationMs: number,
  volume = 0.06,
  type: OscillatorType = "sine"
) {
  if (!isSoundEnabled) {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + durationMs / 1000);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + durationMs / 1000 + 0.02);

  window.setTimeout(() => {
    void audioContext.close();
  }, durationMs + 80);
}

function playSpinSound(isSoundEnabled: boolean) {
  playTone(isSoundEnabled, 180, 90, 0.035, "sawtooth");
}

function playReelStopSound(isSoundEnabled: boolean, reelIndex: number) {
  playTone(isSoundEnabled, 280 + reelIndex * 45, 70, 0.045, "square");
}

function playWinSound(isSoundEnabled: boolean, multiplier: number) {
  if (multiplier >= 25) {
    playTone(isSoundEnabled, 440, 120, 0.05, "triangle");
    window.setTimeout(() => playTone(isSoundEnabled, 660, 140, 0.05, "triangle"), 110);
    window.setTimeout(() => playTone(isSoundEnabled, 880, 180, 0.055, "triangle"), 230);
    return;
  }

  if (multiplier >= 10) {
    playTone(isSoundEnabled, 420, 100, 0.045, "triangle");
    window.setTimeout(() => playTone(isSoundEnabled, 620, 130, 0.05, "triangle"), 120);
    return;
  }

  if (multiplier > 0) {
    playTone(isSoundEnabled, 520, 110, 0.04, "sine");
  }
}

function playBonusSound(isSoundEnabled: boolean) {
  playTone(isSoundEnabled, 330, 120, 0.05, "triangle");
  window.setTimeout(() => playTone(isSoundEnabled, 520, 140, 0.055, "triangle"), 120);
  window.setTimeout(() => playTone(isSoundEnabled, 780, 190, 0.06, "triangle"), 260);
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
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [lastFreeSpinsAwarded, setLastFreeSpinsAwarded] = useState(0);
  const [showBonusIntro, setShowBonusIntro] = useState(false);
  const [showBonusComplete, setShowBonusComplete] = useState(false);
  const [bonusTotalWin, setBonusTotalWin] = useState(0);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [autoplayLeft, setAutoplayLeft] = useState(0);
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [isTurboMode, setIsTurboMode] = useState(false);
  const [sessionTotalBet, setSessionTotalBet] = useState(0);
  const [sessionTotalWin, setSessionTotalWin] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

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

  const isFreeSpinMode = freeSpinsLeft > 0;
  const safeFreeSpinsLeft = Number.isFinite(freeSpinsLeft) ? freeSpinsLeft : 0;
  const sessionNetProfit = Number((sessionTotalWin - sessionTotalBet).toFixed(2));
const sessionRtp =
  sessionTotalBet > 0 ? Number(((sessionTotalWin / sessionTotalBet) * 100).toFixed(2)) : 0;

  const isBigWin = lastMultiplier >= 10 && lastWin > 0 && !isSpinning;
  const isMegaWin = lastMultiplier >= 25 && lastWin > 0 && !isSpinning;
  const winLevelText = isMegaWin ? "MEGA WIN" : "BIG WIN";

  async function handleSpin(isAutoplaySpin = false) {
    if (isSpinning) {
      return;
    }
    if (isAutoplayActive && !isAutoplaySpin) {
  return;
}

    if (!isFreeSpinMode && balance < bet) {
      setApiError("Insufficient balance.");
      return;
    }

    setApiError("");
    setLastFreeSpinsAwarded(0);
    playSpinSound(isSoundEnabled);
    setIsSpinning(true);
    setStoppedReels(new Set());
    setLastWin(0);
    setDisplayedWin(0);
    setLastMultiplier(0);
    setWinningLines([]);
    setWinningCells(new Set());
    const reelSpinIntervalMs = isTurboMode ? 32 : 55;
    const reelStopDelayMs = isTurboMode ? 90 : 260;
    const finalSettleDelayMs = isTurboMode ? 60 : 180;

    const response = await requestSpin({
      bet,
      balance,
      isFreeSpin: isFreeSpinMode,
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
          row.map((symbolCode, reelIndex) => {
            if (stoppedReelIndexes.has(reelIndex)) {
              return finalBoard[rowIndex][reelIndex];
            }

            return randomBoard[rowIndex][reelIndex] ?? symbolCode;
          })
        )
      );
    }, reelSpinIntervalMs);

    for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
      await wait(reelStopDelayMs);

      stoppedReelIndexes.add(reelIndex);
      setStoppedReels(new Set(stoppedReelIndexes));
      playReelStopSound(isSoundEnabled, reelIndex);

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

    await wait(finalSettleDelayMs);

    window.clearInterval(animationInterval);

    const nextSpinCount = spinCount + 1;
const awardedFreeSpins = Number(response.result.evaluation.freeSpinsAwarded ?? 0);
const spinWin = Number(response.result.evaluation.totalWin ?? 0);

if (!isFreeSpinMode) {
  setSessionTotalBet((currentSessionTotalBet) =>
    Number((currentSessionTotalBet + bet).toFixed(2))
  );
}

setSessionTotalWin((currentSessionTotalWin) =>
  Number((currentSessionTotalWin + spinWin).toFixed(2))
);

    setBoard(finalBoard);
    setLastWin(response.result.evaluation.totalWin);
    setLastMultiplier(response.result.evaluation.totalMultiplier);
    playWinSound(isSoundEnabled, response.result.evaluation.totalMultiplier);
    setWinningLines(response.result.evaluation.winningLines);
    setWinningCells(new Set(response.result.evaluation.winningCells));
    setBalance(
  isFreeSpinMode
    ? Number((balance + response.result.evaluation.totalWin).toFixed(2))
    : response.balanceAfterWin
);
    setLastFreeSpinsAwarded(awardedFreeSpins);

if (!isFreeSpinMode && awardedFreeSpins > 0) {
  setBonusTotalWin(0);
  setShowBonusIntro(true);
  playBonusSound(isSoundEnabled);

}

if (isFreeSpinMode && awardedFreeSpins > 0) {
  setShowBonusIntro(true);
  playBonusSound(isSoundEnabled);
}


if (isFreeSpinMode) {
  setBonusTotalWin((currentBonusTotalWin) =>
    Number((currentBonusTotalWin + spinWin).toFixed(2))
  );
}

setFreeSpinsLeft((currentFreeSpinsLeft) => {
  const safeCurrentFreeSpinsLeft = Number.isFinite(currentFreeSpinsLeft)
    ? currentFreeSpinsLeft
    : 0;

  const safeAwardedFreeSpins = Number.isFinite(awardedFreeSpins) ? awardedFreeSpins : 0;
  const spentFreeSpin = isFreeSpinMode ? 1 : 0;
  const nextFreeSpinsLeft =
    Math.max(safeCurrentFreeSpinsLeft - spentFreeSpin, 0) + safeAwardedFreeSpins;

  if (isFreeSpinMode && nextFreeSpinsLeft === 0) {
    window.setTimeout(() => {
      setShowBonusComplete(true);
    }, 450);
  }

  return nextFreeSpinsLeft;
});

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
    setFreeSpinsLeft(0);
    setLastFreeSpinsAwarded(0);
    setShowBonusIntro(false);
    setShowBonusComplete(false);
    setBonusTotalWin(0);
    setIsAutoplayActive(false);
    setAutoplayLeft(0);
    setSessionTotalBet(0);
setSessionTotalWin(0);
  }

  function handleForceBonus() {
    if (isSpinning) {
      return;
    }

    setApiError("");
    setShowBonusComplete(false);
    setBonusTotalWin(0);
    setFreeSpinsLeft((currentFreeSpinsLeft) => {
      const safeCurrentFreeSpinsLeft = Number.isFinite(currentFreeSpinsLeft)
        ? currentFreeSpinsLeft
        : 0;

      return safeCurrentFreeSpinsLeft + 8;
    });
    setLastFreeSpinsAwarded(8);
    setShowBonusIntro(true);
    playBonusSound(isSoundEnabled);

  }
  function handleStartAutoplay(spins: number) {
  if (isSpinning) {
    return;
  }

  if (!isFreeSpinMode && balance < bet) {
    setApiError("Insufficient balance.");
    return;
  }

  setApiError("");
  setAutoplayLeft(spins);
  setIsAutoplayActive(true);
}

function handleStopAutoplay() {
  setIsAutoplayActive(false);
  setAutoplayLeft(0);
}
useEffect(() => {
  if (!isAutoplayActive) {
    return;
  }

  if (isSpinning || showBonusIntro || showBonusComplete) {
    return;
  }

  if (!isFreeSpinMode && autoplayLeft <= 0) {
    setIsAutoplayActive(false);
    setAutoplayLeft(0);
    return;
  }

  if (!isFreeSpinMode && balance < bet) {
    setApiError("Autoplay stopped: insufficient balance.");
    setIsAutoplayActive(false);
    setAutoplayLeft(0);
    return;
  }

  const autoplayTimer = window.setTimeout(() => {
    if (!isFreeSpinMode) {
      setAutoplayLeft((currentAutoplayLeft) => Math.max(currentAutoplayLeft - 1, 0));
    }

    void handleSpin(true);
  }, isTurboMode ? 260 : isFreeSpinMode ? 650 : 900);

  return () => {
    window.clearTimeout(autoplayTimer);
  };
}, [
  isAutoplayActive,
  autoplayLeft,
  isSpinning,
  showBonusIntro,
  showBonusComplete,
  isFreeSpinMode,
  isTurboMode,
  balance,
  bet,
]);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Gold Rush Lines v0.4</p>
          <h1>Gold Rush Lines</h1>
          <p className="subtitle">
            Classic 5×3 video slot prototype with 20 paylines, Wild Gold, highlighted wins,
            separated game engine, backend spin API, Scatter Bonus, and Free Spins.
          </p>
        </div>

        <div className="status-card">
          <span>Mode</span>
          <strong>{isFreeSpinMode ? "Bonus Game" : "Base Game"}</strong>
          <small>
            {isFreeSpinMode
              ? `${safeFreeSpinsLeft} free spins left · all wins x2`
              : "Scatter Bonus enabled"}
          </small>
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

          <div className="metric bonus">
            <span>Free Spins Left</span>
            <strong>{safeFreeSpinsLeft}</strong>
          </div>
          <div className="session-stats-card">
  <span className="session-stats-title">Session Stats</span>

  <div className="session-stats-row">
    <span>Total Bet</span>
    <strong>{sessionTotalBet.toFixed(2)}</strong>
  </div>

  <div className="session-stats-row">
    <span>Total Win</span>
    <strong>{sessionTotalWin.toFixed(2)}</strong>
  </div>

  <div className={`session-stats-row ${sessionNetProfit >= 0 ? "positive" : "negative"}`}>
    <span>Net</span>
    <strong>
      {sessionNetProfit >= 0 ? "+" : ""}
      {sessionNetProfit.toFixed(2)}
    </strong>
  </div>

  <div className="session-stats-row">
    <span>RTP</span>
    <strong>{sessionRtp.toFixed(2)}%</strong>
  </div>
</div>

          <button
  className={`secondary-button sound-toggle-button ${
    isSoundEnabled ? "sound-toggle-active" : ""
  }`}
  onClick={() => setIsSoundEnabled((value) => !value)}
>
  {isSoundEnabled ? "Sound On" : "Sound Off"}
</button>
          <button className="secondary-button" onClick={() => setShowPaytable((value) => !value)}>
            {showPaytable ? "Hide Paytable" : "Show Paytable"}
          </button>

          <button className="secondary-button reset-button" onClick={handleResetBalance}>
            Reset Balance
          </button>

          <button
  className="secondary-button dev-toggle-button"
  onClick={() => setShowDevPanel((value) => !value)}
>
  Dev
</button>

{showDevPanel && (
  <div className="dev-panel">
    <span>Developer Tools</span>

    <button className="secondary-button bonus-test-button" onClick={handleForceBonus}>
      Force Bonus
    </button>
  </div>
)}
        </aside>

        <section className={`slot-machine ${isFreeSpinMode ? "free-spins-mode" : ""}`}>
          <div className="slot-header">
            <div>
              <span>20 Fixed Paylines</span>
              <strong>5 Reels × 3 Rows</strong>
            </div>
            <div className="rtp-badge">RTP ≈ 94%</div>
          </div>

          <div
            className={`win-banner ${
              lastWin > 0 && !isSpinning ? "win-banner-visible" : "win-banner-hidden"
            }`}
          >
            <span>Win</span>
            <strong>{displayedWin.toFixed(2)}</strong>
            <small>{lastMultiplier.toFixed(2)}x multiplier</small>
          </div>

          {lastFreeSpinsAwarded > 0 && !isSpinning && (
            <div className="bonus-trigger-banner">
              <span>Scatter Bonus</span>
              <strong>+{lastFreeSpinsAwarded} Free Spins</strong>
              <small>Free Spins wins pay x2</small>
            </div>
          )}

          {isFreeSpinMode && (
  <div className="free-spins-compact-bar">
    <span>Free Spins Mode</span>
    <strong>{safeFreeSpinsLeft} left</strong>
    <small>Wins x2</small>
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
                    <img className="symbol-image" src={symbol.image} alt={symbol.label} />
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
                  disabled={isSpinning || isFreeSpinMode}
                >
                  {amount}
                </button>
              ))}
            </div>

            <button
  className={`spin-button ${isFreeSpinMode ? "free-spin-button" : ""}`}
  onClick={() => void handleSpin(false)}
  disabled={isSpinning || isAutoplayActive}
>
              {isSpinning
                ? "Spinning..."
                : isFreeSpinMode
                  ? `Free Spin (${safeFreeSpinsLeft})`
                  : "Spin"}
            </button>
            <button
  className={`turbo-toggle-button ${isTurboMode ? "turbo-toggle-active" : ""}`}
  onClick={() => setIsTurboMode((value) => !value)}
  disabled={isSpinning}
>
  {isTurboMode ? "Turbo On" : "Turbo Off"}
</button>
            <div className="autoplay-box">
  {isAutoplayActive ? (
    <>
      <div className="autoplay-status">
        <span>Autoplay Running</span>
        <strong>{autoplayLeft} base spins left</strong>
      </div>

      <button className="autoplay-stop-button" onClick={handleStopAutoplay}>
        Stop Autoplay
      </button>
    </>
  ) : (
    <>
      <span className="autoplay-label">Autoplay</span>

      <div className="autoplay-buttons">
        {[10, 25, 50].map((spins) => (
          <button
            key={spins}
            onClick={() => handleStartAutoplay(spins)}
            disabled={isSpinning || showBonusIntro || showBonusComplete}
          >
            {spins}
          </button>
        ))}
      </div>
    </>
  )}
</div>
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
              <div className="coin-burst" aria-hidden="true">
                {Array.from({ length: isMegaWin ? 28 : 18 }).map((_, index) => (
                  <span
                    className="coin-particle"
                    key={index}
                    style={
                      {
                        "--coin-index": index,
                        "--coin-angle": `${(360 / (isMegaWin ? 28 : 18)) * index}deg`,
                        "--coin-distance": `${
                          isMegaWin ? 170 + (index % 5) * 18 : 120 + (index % 4) * 16
                        }px`,
                        "--coin-delay": `${(index % 7) * 0.035}s`,
                      } as CSSProperties
                    }
                  >
                    🪙
                  </span>
                ))}
              </div>

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
        <div className="paytable-modal-backdrop" onClick={() => setShowPaytable(false)}>
          <section className="paytable-modal" onClick={(event) => event.stopPropagation()}>
            <div className="paytable-modal-header">
              <div>
                <span>Gold Rush Lines</span>
                <h2>Paytable</h2>
              </div>

              <button className="paytable-close-button" onClick={() => setShowPaytable(false)}>
                ×
              </button>
            </div>

            <div className="paytable-modal-grid">
              <div className="paytable-modal-head">Symbol</div>
              <div className="paytable-modal-head">3</div>
              <div className="paytable-modal-head">4</div>
              <div className="paytable-modal-head">5</div>

              {PAYTABLE.map((entry) => (
                <div className="paytable-modal-row" key={entry.symbol}>
                  <div className="paytable-modal-symbol">
                    <img className="paytable-modal-image" src={entry.image} alt={entry.name} />
                    <strong>{entry.name}</strong>
                  </div>

                  <div className="paytable-modal-value">{entry.three ? `${entry.three}x` : "—"}</div>
                  <div className="paytable-modal-value">{entry.four ? `${entry.four}x` : "—"}</div>
                  <div className="paytable-modal-value">{entry.five ? `${entry.five}x` : "—"}</div>
                </div>
              ))}
            </div>

            <p className="paytable-note">
              Pays are shown as bet multipliers. Wild substitutes for all paying symbols except
              Scatter. Three or more Scatters award Free Spins.
            </p>
          </section>
        </div>
      )}
      {showBonusIntro && (
  <div className="bonus-intro-overlay">
    <div className="bonus-intro-card">
      <div className="bonus-intro-glow" />

      <span className="bonus-intro-label">Scatter Bonus</span>

      <strong className="bonus-intro-title">
        {lastFreeSpinsAwarded > 0 ? lastFreeSpinsAwarded : safeFreeSpinsLeft} Free Spins
      </strong>

      <p className="bonus-intro-text">
        Bonus mode activated. All Free Spins wins pay with a x2 multiplier.
      </p>

      <div className="bonus-intro-features">
        <div>
          <span>Mode</span>
          <strong>Free Spins</strong>
        </div>

        <div>
          <span>Multiplier</span>
          <strong>x2 Wins</strong>
        </div>

        <div>
          <span>Bet Cost</span>
          <strong>Free</strong>
        </div>
      </div>

      <button
        className="bonus-intro-button"
        onClick={() => setShowBonusIntro(false)}
      >
        Start Free Spins
      </button>
    </div>
  </div>
)}
{showBonusComplete && (
  <div className="bonus-complete-overlay">
    <div className="bonus-complete-card">
      <div className="bonus-complete-glow" />

      <span className="bonus-complete-label">Bonus Complete</span>

      <strong className="bonus-complete-title">
        {bonusTotalWin.toFixed(2)}
      </strong>

      <p className="bonus-complete-text">
        Total Free Spins win. Returning to base game.
      </p>

      <div className="bonus-complete-stats">
        <div>
          <span>Total Bonus Win</span>
          <strong>{bonusTotalWin.toFixed(2)}</strong>
        </div>

        <div>
          <span>Mode</span>
          <strong>Base Game</strong>
        </div>
      </div>

      <button
        className="bonus-complete-button"
        onClick={() => {
          setShowBonusComplete(false);
          setLastFreeSpinsAwarded(0);
        }}
      >
        Return to Base Game
      </button>
    </div>
  </div>
)}
    </main>
  );
}