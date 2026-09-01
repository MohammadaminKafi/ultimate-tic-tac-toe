import type { GameState, Player, SearchTelemetry } from "../engine/types";
import type { SearchRequest, SearchResponse } from "./ai.worker";

let worker: Worker | null = null;
let requestId = 0;
let rejectActive: ((reason: SearchCancelledError) => void) | null = null;

export class SearchCancelledError extends Error {
  constructor() {
    super("AI search cancelled");
    this.name = "SearchCancelledError";
  }
}

export function isSearchCancelled(error: unknown): error is SearchCancelledError {
  return error instanceof SearchCancelledError;
}

function createWorker(): Worker {
  return new Worker(new URL("./ai.worker.ts", import.meta.url), { type: "module" });
}

export function cancelSearch(): void {
  worker?.terminate();
  worker = null;
  requestId += 1;
  const reject = rejectActive;
  rejectActive = null;
  reject?.(new SearchCancelledError());
}

export function requestSearch(
  state: GameState,
  player: Player,
  depth: number,
): Promise<SearchTelemetry> {
  cancelSearch();
  worker = createWorker();
  const activeWorker = worker;
  const id = ++requestId;

  return new Promise((resolve, reject) => {
    rejectActive = reject;
    activeWorker.onmessage = (event: MessageEvent<SearchResponse>) => {
      if (event.data.id !== id || activeWorker !== worker) return;
      activeWorker.terminate();
      worker = null;
      rejectActive = null;
      if (event.data.ok) resolve(event.data.result);
      else reject(new Error(event.data.error));
    };
    activeWorker.onerror = () => {
      if (activeWorker !== worker) return;
      worker = null;
      activeWorker.terminate();
      rejectActive = null;
      reject(new Error("The AI worker stopped unexpectedly"));
    };
    activeWorker.postMessage({ id, state, player, depth } satisfies SearchRequest);
  });
}
