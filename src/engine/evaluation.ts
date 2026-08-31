import { WINNING_LINES } from "./game";
import type { Cell, GameState, LocalResult } from "./types";

export const MIN_SCORE = -1_000_000;
export const MAX_SCORE = 1_000_000;

const SUBTABLE_WIN_WEIGHT = 13;
const SUBTABLE_LOSS_WEIGHT = -12;
const GAME_PROGRESS_WEIGHT = 1 / 4;
const FREE_CHOICE_WEIGHT = 10;
const LOCAL_THREAT_WEIGHT = 5;
const LOCAL_DANGER_WEIGHT = -5;
const GLOBAL_THREAT_WEIGHT = 13;
const GLOBAL_DANGER_WEIGHT = -14;

function countPotentialLines(table: readonly (Cell | LocalResult)[]): [number, number] {
  let xLines = 0;
  let oLines = 0;
  for (const line of WINNING_LINES) {
    const values = line.map((index) => table[index]);
    if (values.filter((value) => value === "X").length === 2 && values.filter((value) => value === null).length === 1) {
      xLines += 1;
    } else if (
      values.filter((value) => value === "O").length === 2 &&
      values.filter((value) => value === null).length === 1
    ) {
      oLines += 1;
    }
  }
  return [xLines, oLines];
}

function positionWeight(index: number, centerBonus = false): number {
  const row = Math.floor(index / 3);
  const column = index % 3;
  if (row === 1 && column === 1) return centerBonus ? 4 : 3;
  if (Math.abs(row - column) === 1) return centerBonus ? 2 : 1;
  return centerBonus ? 3 : 2;
}

export function evaluate(state: GameState): number {
  if (state.result === "X") return MAX_SCORE;
  if (state.result === "O") return MIN_SCORE;
  if (state.result === "draw") return 0;

  let wonByX = 0;
  let lostByX = 0;
  let completed = 0;
  let localThreats = 0;
  let localDangers = 0;
  let xCellValue = 0;
  let oCellValue = 0;

  for (let boardIndex = 0; boardIndex < 9; boardIndex += 1) {
    const localResult = state.localResults[boardIndex];
    if (localResult !== null) {
      const weight = positionWeight(boardIndex);
      if (localResult === "X") wonByX += weight;
      else if (localResult === "O") lostByX += weight;
      completed += 1;
      continue;
    }

    const board = state.boards[boardIndex];
    if (!board) continue;
    const [wins, losses] = countPotentialLines(board);
    localThreats += wins;
    localDangers += losses;
    board.forEach((cell, cellIndex) => {
      const weight = positionWeight(cellIndex, boardIndex === 4);
      if (cell === "X") xCellValue += weight;
      else if (cell === "O") oCellValue += weight;
    });
  }

  let freeChoice = 0;
  const lastMove = state.moves.at(-1);
  if (state.requiredBoard === null && lastMove) freeChoice = lastMove.player === "X" ? -1 : 1;
  const [globalThreats, globalDangers] = countPotentialLines(state.localResults);
  const score =
    SUBTABLE_WIN_WEIGHT * wonByX +
    SUBTABLE_LOSS_WEIGHT * lostByX +
    FREE_CHOICE_WEIGHT * freeChoice +
    LOCAL_THREAT_WEIGHT * localThreats +
    LOCAL_DANGER_WEIGHT * localDangers +
    GLOBAL_THREAT_WEIGHT * globalThreats +
    GLOBAL_DANGER_WEIGHT * globalDangers +
    (xCellValue - oCellValue);

  return GAME_PROGRESS_WEIGHT * (completed + 1) * score;
}

export const evaluationInternals = { countPotentialLines, positionWeight };
