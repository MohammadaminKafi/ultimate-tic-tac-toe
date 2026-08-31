import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GameSetup } from "./GameSetup";

describe("GameSetup", () => {
  it("creates a local two-player configuration", async () => {
    const onStart = vi.fn();
    render(<GameSetup onStart={onStart} />);

    await userEvent.click(screen.getByRole("button", { name: /Local duel/ }));
    await userEvent.click(screen.getByRole("button", { name: /Enter the arena/ }));

    expect(onStart).toHaveBeenCalledWith({
      mode: "local",
      players: { X: "human", O: "human" },
      depths: {},
      speedMs: 600,
    });
  });

  it("warns when an advanced search uses depth five or six", async () => {
    render(<GameSetup onStart={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "advanced" }));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "6" } });
    expect(screen.getByText("Deep search")).toBeVisible();
  });
});
