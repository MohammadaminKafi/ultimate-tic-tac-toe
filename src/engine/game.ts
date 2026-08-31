import type { Cell, GameState, LocalResult, Move, Player } from "./types";

export const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export class IllegalMoveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllegalMoveError";
  }
}

export function createGame(): GameState {
  return {
    boards: Array.from({ length: 9 }, () => Array<Cell>(9).fill(null)),
    localResults: Array<LocalResult>(9).fill(null),
    requiredBoard: null,
    currentPlayer: "X",
    result: null,
    moves: [],
  };
}

export function otherPlayer(player: Player): Player {
  return player === "X" ? "O" : "X";
}

export function winnerOf(cells: readonly (Cell | LocalResult)[]): Player | null {
  for (const [first, second, third] of WINNING_LINES) {
    const value = cells[first];
    if ((value === "X" || value === "O") && value === cells[second] && value === cells[third]) {
      return value;
    }
  }
  return null;
}

export function legalMoves(state: GameState): Move[] {
  if (state.result !== null) return [];

  const boardIndexes =
    state.requiredBoard !== null && state.localResults[state.requiredBoard] === null
      ? [state.requiredBoard]
      : Array.from({ length: 9 }, (_, index) => index).filter(
          (index) => state.localResults[index] === null,
        );

  const moves: Move[] = [];
  for (const board of boardIndexes) {
    for (let cell = 0; cell < 9; cell += 1) {
      if (state.boards[board]?.[cell] === null) {
        moves.push({ board, cell, player: state.currentPlayer });
      }
    }
  }
  return moves;
}

function assertIndex(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 8) {
    throw new IllegalMoveError(`${label} must be an integer from 0 to 8`);
  }
}

export function applyMove(state: GameState, move: Move): GameState {
  assertIndex(move.board, "Board");
  assertIndex(move.cell, "Cell");
  if (move.player !== "X" && move.player !== "O") {
    throw new IllegalMoveError("Player must be X or O");
  }
  if (state.result !== null) throw new IllegalMoveError("The game is already over");
  if (move.player !== state.currentPlayer) {
    throw new IllegalMoveError(`It is ${state.currentPlayer}'s turn`);
  }
  if (
    state.requiredBoard !== null &&
    state.localResults[state.requiredBoard] === null &&
    move.board !== state.requiredBoard
  ) {
    throw new IllegalMoveError(`Move must be played in local board ${state.requiredBoard + 1}`);
  }
  if (state.localResults[move.board] !== null) {
    throw new IllegalMoveError("That local board is already complete");
  }
  if (state.boards[move.board]?.[move.cell] !== null) {
    throw new IllegalMoveError("That cell is already occupied");
  }

  const boards = state.boards.map((board, index) =>
    index === move.board ? [...board] : board,
  );
  const playedBoard = boards[move.board];
  if (!playedBoard) throw new IllegalMoveError("Local board does not exist");
  playedBoard[move.cell] = move.player;

  const localResults = [...state.localResults];
  const localWinner = winnerOf(playedBoard);
  if (localWinner) localResults[move.board] = localWinner;
  else if (playedBoard.every((cell) => cell !== null)) localResults[move.board] = "draw";

  const globalWinner = winnerOf(localResults);
  const result = globalWinner ?? (localResults.every((value) => value !== null) ? "draw" : null);
  const routedBoard = localResults[move.cell] === null ? move.cell : null;

  return {
    boards,
    localResults,
    requiredBoard: result === null ? routedBoard : null,
    currentPlayer: otherPlayer(move.player),
    result,
    moves: [...state.moves, move],
  };
}

export function replayMoves(moves: readonly Move[]): GameState {
  return moves.reduce((state, move) => applyMove(state, move), createGame());
}

export function isLegalMove(state: GameState, board: number, cell: number): boolean {
  return legalMoves(state).some((move) => move.board === board && move.cell === cell);
}
