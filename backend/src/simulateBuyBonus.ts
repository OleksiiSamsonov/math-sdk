import { createMockSpinResult, evaluateBoard } from "../../shared/gameEngine";

const BONUS_BUYS = 50_000;
const BET = 1;
const BONUS_BUY_COST = BET * 15;
const STARTING_FREE_SPINS = 8;
const FREE_SPIN_WIN_MULTIPLIER = 2;

type BuyBonusStats = {
  totalBuys: number;
  totalCost: number;
  totalWin: number;
  totalFreeSpinsPlayed: number;
  totalRetriggers: number;
  totalFreeSpinsAwardedFromRetriggers: number;
  winningBonuses: number;
  maxBonusWin: number;
  maxBonusMultiplier: number;
  bonusWins20x: number;
  bonusWins50x: number;
  bonusWins100x: number;
  bonusWins200x: number;
  bonusWins500x: number;
};

const stats: BuyBonusStats = {
  totalBuys: 0,
  totalCost: 0,
  totalWin: 0,
  totalFreeSpinsPlayed: 0,
  totalRetriggers: 0,
  totalFreeSpinsAwardedFromRetriggers: 0,
  winningBonuses: 0,
  maxBonusWin: 0,
  maxBonusMultiplier: 0,
  bonusWins20x: 0,
  bonusWins50x: 0,
  bonusWins100x: 0,
  bonusWins200x: 0,
  bonusWins500x: 0,
};

for (let buyIndex = 0; buyIndex < BONUS_BUYS; buyIndex += 1) {
  stats.totalBuys += 1;
  stats.totalCost += BONUS_BUY_COST;

  let freeSpinsLeft = STARTING_FREE_SPINS;
  let bonusWin = 0;

  while (freeSpinsLeft > 0) {
    freeSpinsLeft -= 1;
    stats.totalFreeSpinsPlayed += 1;

    const freeSpinBoard = createMockSpinResult(BET).board;
    const evaluation = evaluateBoard(freeSpinBoard, BET, FREE_SPIN_WIN_MULTIPLIER);

    bonusWin = Number((bonusWin + evaluation.totalWin).toFixed(2));

    if (evaluation.freeSpinsAwarded > 0) {
      stats.totalRetriggers += 1;
      stats.totalFreeSpinsAwardedFromRetriggers += evaluation.freeSpinsAwarded;
      freeSpinsLeft += evaluation.freeSpinsAwarded;
    }
  }

  const bonusMultiplier = bonusWin / BET;

  stats.totalWin = Number((stats.totalWin + bonusWin).toFixed(2));

  if (bonusWin > 0) {
    stats.winningBonuses += 1;
  }

  if (bonusMultiplier >= 20) stats.bonusWins20x += 1;
  if (bonusMultiplier >= 50) stats.bonusWins50x += 1;
  if (bonusMultiplier >= 100) stats.bonusWins100x += 1;
  if (bonusMultiplier >= 200) stats.bonusWins200x += 1;
  if (bonusMultiplier >= 500) stats.bonusWins500x += 1;

  if (bonusWin > stats.maxBonusWin) {
    stats.maxBonusWin = bonusWin;
    stats.maxBonusMultiplier = bonusMultiplier;
  }
}

function percent(value: number, base: number): string {
  return `${((value / base) * 100).toFixed(2)}%`;
}

const buyBonusRtp = (stats.totalWin / stats.totalCost) * 100;
const averageBonusWin = stats.totalWin / stats.totalBuys;
const averageFreeSpinsPlayed = stats.totalFreeSpinsPlayed / stats.totalBuys;
const retriggerFrequency =
  stats.totalRetriggers > 0 ? stats.totalBuys / stats.totalRetriggers : 0;

console.log("");
console.log("Gold Rush Lines Buy Bonus Simulation");
console.log("------------------------------------");
console.log(`Bonus Buys:                       ${stats.totalBuys.toLocaleString()}`);
console.log(`Bet:                              ${BET}`);
console.log(`Buy Bonus Cost:                   ${BONUS_BUY_COST.toFixed(2)}x`);
console.log(`Starting Free Spins:              ${STARTING_FREE_SPINS}`);
console.log(`Free Spin Win Multiplier:         x${FREE_SPIN_WIN_MULTIPLIER}`);
console.log("");
console.log("Return");
console.log("------");
console.log(`Total Cost:                       ${stats.totalCost.toFixed(2)}`);
console.log(`Total Win:                        ${stats.totalWin.toFixed(2)}`);
console.log(`Buy Bonus RTP:                    ${buyBonusRtp.toFixed(2)}%`);
console.log(`Average Bonus Win:                ${averageBonusWin.toFixed(2)}x`);
console.log(`Average Loss Per Buy:             ${(BONUS_BUY_COST - averageBonusWin).toFixed(2)}x`);
console.log("");
console.log("Free Spins");
console.log("----------");
console.log(`Total Free Spins Played:          ${stats.totalFreeSpinsPlayed.toLocaleString()}`);
console.log(`Avg Free Spins Played / Buy:      ${averageFreeSpinsPlayed.toFixed(2)}`);
console.log(`Retriggers:                       ${stats.totalRetriggers.toLocaleString()}`);
console.log(
  `Retrigger Frequency:              ${
    retriggerFrequency > 0 ? `1 in ${retriggerFrequency.toFixed(1)} buys` : "None"
  }`
);
console.log(
  `Free Spins From Retriggers:       ${stats.totalFreeSpinsAwardedFromRetriggers.toLocaleString()}`
);
console.log("");
console.log("Bonus Distribution");
console.log("------------------");
console.log(
  `Winning Bonuses:                  ${stats.winningBonuses.toLocaleString()} (${percent(
    stats.winningBonuses,
    stats.totalBuys
  )})`
);
console.log(
  `20x+ bonuses:                     ${stats.bonusWins20x.toLocaleString()} (${percent(
    stats.bonusWins20x,
    stats.totalBuys
  )})`
);
console.log(
  `50x+ bonuses:                     ${stats.bonusWins50x.toLocaleString()} (${percent(
    stats.bonusWins50x,
    stats.totalBuys
  )})`
);
console.log(
  `100x+ bonuses:                    ${stats.bonusWins100x.toLocaleString()} (${percent(
    stats.bonusWins100x,
    stats.totalBuys
  )})`
);
console.log(
  `200x+ bonuses:                    ${stats.bonusWins200x.toLocaleString()} (${percent(
    stats.bonusWins200x,
    stats.totalBuys
  )})`
);
console.log(
  `500x+ bonuses:                    ${stats.bonusWins500x.toLocaleString()} (${percent(
    stats.bonusWins500x,
    stats.totalBuys
  )})`
);
console.log("");
console.log("Max Bonus");
console.log("---------");
console.log(`Max Bonus Win:                    ${stats.maxBonusWin.toFixed(2)}x`);
console.log(`Max Bonus Multiplier:             ${stats.maxBonusMultiplier.toFixed(2)}x`);
console.log("");