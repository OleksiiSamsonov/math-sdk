import { createMockSpinResult, type SpinResult } from "./gameEngine";

export type SpinRequest = {
  bet: number;
  balance: number;
};

export type SpinResponse = {
  success: true;
  result: SpinResult;
  balanceAfterBet: number;
  balanceAfterWin: number;
};

export type SpinErrorResponse = {
  success: false;
  message: string;
};

export type SpinApiResponse = SpinResponse | SpinErrorResponse;

const MOCK_LATENCY_MS = 350;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function requestSpin(request: SpinRequest): Promise<SpinApiResponse> {
  await wait(MOCK_LATENCY_MS);

  if (request.bet <= 0) {
    return {
      success: false,
      message: "Bet must be greater than zero.",
    };
  }

  if (request.balance < request.bet) {
    return {
      success: false,
      message: "Insufficient balance.",
    };
  }

  const result = createMockSpinResult(request.bet);
  const balanceAfterBet = Number((request.balance - request.bet).toFixed(2));
  const balanceAfterWin = Number((balanceAfterBet + result.evaluation.totalWin).toFixed(2));

  return {
    success: true,
    result,
    balanceAfterBet,
    balanceAfterWin,
  };
}