import express from "express";
import cors from "cors";
import {
  createRandomBoard,
  evaluateBoard,
  type SymbolCode,
} from "../../shared/gameEngine";

type SpinRequest = {
  bet: number;
  balance: number;
  isFreeSpin?: boolean;

};

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "gold-rush-lines-backend",
  });
});

app.post("/api/spin", (req, res) => {
  const { bet, balance, isFreeSpin = false } = req.body as SpinRequest;

  if (typeof bet !== "number" || bet <= 0) {
    res.status(400).json({
      success: false,
      message: "Bet must be greater than zero.",
    });
    return;
  }

  if (typeof balance !== "number" || (!isFreeSpin && balance < bet)) {
    res.status(400).json({
      success: false,
      message: "Insufficient balance.",
    });
    return;
  }

  const board: SymbolCode[][] = createRandomBoard();
  const evaluation = evaluateBoard(board, bet, isFreeSpin ? 2 : 1);

  const balanceAfterBet = isFreeSpin ? balance : Number((balance - bet).toFixed(2));
  const balanceAfterWin = Number((balanceAfterBet + evaluation.totalWin).toFixed(2));

  res.json({
    success: true,
    result: {
      board,
      evaluation: {
        ...evaluation,
        winningCells: Array.from(evaluation.winningCells),
      },
    },
    balanceAfterBet,
    balanceAfterWin,
  });
});

app.listen(port, () => {
  console.log(`Gold Rush Lines mock backend running on http://localhost:${port}`);
});