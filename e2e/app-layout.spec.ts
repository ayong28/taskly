import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { BoardPage } from "./pages/BoardPage";

test.describe("App layout — sidebar + main area", () => {
  test("renders a sidebar and main content area", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.sidebar.nav).toBeVisible();
    await expect(home.main).toBeVisible();
  });

  test("sidebar and main area are displayed side by side", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    const sidebarBox = await home.sidebar.nav.boundingBox();
    const mainBox = await home.main.boundingBox();

    expect(sidebarBox).not.toBeNull();
    expect(mainBox).not.toBeNull();

    // Main area is to the right of the sidebar
    expect(mainBox!.x).toBeGreaterThan(sidebarBox!.x);
    // Both occupy the same vertical space (side by side, not stacked)
    expect(Math.abs(sidebarBox!.y - mainBox!.y)).toBeLessThan(10);
  });

  test("shows empty state when no boards exist", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.main).toContainText("There are no boards in the database.");
  });

  test("sidebar contains a button to create a new board", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.sidebar.newBoardButton).toBeVisible();
  });

  test("sidebar is still visible after navigating to a board", async ({ page }) => {
    const board = new BoardPage(page);
    await board.goto("1");

    await expect(board.sidebar.nav).toBeVisible();
  });
});
