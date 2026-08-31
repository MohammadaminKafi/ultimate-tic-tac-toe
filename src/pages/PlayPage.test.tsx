import { render, screen } from "@testing-library/react";

import { applyMove, createGame } from "../engine/game";
import type { GameConfiguration } from "../engine/types";
import { saveActiveGame } from "../persistence/storage";
import { PlayPage } from "./PlayPage";

beforeEach(() => localStorage.clear());

it("offers to resume a legal interrupted game", () => {
  const configuration: GameConfiguration = {
    mode: "local",
    players: { X: "human", O: "human" },
    depths: {},
    speedMs: 600,
  };
  const state = applyMove(createGame(), { board: 0, cell: 4, player: "X" });
  saveActiveGame(configuration, state, []);

  render(<PlayPage />);
  expect(screen.getByText("Match restored")).toBeVisible();
  expect(screen.getByText("O to move")).toBeVisible();
});
