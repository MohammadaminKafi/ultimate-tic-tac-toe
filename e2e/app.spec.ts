import { expect, test } from "@playwright/test";

test("starts a local game and routes the next move", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Local duel/ }).click();
  await page.getByRole("button", { name: /Enter the arena/ }).click();
  await expect(page.getByText("X to move")).toBeVisible();
  await page.getByRole("gridcell", { name: /Board 1, cell 5, playable/ }).click();
  await expect(page.getByText("O to move")).toBeVisible();
  await expect(page.getByLabel("Local board 5")).toHaveClass(/is-routed/);
});

test("runs human versus AI without blocking the page", async ({ page }) => {
  await page.goto("./#/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Enter the arena/ }).click();
  await page.getByRole("gridcell", { name: /Board 1, cell 5, playable/ }).click();
  await expect(page.getByText(/O is searching|X to move/)).toBeVisible();
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
