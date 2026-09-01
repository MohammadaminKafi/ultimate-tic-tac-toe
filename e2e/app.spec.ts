import { expect, test } from "@playwright/test";

test("starts a local game and routes the next move", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Local duel/ }).click();
  await page.getByRole("button", { name: /Enter the arena/ }).click();
  await expect(page.getByText("X to move")).toBeVisible();
  const firstCell = page.getByRole("gridcell", { name: /Board 1, cell 5, playable/ });
  const before = await firstCell.boundingBox();
  expect(Math.abs((before?.width ?? 0) - (before?.height ?? 0))).toBeLessThan(1);
  await firstCell.click();
  await expect(page.getByText("O to move")).toBeVisible();
  await expect(page.getByLabel("Local board 5")).toHaveClass(/is-routed/);
  const after = await page.getByRole("gridcell", { name: "Board 1, cell 5, X" }).boundingBox();
  expect(Math.abs((after?.width ?? 0) - (after?.height ?? 0))).toBeLessThan(1);
  expect(Math.abs((before?.width ?? 0) - (after?.width ?? 0))).toBeLessThan(1);
});

test("runs human versus AI without blocking the page", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Enter the arena/ }).click();
  await page.getByRole("gridcell", { name: /Board 1, cell 5, playable/ }).click();
  await expect(page.getByText(/O is searching|X to move/)).toBeVisible();
  await expect(page.getByText("X to move")).toBeVisible({ timeout: 15_000 });
});

test("cancels an exact deep search, adjusts depth, and retries", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "advanced" }).click();
  const setupDepth = page.getByRole("slider", { name: "O exact search depth" });
  await setupDepth.focus();
  await page.keyboard.press("End");
  await page.getByRole("button", { name: /Enter the arena/ }).click();
  await page.getByRole("gridcell", { name: /Board 1, cell 5, playable/ }).click();
  await page.getByRole("button", { name: "Cancel search" }).click();
  await expect(page.getByText("O search cancelled")).toBeVisible();
  const liveDepth = page.getByRole("slider", { name: "O live search depth" });
  await liveDepth.focus();
  await page.keyboard.press("Home");
  await expect(page.getByText("Exact depth 1")).toBeVisible();
  await page.getByRole("button", { name: "Retry search" }).click();
  await expect(page.getByText("X to move")).toBeVisible({ timeout: 15_000 });
});

test("opens replay and direct hash routes", async ({ page }) => {
  await page.goto("./#/replays", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Replay the search." })).toBeVisible();
  await expect(page.getByText("6 matches")).toBeVisible();
  await page.goto("./#/learn", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/#\/learn$/);
  await expect(page.getByRole("heading", { name: "One move. Two consequences." })).toBeVisible();
});

test("switches theme and exposes responsive navigation", async ({ page, isMobile }) => {
  await page.goto("./#/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  if (isMobile) {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("link", { name: "Learn" })).toBeVisible();
  } else {
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  }
});

test("pauses and single-steps an AI arena", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /AI arena/ }).click();
  await page.getByRole("button", { name: /Enter the arena/ }).click();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("combobox", { name: "AI playback speed" }).selectOption("200");
  const moveCount = await page.locator(".game-cell.mark-x, .game-cell.mark-o").count();
  await page.getByRole("button", { name: "Step" }).click();
  await expect(page.locator(".game-cell.mark-x, .game-cell.mark-o")).toHaveCount(moveCount + 1, { timeout: 15_000 });
  await page.getByRole("button", { name: "Hide analysis" }).click();
  await expect(page.getByRole("button", { name: "Show analysis" })).toBeVisible();
});

test("keeps stacked AI profiles and sliders inside setup", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /AI arena/ }).click();
  const profiles = page.locator(".strength-control");
  await expect(profiles).toHaveCount(2);
  const first = await profiles.nth(0).boundingBox();
  const second = await profiles.nth(1).boundingBox();
  expect((first?.y ?? 0) + (first?.height ?? 0)).toBeLessThanOrEqual((second?.y ?? 0) + 1);
  for (const advanced of await page.getByRole("button", { name: "advanced" }).all()) await advanced.click();
  await expect(page.getByRole("slider", { name: "X exact search depth" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "O exact search depth" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Move pace" })).toBeVisible();
  const card = await page.locator(".setup-card").boundingBox();
  for (const slider of await page.getByRole("slider").all()) {
    const box = await slider.boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual((card?.x ?? 0) + (card?.width ?? 0) + 1);
  }
});

test("Opera smoke: depth and replay sliders support keyboard input", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /AI arena/ }).click();
  await page.getByRole("button", { name: "advanced" }).first().click();
  const depth = page.getByRole("slider", { name: "X exact search depth" });
  await depth.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Exact deep search")).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByText("Depth 10").first()).toBeVisible();

  await page.goto("./#/replays", { waitUntil: "networkidle" });
  const timeline = page.getByRole("slider", { name: "Replay position" });
  await timeline.focus();
  await page.keyboard.press("End");
  await expect(page.getByText(/Move \d+ \/ \d+/)).toBeVisible();
  await page.keyboard.press("Home");
  await expect(page.getByText("Move 0", { exact: true })).toBeVisible();
});

test("exports and re-imports a validated replay", async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), "The desktop run covers browser file exchange.");
  await page.goto("./#/replays", { waitUntil: "networkidle" });
  await expect(page.getByText("6 matches")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  await page.locator('input[type="file"]').setInputFiles(path as string);
  await expect(page.getByText("Replay ready")).toBeVisible();
  await expect(page.getByText("7 matches")).toBeVisible();
});
