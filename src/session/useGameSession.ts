import { useCallback, useEffect, useReducer, useRef } from "react";

import { applyMove, createGame } from "../engine/game";
import type { GameConfiguration, GameState, Move, SearchTelemetry } from "../engine/types";
import {
  clearActiveGame,
  createRecord,
  loadActiveGame,
  saveActiveGame,
  saveRecords,
} from "../persistence/storage";
import type { MoveTelemetry } from "../persistence/schema";
import { cancelSearch, requestSearch } from "../workers/client";

interface SessionState {
  phase: "setup" | "playing" | "complete";
  game: GameState;
  configuration: GameConfiguration;
  telemetry: MoveTelemetry[];
  thinking: boolean;
  paused: boolean;
  restored: boolean;
  saved: boolean;
  error: string | null;
  stepNonce: number;
}

type Action =
  | { type: "START"; configuration: GameConfiguration }
  | { type: "RESTORE_DISMISSED" }
  | { type: "MOVE"; move: Move; telemetry?: SearchTelemetry }
  | { type: "THINKING"; value: boolean }
  | { type: "ERROR"; message: string }
  | { type: "TOGGLE_PAUSE" }
  | { type: "SET_SPEED"; speedMs: number }
  | { type: "STEP" }
  | { type: "MARK_SAVED" }
  | { type: "NEW_GAME" }
  | { type: "RESTART" };

export const DEFAULT_CONFIGURATION: GameConfiguration = {
  mode: "human-ai",
  players: { X: "human", O: "ai" },
  depths: { O: 3 },
  speedMs: 600,
};

function initialState(): SessionState {
  const active = loadActiveGame();
  if (active) {
    return {
      phase: "playing",
      game: active.state,
      configuration: active.configuration,
      telemetry: active.telemetry,
      thinking: false,
      paused: active.configuration.mode === "ai-ai",
      restored: true,
      saved: false,
      error: null,
      stepNonce: 0,
    };
  }
  return {
    phase: "setup",
    game: createGame(),
    configuration: DEFAULT_CONFIGURATION,
    telemetry: [],
    thinking: false,
    paused: false,
    restored: false,
    saved: false,
    error: null,
    stepNonce: 0,
  };
}

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        phase: "playing",
        game: createGame(),
        configuration: action.configuration,
        telemetry: [],
        thinking: false,
        paused: false,
        restored: false,
        saved: false,
        error: null,
      };
    case "MOVE": {
      try {
        const game = applyMove(state.game, action.move);
        const telemetry = action.telemetry
          ? [
              ...state.telemetry,
              {
                turn: game.moves.length,
                player: action.move.player,
                ...action.telemetry,
              },
            ]
          : state.telemetry;
        return {
          ...state,
          phase: game.result === null ? "playing" : "complete",
          game,
          telemetry,
          thinking: false,
          error: null,
        };
      } catch (error) {
        return {
          ...state,
          thinking: false,
          error: error instanceof Error ? error.message : "That move is not legal",
        };
      }
    }
    case "THINKING":
      return { ...state, thinking: action.value, error: null };
    case "ERROR":
      return { ...state, thinking: false, error: action.message };
    case "TOGGLE_PAUSE":
      return { ...state, paused: !state.paused, thinking: false };
    case "SET_SPEED":
      return {
        ...state,
        configuration: { ...state.configuration, speedMs: action.speedMs },
        thinking: false,
      };
    case "STEP":
      return { ...state, paused: true, stepNonce: state.stepNonce + 1 };
    case "RESTORE_DISMISSED":
      return { ...state, restored: false };
    case "MARK_SAVED":
      return { ...state, saved: true };
    case "RESTART":
      return {
        ...state,
        phase: "playing",
        game: createGame(),
        telemetry: [],
        thinking: false,
        paused: false,
        restored: false,
        saved: false,
        error: null,
      };
    case "NEW_GAME":
      return {
        ...initialState(),
        phase: "setup",
        restored: false,
      };
  }
}

export function useGameSession() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const steppedRef = useRef(0);
  const thinkingRef = useRef(state.thinking);

  useEffect(() => {
    thinkingRef.current = state.thinking;
  }, [state.thinking]);

  useEffect(() => {
    if (state.phase === "playing") {
      saveActiveGame(state.configuration, state.game, state.telemetry);
    }
  }, [state.configuration, state.game, state.phase, state.telemetry]);

  useEffect(() => {
    if (state.phase !== "complete" || state.saved) return;
    saveRecords([createRecord(state.configuration, state.game, state.telemetry)]);
    clearActiveGame();
    dispatch({ type: "MARK_SAVED" });
  }, [state.configuration, state.game, state.phase, state.saved, state.telemetry]);

  useEffect(() => {
    const playerType = state.configuration.players[state.game.currentPlayer];
    const isStep = state.stepNonce > steppedRef.current;
    if (
      state.phase !== "playing" ||
      playerType !== "ai" ||
      thinkingRef.current ||
      (state.paused && !isStep)
    ) {
      return;
    }

    if (isStep) steppedRef.current = state.stepNonce;
    const snapshot = state.game;
    const player = snapshot.currentPlayer;
    const depth = state.configuration.depths[player] ?? 3;
    const delay = state.configuration.mode === "ai-ai" ? state.configuration.speedMs : 180;
    dispatch({ type: "THINKING", value: true });

    const timer = window.setTimeout(() => {
      requestSearch(snapshot, player, depth)
        .then((telemetry) => dispatch({ type: "MOVE", move: telemetry.move, telemetry }))
        .catch((error: unknown) =>
          dispatch({
            type: "ERROR",
            message: error instanceof Error ? error.message : "AI search failed",
          }),
        );
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelSearch();
    };
  }, [
    state.configuration,
    state.game,
    state.paused,
    state.phase,
    state.stepNonce,
  ]);

  const start = useCallback((configuration: GameConfiguration) => {
    cancelSearch();
    clearActiveGame();
    dispatch({ type: "START", configuration });
  }, []);

  const play = useCallback(
    (board: number, cell: number) => {
      if (state.thinking || state.configuration.players[state.game.currentPlayer] !== "human") return;
      dispatch({ type: "MOVE", move: { board, cell, player: state.game.currentPlayer } });
    },
    [state.configuration.players, state.game.currentPlayer, state.thinking],
  );

  const newGame = useCallback(() => {
    cancelSearch();
    clearActiveGame();
    dispatch({ type: "NEW_GAME" });
  }, []);

  const restart = useCallback(() => {
    cancelSearch();
    clearActiveGame();
    dispatch({ type: "RESTART" });
  }, []);

  const setSpeed = useCallback((speedMs: number) => {
    cancelSearch();
    dispatch({ type: "SET_SPEED", speedMs });
  }, []);

  return {
    state,
    start,
    play,
    newGame,
    restart,
    togglePause: () => {
      cancelSearch();
      dispatch({ type: "TOGGLE_PAUSE" });
    },
    setSpeed,
    step: () => dispatch({ type: "STEP" }),
    dismissRestore: () => dispatch({ type: "RESTORE_DISMISSED" }),
  };
}
