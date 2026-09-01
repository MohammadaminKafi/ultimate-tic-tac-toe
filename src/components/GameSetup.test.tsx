import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GameSetup } from "./GameSetup";

describe("GameSetup", () => {
  it("creates a local two-player configuration", async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<GameSetup onStart={onStart} />);

    await user.click(screen.getByRole("button", { name: /Local duel/ }));
    await user.click(screen.getByRole("button", { name: /Enter the arena/ }));

    expect(onStart).toHaveBeenCalledWith({
      mode: "local",
      players: { X: "human", O: "human" },
      depths: {},
      speedMs: 600,
    });
  });

  it("maps presets to depths 2, 4, and 6", async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<GameSetup onStart={onStart} />);
    await user.click(screen.getByRole("button", { name: "easy" }));
    await user.click(screen.getByRole("button", { name: /Enter the arena/ }));
    expect(onStart.mock.calls.at(-1)?.[0].depths.O).toBe(2);

    rerender(<GameSetup key="medium" onStart={onStart} />);
    await user.click(screen.getByRole("button", { name: /Enter the arena/ }));
    expect(onStart.mock.calls.at(-1)?.[0].depths.O).toBe(4);

    rerender(<GameSetup key="hard" onStart={onStart} />);
    await user.click(screen.getByRole("button", { name: "hard" }));
    await user.click(screen.getByRole("button", { name: /Enter the arena/ }));
    expect(onStart.mock.calls.at(-1)?.[0].depths.O).toBe(6);
  });

  it("warns when an advanced exact search reaches depth seven", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStart={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "advanced" }));
    const slider = screen.getByRole("slider", { name: "O exact search depth" });
    act(() => slider.focus());
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("Exact deep search")).toBeVisible();
    await user.keyboard("{End}");
    expect(screen.getAllByText("Depth 10")).toHaveLength(2);
  });
});
