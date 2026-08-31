import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReplaysPage } from "./ReplaysPage";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});

afterEach(() => vi.unstubAllGlobals());

it("shows a clear alert for malformed replay imports", async () => {
  render(<ReplaysPage />);
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  await userEvent.upload(input!, new File(["not json"], "broken.json", { type: "application/json" }));
  expect(await screen.findByText("Import failed")).toBeVisible();
});
