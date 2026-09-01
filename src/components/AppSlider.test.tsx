import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { AppSlider } from "./AppSlider";

it("supports keyboard changes through a custom HeroUI track", async () => {
  function Controlled() {
    const [value, setValue] = useState(4);
    return <AppSlider label="Exact depth" value={value} min={1} max={10} output={`Depth ${value}`} onChange={setValue} />;
  }

  render(<Controlled />);
  const user = userEvent.setup();
  const slider = screen.getByRole("slider", { name: "Exact depth" });
  act(() => slider.focus());
  await user.keyboard("{ArrowRight}{End}");
  expect(screen.getByText("Depth 10")).toBeVisible();
  expect(document.querySelector(".slider__track")).not.toBeNull();
});
