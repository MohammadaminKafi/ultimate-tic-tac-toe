import replayFixtures from "../../public/replays/index.json";
import { applyMove, createGame, legalMoves, replayMoves } from "./game";
import { evaluate, MAX_SCORE, MIN_SCORE } from "./evaluation";
import { searchBestMove } from "./search";
import type { GameState, Move } from "./types";
import { gameRecordSchema } from "../persistence/schema";

function reference(state: GameState, depth: number): { score: number; move: Move | null } {
  if (depth === 0 || state.result !== null) return { score: evaluate(state), move: null };
  let best: { score: number; move: Move | null } = { score: state.currentPlayer === "X" ? MIN_SCORE : MAX_SCORE, move: null };
  for (const move of legalMoves(state)) {
    const score = reference(applyMove(state, move), depth - 1).score;
    if (best.move === null || (state.currentPlayer === "X" ? score > best.score : score < best.score)) best = { score, move };
  }
  return best;
}

describe("alpha-beta search", () => {
  it("keeps the corrected historical deterministic move", () => {
    const state = replayMoves([
      { board: 0, cell: 4, player: "X" },
      { board: 4, cell: 2, player: "O" },
      { board: 2, cell: 2, player: "X" },
      { board: 2, cell: 4, player: "O" },
    ]);
    const result = searchBestMove(state, "X", 2);
    expect(result.move).toEqual({ board: 4, cell: 0, player: "X" });
    expect(result.score).toBe(0);
  });

  it("matches a reference minimax on deterministic positions", () => {
    let state = createGame();
    for (const pick of [40, 2, 6, 4, 8]) {
      const moves = legalMoves(state);
      state = applyMove(state, moves[pick % moves.length] as Move);
      if (state.result) break;
      const expected = reference(state, 2);
      const actual = searchBestMove(state, state.currentPlayer, 2);
      expect({ score: actual.score, move: actual.move }).toEqual(expected);
    }
  });

  it("rejects invalid depth and completed games", () => {
    expect(() => searchBestMove(createGame(), "X", 0)).toThrow(/1 to 6/);
    expect(() => searchBestMove({ ...createGame(), result: "draw" }, "X", 2)).toThrow(/completed/);
  });

  it("still selects the first deterministic move when every line is a forced loss", () => {
    const state = createGame();
    state.currentPlayer = "X";
    state.requiredBoard = 2;
    state.localResults = ["O", "O", null, "draw", "draw", "draw", "draw", "draw", "draw"];
    state.boards[2] = ["O", "O", null, "O", "O", null, "X", null, null];

    const result = searchBestMove(state, "X", 2);
    expect(result.score).toBe(MIN_SCORE);
    expect(result.move).toEqual({ board: 2, cell: 2, player: "X" });
  });
});

describe("historical fixtures", () => {
  it("replays all six games to their declared outcomes", () => {
    expect(replayFixtures).toHaveLength(6);
    for (const input of replayFixtures) {
      const record = gameRecordSchema.parse(input);
      const finalState = replayMoves(record.moves);
      expect(finalState.result).toBe(record.outcome);
      expect(evaluate(finalState)).toBe(record.outcome === "X" ? MAX_SCORE : record.outcome === "O" ? MIN_SCORE : 0);
    }
  });
});
