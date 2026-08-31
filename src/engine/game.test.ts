import { applyMove, createGame, IllegalMoveError, legalMoves, replayMoves } from "./game";
import type { Cell, GameState, LocalResult } from "./types";

function stateWith(overrides: Partial<GameState>): GameState {
  return { ...createGame(), ...overrides };
}

describe("Ultimate Tic-Tac-Toe rules", () => {
  it("starts with 81 deterministic legal moves", () => {
    const moves = legalMoves(createGame());
    expect(moves).toHaveLength(81);
    expect(moves[0]).toEqual({ board: 0, cell: 0, player: "X" });
    expect(moves.at(-1)).toEqual({ board: 8, cell: 8, player: "X" });
  });

  it("routes the next player to the matching board", () => {
    const game = applyMove(createGame(), { board: 0, cell: 4, player: "X" });
    expect(game.requiredBoard).toBe(4);
    expect(game.currentPlayer).toBe("O");
    expect(legalMoves(game)).toHaveLength(9);
  });

  it("rejects wrong-board, repeated-turn, occupied, and invalid moves", () => {
    const game = applyMove(createGame(), { board: 0, cell: 4, player: "X" });
    expect(() => applyMove(game, { board: 0, cell: 0, player: "O" })).toThrow(IllegalMoveError);
    expect(() => applyMove(game, { board: 4, cell: 0, player: "X" })).toThrow(/O's turn/);
    expect(() => applyMove(createGame(), { board: -1, cell: 0, player: "X" })).toThrow(/0 to 8/);
    const routed = applyMove(game, { board: 4, cell: 0, player: "O" });
    expect(() => applyMove(routed, { board: 0, cell: 4, player: "X" })).toThrow(/occupied/);
  });

  it("records a local draw as blocked and grants free choice when routed there", () => {
    const boards = createGame().boards;
    boards[0] = [null, "O", "X", "X", "O", "O", "O", "X", "X"];
    const game = applyMove(
      stateWith({ boards, requiredBoard: 0, currentPlayer: "X" }),
      { board: 0, cell: 0, player: "X" },
    );
    expect(game.localResults[0]).toBe("draw");
    expect(game.requiredBoard).toBeNull();
    expect(legalMoves(game).every((move) => move.board !== 0)).toBe(true);
  });

  it("detects a global win and rejects later moves", () => {
    const boards = createGame().boards;
    boards[2] = ["X", "X", null, null, null, null, null, null, null];
    const game = applyMove(
      stateWith({ boards, localResults: ["X", "X", null, null, null, null, null, null, null], requiredBoard: 2 }),
      { board: 2, cell: 2, player: "X" },
    );
    expect(game.result).toBe("X");
    expect(legalMoves(game)).toEqual([]);
    expect(() => applyMove(game, { board: 3, cell: 0, player: "O" })).toThrow(/already over/);
  });

  it("detects a neutral global draw", () => {
    const boards = createGame().boards;
    boards[8] = ["X", "O", "X", "X", "O", "O", "O", "X", null];
    const localResults: LocalResult[] = ["X", "O", "X", "O", "X", "O", "O", "X", null];
    const game = applyMove(stateWith({ boards, localResults, requiredBoard: 8 }), { board: 8, cell: 8, player: "X" });
    expect(game.result).toBe("draw");
  });

  it("replays a valid move list into the same state", () => {
    const moves = [
      { board: 0, cell: 4, player: "X" as const },
      { board: 4, cell: 2, player: "O" as const },
      { board: 2, cell: 2, player: "X" as const },
    ];
    expect(replayMoves(moves).moves).toEqual(moves);
  });

  it.each([
    [["X", "X", null, null, null, null, null, null, null] as Cell[], 2],
    [["X", null, null, "X", null, null, null, null, null] as Cell[], 6],
    [["X", null, null, null, "X", null, null, null, null] as Cell[], 8],
    [[null, null, "X", null, "X", null, null, null, null] as Cell[], 6],
  ])("recognizes every local winning direction", (before, winningCell) => {
    const boards = createGame().boards;
    boards[0] = before;
    const game = applyMove(stateWith({ boards, requiredBoard: 0 }), { board: 0, cell: winningCell, player: "X" });
    expect(game.localResults[0]).toBe("X");
  });
});
