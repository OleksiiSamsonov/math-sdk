import type { SpinResult } from "./gameEngine";

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

const BACKEND_URL = "http://localhost:4000";

export async function requestSpin(request: SpinRequest): Promise<SpinApiResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/spin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message ?? "Spin request failed.",
      };
    }

    return data as SpinResponse;
  } catch {
    return {
      success: false,
      message: "Backend is not available. Start the backend server and try again.",
    };
  }
}