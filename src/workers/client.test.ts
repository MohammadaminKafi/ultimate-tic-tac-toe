import { createGame } from "../engine/game";
import type { SearchTelemetry } from "../engine/types";
import { cancelSearch, requestSearch, SearchCancelledError } from "./client";

class FakeWorker {
  static instances: FakeWorker[] = [];

  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  terminated = false;
  request: { id: number } | null = null;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(request: { id: number }) {
    this.request = request;
  }

  terminate() {
    this.terminated = true;
  }
}

const result: SearchTelemetry = {
  move: { board: 0, cell: 0, player: "X" },
  score: 0,
  elapsedMs: 1,
  depth: 2,
  nodesVisited: 10,
  prunes: 2,
};

describe("AI worker client", () => {
  beforeEach(() => {
    cancelSearch();
    FakeWorker.instances = [];
    vi.stubGlobal("Worker", FakeWorker);
  });

  afterEach(() => {
    cancelSearch();
    vi.unstubAllGlobals();
  });

  it("rejects deliberate cancellation with a distinct non-error state", async () => {
    const pending = requestSearch(createGame(), "X", 2);
    const active = FakeWorker.instances[0];

    cancelSearch();

    await expect(pending).rejects.toBeInstanceOf(SearchCancelledError);
    expect(active?.terminated).toBe(true);
  });

  it("ignores stale responses and stale worker errors", async () => {
    const stalePromise = requestSearch(createGame(), "X", 2);
    const stale = FakeWorker.instances[0];
    const currentPromise = requestSearch(createGame(), "X", 2);
    const current = FakeWorker.instances[1];
    await expect(stalePromise).rejects.toBeInstanceOf(SearchCancelledError);

    stale?.onmessage?.({ data: { id: stale.request?.id, ok: true, result } } as MessageEvent);
    stale?.onerror?.();
    current?.onmessage?.({ data: { id: current.request?.id, ok: true, result } } as MessageEvent);

    await expect(currentPromise).resolves.toEqual(result);
  });
});
