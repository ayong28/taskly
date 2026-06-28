import { test, expect } from "@playwright/test";

test.describe("App layout — sidebar + main area", () => {
  test("renders a sidebar and main content area", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("navigation", { name: "Boards" })).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("sidebar and main area are displayed side by side", async ({ page }) => {
    await page.goto("/");

    const sidebar = page.getByRole("navigation", { name: "Boards" });
    const main = page.getByRole("main");

    const sidebarBox = await sidebar.boundingBox();
    const mainBox = await main.boundingBox();

    expect(sidebarBox).not.toBeNull();
    expect(mainBox).not.toBeNull();

    // Main area is to the right of the sidebar
    expect(mainBox!.x).toBeGreaterThan(sidebarBox!.x);
    // Both occupy the same vertical space (side by side, not stacked)
    expect(Math.abs(sidebarBox!.y - mainBox!.y)).toBeLessThan(10);
  });

  test("shows empty state when no boards exist", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("main")).toContainText("There are no boards in the database.");
  });

  test("sidebar contains a button to create a new board", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("navigation", { name: "Boards" }).getByRole("button", { name: /new board|add board|create board/i })
    ).toBeVisible();
  });

  test("sidebar is still visible after navigating to a board", async ({ page }) => {
    await page.goto("/board/1");

    await expect(page.getByRole("navigation", { name: "Boards" })).toBeVisible();
  });
});
