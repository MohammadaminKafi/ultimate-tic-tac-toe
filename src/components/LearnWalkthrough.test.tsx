import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { LearnWalkthrough } from "./LearnWalkthrough";

it("walks through all six engine-backed lessons", async () => {
  render(<MemoryRouter><LearnWalkthrough /></MemoryRouter>);

  expect(screen.getByRole("button", { name: /Next lesson/ })).toBeDisabled();
  await userEvent.click(screen.getByRole("gridcell", { name: /Board 1, cell 5, playable/ }));
  expect(screen.getByText(/O must answer in local board 5/)).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: /Retry/ }));
  expect(screen.getByRole("button", { name: /Next lesson/ })).toBeDisabled();
  await userEvent.click(screen.getByRole("gridcell", { name: /Board 1, cell 5, playable/ }));
  await userEvent.click(screen.getByRole("button", { name: /Next lesson/ }));
  await userEvent.click(screen.getByRole("button", { name: /Back/ }));
  expect(screen.getByRole("heading", { name: "Make the opening move" })).toBeVisible();
  await userEvent.click(screen.getByRole("gridcell", { name: /Board 1, cell 5, playable/ }));
  await userEvent.click(screen.getByRole("button", { name: /Next lesson/ }));

  await userEvent.click(screen.getByRole("gridcell", { name: /Board 1, cell 1, unavailable/ }));
  expect(screen.getByText(/board is unavailable/i)).toBeVisible();
  await userEvent.click(screen.getByRole("gridcell", { name: /Board 5, cell 1, playable/ }));
  await userEvent.click(screen.getByRole("button", { name: /Next lesson/ }));

  await userEvent.click(screen.getByRole("gridcell", { name: /Board 1, cell 3, playable/ }));
  expect(screen.getByText(/claims the entire local board/)).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: /Next lesson/ }));

  await userEvent.click(screen.getByRole("gridcell", { name: /Board 1, cell 5, playable/ }));
  expect(screen.getByText(/any unfinished local board/)).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: /Next lesson/ }));

  await userEvent.click(screen.getByRole("gridcell", { name: /Board 3, cell 3, playable/ }));
  expect(screen.getByText(/completes the global row/)).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: /Next lesson/ }));

  await userEvent.click(screen.getByRole("gridcell", { name: /Board 3, cell 5, playable/ }));
  expect(screen.getByText(/evaluation is lower/)).toBeVisible();
  await userEvent.click(screen.getByRole("gridcell", { name: /Board 3, cell 3, playable/ }));
  expect(screen.getByText(/alpha reaches that bound/)).toBeVisible();
  expect(screen.getByRole("button", { name: /Start a match/ })).toBeEnabled();
});
