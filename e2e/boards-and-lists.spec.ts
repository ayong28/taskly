import { test, expect } from "@playwright/test";

test.describe("Create / rename / delete boards and lists", () => {
  // ─── Boards ────────────────────────────────────────────────────────────────

  test.describe("Board creation", () => {
    test("clicking New Board opens a creation dialog", async ({ page }) => {
      await page.goto("/");

      await page
        .getByRole("navigation", { name: "Boards" })
        .getByRole("button", { name: /new board/i })
        .click();

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("dialog")).toContainText(/new board/i);
    });

    test("creating a board adds it to the sidebar", async ({ page }) => {
      await page.goto("/");

      await page
        .getByRole("navigation", { name: "Boards" })
        .getByRole("button", { name: /new board/i })
        .click();

      await page.getByRole("dialog").getByLabel(/name/i).fill("My Test Board");
      await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();

      await expect(
        page.getByRole("navigation", { name: "Boards" }).getByText("My Test Board")
      ).toBeVisible();
    });

    test("creating a board navigates to it", async ({ page }) => {
      await page.goto("/");

      await page
        .getByRole("navigation", { name: "Boards" })
        .getByRole("button", { name: /new board/i })
        .click();

      await page.getByRole("dialog").getByLabel(/name/i).fill("Navigation Test Board");
      await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();

      await expect(page).toHaveURL(/\/board\/\d+/);
      await expect(page.getByRole("main")).toContainText("Navigation Test Board");
    });

    test("new board is seeded with default lists: To Do, In Progress, Done", async ({ page }) => {
      await page.goto("/");

      await page
        .getByRole("navigation", { name: "Boards" })
        .getByRole("button", { name: /new board/i })
        .click();

      await page.getByRole("dialog").getByLabel(/name/i).fill("Seeded Lists Board");
      await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();

      await expect(page.getByRole("main")).toContainText("To Do");
      await expect(page.getByRole("main")).toContainText("In Progress");
      await expect(page.getByRole("main")).toContainText("Done");
    });

    test("cancelling the dialog does not create a board", async ({ page }) => {
      await page.goto("/");

      const sidebarBefore = await page
        .getByRole("navigation", { name: "Boards" })
        .innerText();

      await page
        .getByRole("navigation", { name: "Boards" })
        .getByRole("button", { name: /new board/i })
        .click();

      await page.getByRole("dialog").getByLabel(/name/i).fill("Cancelled Board");
      await page.getByRole("dialog").getByRole("button", { name: /cancel/i }).click();

      await expect(page.getByRole("dialog")).not.toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Boards" }).getByText("Cancelled Board")
      ).not.toBeVisible();
    });
  });

  test.describe("Board renaming", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page
        .getByRole("navigation", { name: "Boards" })
        .getByRole("button", { name: /new board/i })
        .click();
      await page.getByRole("dialog").getByLabel(/name/i).fill("Board To Rename");
      await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
      await page.waitForURL(/\/board\/\d+/);
    });

    test("board title can be edited inline on the board page", async ({ page }) => {
      await page.getByRole("heading", { name: "Board To Rename" }).click();
      await page.getByRole("textbox", { name: /board name/i }).fill("Renamed Board");
      await page.keyboard.press("Enter");

      await expect(page.getByRole("heading", { name: "Renamed Board" })).toBeVisible();
    });

    test("renamed board updates in the sidebar", async ({ page }) => {
      await page.getByRole("heading", { name: "Board To Rename" }).click();
      await page.getByRole("textbox", { name: /board name/i }).fill("Sidebar Updated Board");
      await page.keyboard.press("Enter");

      await expect(
        page.getByRole("navigation", { name: "Boards" }).getByText("Sidebar Updated Board")
      ).toBeVisible();
    });
  });

  test.describe("Board deletion", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page
        .getByRole("navigation", { name: "Boards" })
        .getByRole("button", { name: /new board/i })
        .click();
      await page.getByRole("dialog").getByLabel(/name/i).fill("Board To Delete");
      await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
      await page.waitForURL(/\/board\/\d+/);
    });

    test("deleting a board removes it from the sidebar", async ({ page }) => {
      await page.getByRole("button", { name: /board options|board menu/i }).click();
      await page.getByRole("menuitem", { name: /delete board/i }).click();
      await page.getByRole("button", { name: /confirm|delete/i }).click();

      await expect(
        page.getByRole("navigation", { name: "Boards" }).getByText("Board To Delete")
      ).not.toBeVisible();
    });

    test("deleting a board redirects to home", async ({ page }) => {
      await page.getByRole("button", { name: /board options|board menu/i }).click();
      await page.getByRole("menuitem", { name: /delete board/i }).click();
      await page.getByRole("button", { name: /confirm|delete/i }).click();

      await expect(page).not.toHaveURL(/\/board\/\d+/);
    });
  });

  // ─── Lists ─────────────────────────────────────────────────────────────────

  test.describe("List creation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page
        .getByRole("navigation", { name: "Boards" })
        .getByRole("button", { name: /new board/i })
        .click();
      await page.getByRole("dialog").getByLabel(/name/i).fill("List Test Board");
      await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
      await page.waitForURL(/\/board\/\d+/);
    });

    test("clicking Add List shows an input to name the new list", async ({ page }) => {
      await page.getByRole("button", { name: /add list/i }).click();

      await expect(page.getByPlaceholder(/list name|enter a title/i)).toBeVisible();
    });

    test("adding a list appends it to the board", async ({ page }) => {
      await page.getByRole("button", { name: /add list/i }).click();
      await page.getByPlaceholder(/list name|enter a title/i).fill("Backlog");
      await page.keyboard.press("Enter");

      await expect(page.getByRole("main")).toContainText("Backlog");
    });
  });

  test.describe("List renaming", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page
        .getByRole("navigation", { name: "Boards" })
        .getByRole("button", { name: /new board/i })
        .click();
      await page.getByRole("dialog").getByLabel(/name/i).fill("List Rename Board");
      await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
      await page.waitForURL(/\/board\/\d+/);
    });

    test("clicking a list title makes it editable", async ({ page }) => {
      await page.getByText("To Do").click();

      await expect(page.getByRole("textbox", { name: /list name/i })).toBeVisible();
    });

    test("editing a list title and pressing Enter saves it", async ({ page }) => {
      await page.getByText("To Do").click();
      await page.getByRole("textbox", { name: /list name/i }).fill("Ready");
      await page.keyboard.press("Enter");

      await expect(page.getByRole("main")).toContainText("Ready");
      await expect(page.getByRole("main")).not.toContainText("To Do");
    });
  });

  test.describe("List deletion", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page
        .getByRole("navigation", { name: "Boards" })
        .getByRole("button", { name: /new board/i })
        .click();
      await page.getByRole("dialog").getByLabel(/name/i).fill("List Delete Board");
      await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
      await page.waitForURL(/\/board\/\d+/);
    });

    test("deleting a list removes it from the board", async ({ page }) => {
      await page.getByRole("button", { name: /list options|list menu/i }).first().click();
      await page.getByRole("menuitem", { name: /delete list/i }).click();

      await expect(page.getByRole("main")).not.toContainText("To Do");
    });
  });
});
