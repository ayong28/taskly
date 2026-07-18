import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { BoardPage } from "./pages/BoardPage";

const BOARD_NAME = "Archive Test Board";
const LIST_A = "List A";
const LIST_B = "List B";
const LIST_C = "List C";
const CARD_1 = "Card One";
const CARD_2 = "Card Two";
const CARD_3 = "Card Three";
const CARD_4 = "Card Four";

test.describe("Archive", () => {
  test.describe.configure({ mode: "serial" });

  let boardId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const home = new HomePage(page);
    boardId = await home.createBoard(BOARD_NAME);

    const board = new BoardPage(page);
    await board.addList(LIST_A);
    await board.list(LIST_A).addCard(CARD_1);
    await board.list(LIST_A).addCard(CARD_2);

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await new BoardPage(page).deleteBoardViaUI(boardId);
    await page.close();
  });

  test("archiving a card creates the Archived list and moves the card into it", async ({
    page,
  }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);
    const listA = board.list(LIST_A);

    const modal = await listA.openCard(CARD_1);
    await modal.archive();

    await expect(listA.card(CARD_1)).not.toBeVisible();
    await expect(listA.card(CARD_2)).toBeVisible();

    const archivedList = board.list("Archived");
    await expect(archivedList.root).toBeVisible();
    await expect(archivedList.card(CARD_1)).toBeVisible();
  });

  test("the Archived list has no list-options menu", async ({ page }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);
    const archivedList = board.list("Archived");

    await expect(archivedList.listOptionsButton).not.toBeVisible();
  });

  test("restoring a card whose original list still exists returns it there, and the Archived list persists even when empty", async ({
    page,
  }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);
    const archivedList = board.list("Archived");

    const modal = await archivedList.openCard(CARD_1);
    await modal.restore();

    const listA = board.list(LIST_A);
    await expect(listA.card(CARD_1)).toBeVisible();

    // Archived list stays on the board even though it's now empty
    await expect(archivedList.root).toBeVisible();
    await expect(archivedList.card(CARD_1)).not.toBeVisible();
  });

  test("deleting a list archives all its cards into the Archived list", async ({ page }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);
    await board.addList(LIST_B);
    await board.list(LIST_B).addCard(CARD_3);

    await board.list(LIST_B).deleteList();

    await expect(board.list(LIST_B).root).toHaveCount(0);

    const archivedList = board.list("Archived");
    await expect(archivedList.card(CARD_3)).toBeVisible();
  });

  test("restoring a card whose original list was deleted moves it into a new Restored list", async ({
    page,
  }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);
    const archivedList = board.list("Archived");

    const modal = await archivedList.openCard(CARD_3);
    await modal.restore();

    const restoredList = board.list("Restored");
    await expect(restoredList.root).toBeVisible();
    await expect(restoredList.card(CARD_3)).toBeVisible();
    await expect(restoredList.listOptionsButton).not.toBeVisible();
  });

  test("a second card restored to a missing original list reuses the same Restored list", async ({
    page,
  }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);
    await board.addList(LIST_C);
    await board.list(LIST_C).addCard(CARD_4);

    await board.list(LIST_C).deleteList();

    const archivedList = board.list("Archived");
    const modal = await archivedList.openCard(CARD_4);
    await modal.restore();

    // Exactly one Restored list on the board, now containing both cards
    await expect(board.list("Restored").root).toHaveCount(1);
    const restoredList = board.list("Restored");
    await expect(restoredList.card(CARD_3)).toBeVisible();
    await expect(restoredList.card(CARD_4)).toBeVisible();
  });
});
