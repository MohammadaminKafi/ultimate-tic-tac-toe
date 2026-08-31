import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("defaults dark and persists the light theme", async () => {
    localStorage.clear();
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /Switch to light theme/ }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("uttt-theme")).toBe("light");
  });
});
