import { replayMoves } from "../engine/game";
import type { GameConfiguration, GameState } from "../engine/types";
import {
  activeGameSchema,
  gameRecordSchema,
  type ActiveGameV1,
  type GameRecordV1,
  type MoveTelemetry,
} from "./schema";

const HISTORY_KEY = "uttt-history-v1";
const ACTIVE_KEY = "uttt-active-v1";
const HISTORY_LIMIT = 50;

function validateConfiguration(
  mode: GameConfiguration["mode"],
  players: GameConfiguration["players"],
  depths: GameConfiguration["depths"],
): void {
  const aiPlayers = (["X", "O"] as const).filter((player) => players[player] === "ai");
  const expectedAiCount = mode === "local" ? 0 : mode === "human-ai" ? 1 : 2;
  if (aiPlayers.length !== expectedAiCount) {
    throw new Error(`Player configuration does not match ${mode} mode`);
  }
  for (const player of ["X", "O"] as const) {
    if (players[player] === "ai" && depths[player] === undefined) {
      throw new Error(`${player} AI is missing its search depth`);
    }
    if (players[player] === "human" && depths[player] !== undefined) {
      throw new Error(`${player} is human but has an AI search depth`);
    }
  }
}

function validateTelemetry(
  moves: readonly GameRecordV1["moves"][number][],
  telemetry: readonly MoveTelemetry[],
  players: GameConfiguration["players"],
  depths: GameConfiguration["depths"],
): void {
  const seenTurns = new Set<number>();
  for (const item of telemetry) {
    const move = moves[item.turn - 1];
    if (!move || move.board !== item.move.board || move.cell !== item.move.cell || move.player !== item.move.player) {
      throw new Error(`Telemetry for turn ${item.turn} does not match the replay move`);
    }
    if (item.player !== move.player || players[item.player] !== "ai") {
      throw new Error(`Telemetry for turn ${item.turn} is not associated with an AI move`);
    }
    if (depths[item.player] !== item.depth) {
      throw new Error(`Telemetry depth for turn ${item.turn} does not match the player configuration`);
    }
    if (seenTurns.has(item.turn)) throw new Error(`Telemetry contains duplicate turn ${item.turn}`);
    seenTurns.add(item.turn);
  }
}

export function validateRecord(input: unknown): GameRecordV1 {
  const record = gameRecordSchema.parse(input);
  validateConfiguration(record.mode, record.players, record.depths);
  validateTelemetry(record.moves, record.telemetry, record.players, record.depths);
  const finalState = replayMoves(record.moves);
  if (finalState.result !== record.outcome) {
    throw new Error("The replay outcome does not match its moves");
  }
  return record;
}

export function parseImportedRecords(input: string): GameRecordV1[] {
  const parsed: unknown = JSON.parse(input);
  const candidates = Array.isArray(parsed) ? parsed : [parsed];
  if (candidates.length === 0) throw new Error("The file contains no games");
  return candidates.map(validateRecord);
}

export function loadHistory(): GameRecordV1[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.flatMap((record) => {
      try {
        return [validateRecord(record)];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

export function saveRecords(records: readonly GameRecordV1[]): GameRecordV1[] {
  const byId = new Map(loadHistory().map((record) => [record.id, record]));
  records.forEach((record) => byId.set(record.id, validateRecord(record)));
  const history = [...byId.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, HISTORY_LIMIT);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function saveActiveGame(
  configuration: GameConfiguration,
  state: GameState,
  telemetry: readonly MoveTelemetry[],
): void {
  if (state.result !== null || state.moves.length === 0) {
    localStorage.removeItem(ACTIVE_KEY);
    return;
  }
  const active: ActiveGameV1 = {
    version: 1,
    configuration,
    moves: state.moves,
    telemetry: [...telemetry],
  };
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
}

export function loadActiveGame(): (ActiveGameV1 & { state: GameState }) | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const active = activeGameSchema.parse(JSON.parse(raw));
    validateConfiguration(active.configuration.mode, active.configuration.players, active.configuration.depths);
    validateTelemetry(active.moves, active.telemetry, active.configuration.players, active.configuration.depths);
    const state = replayMoves(active.moves);
    if (state.result !== null) {
      localStorage.removeItem(ACTIVE_KEY);
      return null;
    }
    return { ...active, state };
  } catch {
    localStorage.removeItem(ACTIVE_KEY);
    return null;
  }
}

export function clearActiveGame(): void {
  localStorage.removeItem(ACTIVE_KEY);
}

export function createRecord(
  configuration: GameConfiguration,
  state: GameState,
  telemetry: readonly MoveTelemetry[],
): GameRecordV1 {
  if (state.result === null) throw new Error("Cannot save an unfinished game as a replay");
  return {
    version: 1,
    id: globalThis.crypto?.randomUUID?.() ?? `game-${Date.now()}`,
    createdAt: new Date().toISOString(),
    mode: configuration.mode,
    players: configuration.players,
    depths: configuration.depths,
    outcome: state.result,
    moves: state.moves,
    telemetry: [...telemetry],
  };
}

export function downloadRecords(records: readonly GameRecordV1[], fileName = "uttt-replays.json"): void {
  const blob = new Blob([JSON.stringify(records.length === 1 ? records[0] : records, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function loadBundledRecords(): Promise<GameRecordV1[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}replays/index.json`);
  if (!response.ok) throw new Error("Bundled replays could not be loaded");
  const input: unknown = await response.json();
  if (!Array.isArray(input)) throw new Error("Bundled replay index is malformed");
  return input.map(validateRecord);
}
