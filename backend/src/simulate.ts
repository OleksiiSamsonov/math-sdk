import { createMockSpinResult, evaluateBoard } from "../../shared/gameEngine";

const BASE_SPINS = 100_000;
const BET = 1;
const FREE_SPIN_WIN_MULTIPLIER = 2;

type Stats = {
  totalBaseSpins: number;
  totalFreeSpins: number;
  totalSpinsIncludingFreeSpins: number;
  totalBet: number;
  totalWin: number;
  winningSpins: number;
  bonusTriggers: number;
  freeSpinsAwarded: number;
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
  totalBaseSpins: 0,
  totalFreeSpins: 0,
  totalSpinsIncludingFreeSpins: 0,
  totalBet: 0,
  totalWin: 0,
  winningSpins: 0,
  bonusTriggers: 0,
  freeSpinsAwarded: 0,
  wins3x: 0,
  wins5x: 0,
  wins10x: 0,
  wins25x: 0,
  wins50x: 0,
  wins100x: 0,
  maxMultiplier: 0,
  maxWin: 0,
};

function trackWin(multiplier: number, win: number) {
  stats.totalWin += win;
  stats.totalSpinsIncludingFreeSpins += 1;

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

for (let baseSpinIndex = 0; baseSpinIndex < BASE_SPINS; baseSpinIndex += 1) {
  stats.totalBaseSpins += 1;
  stats.totalBet += BET;

  const baseResult = createMockSpinResult(BET);
  const baseEvaluation = baseResult.evaluation;

  trackWin(baseEvaluation.totalMultiplier, baseEvaluation.totalWin);

  if (baseEvaluation.freeSpinsAwarded > 0) {
    stats.bonusTriggers += 1;
    stats.freeSpinsAwarded += baseEvaluation.freeSpinsAwarded;

    let freeSpinsLeft = baseEvaluation.freeSpinsAwarded;

    while (freeSpinsLeft > 0) {
      freeSpinsLeft -= 1;
      stats.totalFreeSpins += 1;

      const freeSpinBoard = createMockSpinResult(BET).board;
      const freeSpinEvaluation = evaluateBoard(
        freeSpinBoard,
        BET,
        FREE_SPIN_WIN_MULTIPLIER
      );

      trackWin(freeSpinEvaluation.totalMultiplier, freeSpinEvaluation.totalWin);

      if (freeSpinEvaluation.freeSpinsAwarded > 0) {
        stats.bonusTriggers += 1;
        stats.freeSpinsAwarded += freeSpinEvaluation.freeSpinsAwarded;
        freeSpinsLeft += freeSpinEvaluation.freeSpinsAwarded;
      }
    }
  }
}

function percentOfBaseSpins(value: number): string {
  return `${((value / BASE_SPINS) * 100).toFixed(2)}%`;
}

function percentOfAllSpins(value: number): string {
  return `${((value / stats.totalSpinsIncludingFreeSpins) * 100).toFixed(2)}%`;
}

const rtp = (stats.totalWin / stats.totalBet) * 100;
const hitRate = (stats.winningSpins / stats.totalSpinsIncludingFreeSpins) * 100;
const bonusFrequency =
  stats.bonusTriggers > 0 ? BASE_SPINS / stats.bonusTriggers : 0;
const averageFreeSpinsPerTrigger =
  stats.bonusTriggers > 0 ? stats.freeSpinsAwarded / stats.bonusTriggers : 0;

console.log("");
console.log("Gold Rush Lines Bonus-Aware Simulation");
console.log("--------------------------------------");
console.log(`Base Spins:              ${stats.totalBaseSpins.toLocaleString()}`);
console.log(`Free Spins Played:       ${stats.totalFreeSpins.toLocaleString()}`);
console.log(
  `Total Spins Incl. Free:  ${stats.totalSpinsIncludingFreeSpins.toLocaleString()}`
);
console.log(`Bet:                     ${BET}`);
console.log(`Total Bet:               ${stats.totalBet.toFixed(2)}`);
console.log(`Total Win:               ${stats.totalWin.toFixed(2)}`);
console.log(`RTP Incl. Free Spins:    ${rtp.toFixed(2)}%`);
console.log(`Hit Rate Incl. Free:     ${hitRate.toFixed(2)}%`);
console.log("");
console.log("Bonus Stats");
console.log("-----------");
console.log(
  `Bonus Triggers:          ${stats.bonusTriggers.toLocaleString()} (${percentOfBaseSpins(
    stats.bonusTriggers
  )} of base spins)`
);
console.log(
  `Bonus Frequency:         1 in ${bonusFrequency.toFixed(1)} base spins`
);
console.log(`Free Spins Awarded:      ${stats.freeSpinsAwarded.toLocaleString()}`);
console.log(
  `Avg Free Spins/Trigger:  ${averageFreeSpinsPerTrigger.toFixed(2)}`
);
console.log("");
console.log("Win Distribution");
console.log("----------------");
console.log(
  `3x+ wins:                ${stats.wins3x.toLocaleString()} (${percentOfAllSpins(
    stats.wins3x
  )})`
);
console.log(
  `5x+ wins:                ${stats.wins5x.toLocaleString()} (${percentOfAllSpins(
    stats.wins5x
  )})`
);
console.log(
  `10x+ wins:               ${stats.wins10x.toLocaleString()} (${percentOfAllSpins(
    stats.wins10x
  )})`
);
console.log(
  `25x+ wins:               ${stats.wins25x.toLocaleString()} (${percentOfAllSpins(
    stats.wins25x
  )})`
);
console.log(
  `50x+ wins:               ${stats.wins50x.toLocaleString()} (${percentOfAllSpins(
    stats.wins50x
  )})`
);
console.log(
  `100x+ wins:              ${stats.wins100x.toLocaleString()} (${percentOfAllSpins(
    stats.wins100x
  )})`
);
console.log("");
console.log("Max Result");
console.log("----------");
console.log(`Max Multiplier:          ${stats.maxMultiplier.toFixed(2)}x`);
console.log(`Max Win:                 ${stats.maxWin.toFixed(2)}`);
console.log("");