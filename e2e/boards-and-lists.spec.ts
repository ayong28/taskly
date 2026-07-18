import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { BoardPage } from "./pages/BoardPage";

test.describe("Create / rename / delete boards and lists", () => {
  // ─── Boards ────────────────────────────────────────────────────────────────

  test.describe("Board creation", () => {
    test("clicking New Board opens a creation dialog", async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      const dialog = await home.sidebar.openNewBoardDialog();

      await expect(dialog.dialog).toBeVisible();
      await expect(dialog.dialog).toContainText(/new board/i);
    });

    test("creating a board adds it to the sidebar", async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      const dialog = await home.sidebar.openNewBoardDialog();
      await dialog.fillName("My Test Board");
      await dialog.createButton.click();

      await expect(home.sidebar.boardLink("My Test Board")).toBeVisible();
    });

    test("creating a board navigates to it", async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      const dialog = await home.sidebar.openNewBoardDialog();
      await dialog.fillName("Navigation Test Board");
      await dialog.createButton.click();

      await expect(page).toHaveURL(/\/board\/\d+/);
      const board = new BoardPage(page);
      await expect(board.main).toContainText("Navigation Test Board");
    });

    test("new board is seeded with default lists: To Do, In Progress, Done", async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      const dialog = await home.sidebar.openNewBoardDialog();
      await dialog.fillName("Seeded Lists Board");
      await dialog.createButton.click();

      const board = new BoardPage(page);
      await expect(board.main).toContainText("To Do");
      await expect(board.main).toContainText("In Progress");
      await expect(board.main).toContainText("Done");
    });

    test("cancelling the dialog does not create a board", async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      const sidebarBefore = await home.sidebar.nav.innerText();

      const dialog = await home.sidebar.openNewBoardDialog();
      await dialog.fillName("Cancelled Board");
      await dialog.cancel();

      await expect(dialog.dialog).not.toBeVisible();
      await expect(home.sidebar.boardLink("Cancelled Board")).not.toBeVisible();
      void sidebarBefore;
    });
  });

  test.describe("Board renaming", () => {
    test.beforeEach(async ({ page }) => {
      const home = new HomePage(page);
      await home.createBoard("Board To Rename");
    });

    test("board title can be edited inline on the board page", async ({ page }) => {
      const board = new BoardPage(page);
      await board.renameBoardTitle("Board To Rename", "Renamed Board");

      await expect(board.heading("Renamed Board")).toBeVisible();
    });

    test("renamed board updates in the sidebar", async ({ page }) => {
      const board = new BoardPage(page);
      await board.renameBoardTitle("Board To Rename", "Sidebar Updated Board");

      await expect(board.sidebar.boardLink("Sidebar Updated Board")).toBeVisible();
    });
  });

  test.describe("Board archiving and deletion", () => {
    let boardId: string;

    test.beforeEach(async ({ page }) => {
      const home = new HomePage(page);
      boardId = await home.createBoard("Board To Delete");
    });

    // An active board's options menu only offers "Archive Board" — hard delete
    // is only reachable once a board is already archived (see below).
    test("archiving a board removes it from the sidebar and redirects home", async ({
      page,
    }) => {
      const board = new BoardPage(page);
      await board.boardOptionsMenu.archiveBoard(boardId);

      await expect(page).not.toHaveURL(/\/board\/\d+/);
      await expect(board.sidebar.boardLink("Board To Delete")).not.toBeVisible();
    });

    test("an archived board's options menu offers only Delete Board, which removes it permanently", async ({
      page,
    }) => {
      const board = new BoardPage(page);
      await board.boardOptionsMenu.archiveBoard(boardId);

      await board.goto(boardId);
      await expect(board.heading("Board To Delete")).toBeVisible();
      await board.boardOptionsMenu.open();
      await expect(board.boardOptionsMenu.archiveBoardItem).not.toBeVisible();
      await board.boardOptionsMenu.deleteBoard();

      await expect(page).not.toHaveURL(/\/board\/\d+/);
      await board.goto(boardId);
      await expect(board.notFoundMessage()).toBeVisible();
    });

    test("an archived board can be permanently deleted directly from the sidebar's Archived section", async ({
      page,
    }) => {
      const board = new BoardPage(page);
      await board.boardOptionsMenu.archiveBoard(boardId);

      // Other tests in this describe block may have left same-titled boards
      // archived without deleting them, so Sidebar.archivedBoardRow scopes to
      // the most recently archived (last) matching row, not a bare text match.
      await board.sidebar.deleteArchivedBoard("Board To Delete");

      // Scope the post-condition to this test's own board (rather than a
      // possibly-ambiguous sidebar text match, since other tests in this
      // describe block may leave same-titled archived boards behind).
      await board.goto(boardId);
      await expect(board.notFoundMessage()).toBeVisible();
    });
  });

  // ─── Lists ─────────────────────────────────────────────────────────────────

  test.describe("List creation", () => {
    test.beforeEach(async ({ page }) => {
      const home = new HomePage(page);
      await home.createBoard("List Test Board");
    });

    test("clicking Add List shows an input to name the new list", async ({ page }) => {
      const board = new BoardPage(page);
      await board.addListButton.click();

      await expect(board.listNameInput).toBeVisible();
    });

    test("adding a list appends it to the board", async ({ page }) => {
      const board = new BoardPage(page);
      await board.addList("Backlog");

      await expect(board.main).toContainText("Backlog");
    });
  });

  test.describe("List renaming", () => {
    test.beforeEach(async ({ page }) => {
      const home = new HomePage(page);
      await home.createBoard("List Rename Board");
    });

    test("clicking a list title makes it editable", async ({ page }) => {
      const board = new BoardPage(page);
      await board.startEditingListTitle("To Do");

      await expect(board.listNameTextbox()).toBeVisible();
    });

    test("editing a list title and pressing Enter saves it", async ({ page }) => {
      const board = new BoardPage(page);
      await board.renameList("To Do", "Ready");

      await expect(board.main).toContainText("Ready");
      await expect(board.main).not.toContainText("To Do");
    });
  });

  test.describe("List deletion", () => {
    test.beforeEach(async ({ page }) => {
      const home = new HomePage(page);
      await home.createBoard("List Delete Board");
    });

    test("deleting a list removes it from the board", async ({ page }) => {
      const board = new BoardPage(page);
      await board.list("To Do").listOptionsButton.click();
      await page.getByRole("menuitem", { name: /delete list/i }).click();

      await expect(board.main).not.toContainText("To Do");
    });
  });
});
