import { applyMove, createGame } from "../engine/game";
import type { GameConfiguration } from "../engine/types";
import { createRecord, loadActiveGame, loadHistory, parseImportedRecords, saveActiveGame, saveRecords } from "./storage";
import replayFixtures from "../../public/replays/index.json";

const configuration: GameConfiguration = { mode: "local", players: { X: "human", O: "human" }, depths: {}, speedMs: 600 };

beforeEach(() => localStorage.clear());

describe("replay persistence", () => {
  it("restores an unfinished game from legal moves", () => {
    const state = applyMove(createGame(), { board: 0, cell: 4, player: "X" });
    saveActiveGame(configuration, state, []);
    expect(loadActiveGame()?.state).toEqual(state);
  });

  it("stores and imports a valid replay round trip", () => {
    const [record] = parseImportedRecords(JSON.stringify(replayFixtures[0]));
    expect(record).toBeDefined();
    expect(saveRecords([record!])).toEqual([record]);
    expect(parseImportedRecords(JSON.stringify(record))).toEqual([record]);
    expect(loadHistory()).toEqual([record]);
  });

  it("rejects synthetic terminal states and inconsistent telemetry", () => {
    const state = { ...createGame(), result: "draw" as const, moves: [{ board: 0, cell: 0, player: "X" as const }] };
    const record = createRecord(configuration, state, []);
    expect(() => saveRecords([record])).toThrow(/outcome/);

    const inconsistent = structuredClone(replayFixtures[0]!);
    inconsistent.telemetry[0]!.turn = 2;
    expect(() => parseImportedRecords(JSON.stringify(inconsistent))).toThrow(/Telemetry/);
  });

  it("rejects malformed JSON and empty imports", () => {
    expect(() => parseImportedRecords("not json")).toThrow();
    expect(() => parseImportedRecords("[]")).toThrow(/no games/);
    expect(loadHistory()).toEqual([]);
  });
});
