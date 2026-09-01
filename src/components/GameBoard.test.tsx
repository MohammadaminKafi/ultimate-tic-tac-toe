import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { applyMove, createGame } from "../engine/game";
import { GameBoard } from "./GameBoard";

describe("GameBoard", () => {
  it("exposes legal cells and reports a selected move", async () => {
    const onMove = vi.fn();
    render(<GameBoard state={createGame()} onMove={onMove} />);
    await userEvent.click(screen.getByRole("gridcell", { name: /Board 1, cell 1, playable/ }));
    expect(onMove).toHaveBeenCalledWith(0, 0);
  });

  it("highlights only the routed board after a move", () => {
    const state = applyMove(createGame(), { board: 0, cell: 4, player: "X" });
    render(<GameBoard state={state} />);
    expect(screen.getByLabelText("Local board 5")).toHaveClass("is-routed");
    expect(screen.getByLabelText("Local board 1")).not.toHaveClass("is-routed");
  });

  it("animates an inner glyph instead of the grid cell", () => {
    const state = applyMove(createGame(), { board: 0, cell: 4, player: "X" });
    render(<GameBoard state={state} />);
    const cell = screen.getByRole("gridcell", { name: "Board 1, cell 5, X" });
    expect(cell).toHaveClass("is-last");
    expect(cell.querySelector(".mark-glyph")).toHaveTextContent("X");
  });
});
