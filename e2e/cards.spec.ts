import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { BoardPage } from "./pages/BoardPage";

const BOARD_NAME = "Card CRUD Test Board";
const LIST_NAME = "Card Test List";
const CARD_TITLE = "My Test Card";
const CARD_TITLE_UPDATED = "Updated Test Card";

test.describe("Card CRUD", () => {
  test.describe.configure({ mode: "serial" });

  let boardId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const home = new HomePage(page);
    boardId = await home.createBoard(BOARD_NAME);

    const board = new BoardPage(page);
    await board.addList(LIST_NAME);

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    // Hard-deleting the board cascades to its lists and cards (including any
    // that got archived and moved into a separate Archived list), so no
    // per-card or per-list cleanup is needed first.
    await new BoardPage(page).deleteBoardViaUI(boardId);
    await page.close();
  });

  test("can create a card in a list", async ({ page }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);

    await board.list(LIST_NAME).addCard(CARD_TITLE);

    await expect(page.getByText(CARD_TITLE)).toBeVisible();
  });

  test("can edit a card title", async ({ page }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);

    const modal = await board.list(LIST_NAME).openCard(CARD_TITLE);
    await modal.fillTitle(CARD_TITLE_UPDATED);
    await modal.save();

    await expect(page.getByText(CARD_TITLE_UPDATED)).toBeVisible();
  });

  test("can archive a card", async ({ page }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);

    const list = board.list(LIST_NAME);
    const modal = await list.openCard(CARD_TITLE_UPDATED);
    await modal.archiveButton.click();

    await expect(list.card(CARD_TITLE_UPDATED)).not.toBeVisible();
  });
});
