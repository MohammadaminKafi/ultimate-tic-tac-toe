/// <reference lib="webworker" />

import { searchBestMove } from "../engine/search";
import type { GameState, Player } from "../engine/types";

export interface SearchRequest {
  id: number;
  state: GameState;
  player: Player;
  depth: number;
}

export type SearchResponse =
  | { id: number; ok: true; result: ReturnType<typeof searchBestMove> }
  | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<SearchRequest>) => {
  const { id, state, player, depth } = event.data;
  try {
    self.postMessage({ id, ok: true, result: searchBestMove(state, player, depth) } satisfies SearchResponse);
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : "Search failed",
    } satisfies SearchResponse);
  }
};
