import { createMockSpinResult } from "../../shared/gameEngine";

const SPINS = 100_000;
const BET = 1;

type Stats = {
  totalBet: number;
  totalWin: number;
  winningSpins: number;
  wins3x: number;
  wins5x: number;
  wins10x: number;
  wins25x: number;
  wins50x: number;
  wins100x: number;
  maxMultiplier: number;
  maxWin: number;
};

const stats: Stats = {
  totalBet: 0,
  totalWin: 0,
  winningSpins: 0,
  wins3x: 0,
  wins5x: 0,
  wins10x: 0,
  wins25x: 0,
  wins50x: 0,
  wins100x: 0,
  maxMultiplier: 0,
  maxWin: 0,
};

for (let spinIndex = 0; spinIndex < SPINS; spinIndex += 1) {
  const result = createMockSpinResult(BET);
  const multiplier = result.evaluation.totalMultiplier;
  const win = result.evaluation.totalWin;

  stats.totalBet += BET;
  stats.totalWin += win;

  if (win > 0) {
    stats.winningSpins += 1;
  }

  if (multiplier >= 3) stats.wins3x += 1;
  if (multiplier >= 5) stats.wins5x += 1;
  if (multiplier >= 10) stats.wins10x += 1;
  if (multiplier >= 25) stats.wins25x += 1;
  if (multiplier >= 50) stats.wins50x += 1;
  if (multiplier >= 100) stats.wins100x += 1;

  if (multiplier > stats.maxMultiplier) {
    stats.maxMultiplier = multiplier;
    stats.maxWin = win;
  }
}

function percent(value: number): string {
  return `${((value / SPINS) * 100).toFixed(2)}%`;
}

const rtp = (stats.totalWin / stats.totalBet) * 100;
const hitRate = (stats.winningSpins / SPINS) * 100;

console.log("");
console.log("Gold Rush Lines Simulation");
console.log("--------------------------");
console.log(`Spins:        ${SPINS.toLocaleString()}`);
console.log(`Bet:          ${BET}`);
console.log(`Total Bet:    ${stats.totalBet.toFixed(2)}`);
console.log(`Total Win:    ${stats.totalWin.toFixed(2)}`);
console.log(`RTP:          ${rtp.toFixed(2)}%`);
console.log(`Hit Rate:     ${hitRate.toFixed(2)}%`);
console.log("");
console.log("Win Distribution");
console.log("----------------");
console.log(`3x+ wins:     ${stats.wins3x.toLocaleString()} (${percent(stats.wins3x)})`);
console.log(`5x+ wins:     ${stats.wins5x.toLocaleString()} (${percent(stats.wins5x)})`);
console.log(`10x+ wins:    ${stats.wins10x.toLocaleString()} (${percent(stats.wins10x)})`);
console.log(`25x+ wins:    ${stats.wins25x.toLocaleString()} (${percent(stats.wins25x)})`);
console.log(`50x+ wins:    ${stats.wins50x.toLocaleString()} (${percent(stats.wins50x)})`);
console.log(`100x+ wins:   ${stats.wins100x.toLocaleString()} (${percent(stats.wins100x)})`);
console.log("");
console.log("Max Result");
console.log("----------");
console.log(`Max Multiplier: ${stats.maxMultiplier.toFixed(2)}x`);
console.log(`Max Win:        ${stats.maxWin.toFixed(2)}`);
console.log("");