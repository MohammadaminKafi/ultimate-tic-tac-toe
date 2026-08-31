import { render, screen } from "@testing-library/react";

import { applyMove, createGame } from "../engine/game";
import type { MoveTelemetry } from "../persistence/schema";
import { GameInspector } from "./GameInspector";

it("renders the latest AI telemetry and routed destination", () => {
  const move = { board: 0, cell: 4, player: "X" as const };
  const game = applyMove(createGame(), move);
  const telemetry: MoveTelemetry[] = [{
    turn: 1,
    player: "X",
    move,
    score: 12.5,
    elapsedMs: 8.25,
    depth: 3,
    nodesVisited: 1_234,
    prunes: 56,
  }];

  render(<GameInspector game={game} telemetry={telemetry} thinking={false} />);
  expect(screen.getByText("+12.50")).toBeVisible();
  expect(screen.getByText("1,234 / 56")).toBeVisible();
  expect(screen.getByText("Local board 5")).toBeVisible();
});
