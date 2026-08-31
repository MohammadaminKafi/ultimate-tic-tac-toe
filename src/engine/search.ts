import { applyMove, legalMoves } from "./game";
import { evaluate, MAX_SCORE, MIN_SCORE } from "./evaluation";
import type { GameState, Move, Player, SearchTelemetry } from "./types";

interface SearchCounters {
  nodesVisited: number;
  prunes: number;
}

interface SearchResult {
  score: number;
  move: Move | null;
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  counters: SearchCounters,
): SearchResult {
  counters.nodesVisited += 1;
  if (depth === 0 || state.result !== null) return { score: evaluate(state), move: null };

  const moves = legalMoves(state);
  if (moves.length === 0) return { score: evaluate(state), move: null };

  const maximizing = state.currentPlayer === "X";
  let bestScore = maximizing ? MIN_SCORE : MAX_SCORE;
  let bestMove: Move | null = null;

  for (const move of moves) {
    const candidate = minimax(applyMove(state, move), depth - 1, alpha, beta, counters).score;
    if (
      bestMove === null ||
      (maximizing && candidate > bestScore) ||
      (!maximizing && candidate < bestScore)
    ) {
      bestScore = candidate;
      bestMove = move;
    }

    if (maximizing) alpha = Math.max(alpha, bestScore);
    else beta = Math.min(beta, bestScore);
    if (alpha >= beta) {
      counters.prunes += 1;
      break;
    }
  }

  return { score: bestScore, move: bestMove };
}

export function searchBestMove(state: GameState, player: Player, depth: number): SearchTelemetry {
  if (state.result !== null) throw new Error("Cannot search a completed game");
  if (state.currentPlayer !== player) throw new Error(`Expected ${state.currentPlayer} to move`);
  if (!Number.isInteger(depth) || depth < 1 || depth > 6) {
    throw new Error("Depth must be an integer from 1 to 6");
  }

  const counters: SearchCounters = { nodesVisited: 0, prunes: 0 };
  const started = performance.now();
  const result = minimax(state, depth, MIN_SCORE, MAX_SCORE, counters);
  if (!result.move) throw new Error("No legal move is available");

  return {
    move: result.move,
    score: result.score,
    elapsedMs: performance.now() - started,
    depth,
    nodesVisited: counters.nodesVisited,
    prunes: counters.prunes,
  };
}
