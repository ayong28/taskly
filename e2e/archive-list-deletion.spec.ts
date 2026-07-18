import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { BoardPage } from "./pages/BoardPage";

const BOARD_NAME = "Archive List Deletion Test Board";
const LIST_1 = "List1";
const CARD_1 = "card1";
const CARD_2 = "card2";

test.describe("Deleting a list archives its cards, then restore fans them into Restored", () => {
  let boardId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const home = new HomePage(page);
    boardId = await home.createBoard(BOARD_NAME);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await new BoardPage(page).deleteBoardViaUI(boardId);
    await page.close();
  });

  test("delete a list, its cards land in Archived, then restoring each fans them into Restored", async ({
    page,
  }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);

    // 1. Create a new list - "List1"
    await board.addList(LIST_1);

    // 2. Create 2 cards in the list, "card1", "card2"
    const list1 = board.list(LIST_1);
    for (const title of [CARD_1, CARD_2]) {
      await list1.addCard(title);
    }

    // 3. Delete "List1"
    await list1.deleteList();
    await expect(list1.root).toHaveCount(0);

    // 5. Assertion: "Archived" list is created and card1/card2 are in it
    const archivedList = board.list("Archived");
    await expect(archivedList.root).toBeVisible();
    await expect(archivedList.card(CARD_1)).toBeVisible();
    await expect(archivedList.card(CARD_2)).toBeVisible();

    // 6. Restore "card1"
    let modal = await archivedList.openCard(CARD_1);
    await modal.restore();

    // 7. Assertion: "Restored" list is created, card1 is in it
    const restoredList = board.list("Restored");
    await expect(restoredList.root).toBeVisible();
    await expect(restoredList.card(CARD_1)).toBeVisible();

    // 8. Restore "card2"
    modal = await archivedList.openCard(CARD_2);
    await expect(modal.dialog).toBeVisible();
    await modal.restore();

    // 9. Assertion: card2 is in the "Restored" list
    await expect(restoredList.card(CARD_2)).toBeVisible();

    // Only one Restored list should ever exist on this board
    await expect(board.list("Restored").root).toHaveCount(1);
  });
});
