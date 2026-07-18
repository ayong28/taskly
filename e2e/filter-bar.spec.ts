import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { BoardPage } from "./pages/BoardPage";

const BOARD_NAME = "Filter Bar Test Board";
const LIST_NAME = "Filter Bar Test List";
const LABELED_CARD_TITLE = "Card With Label";
const UNLABELED_CARD_TITLE = "Card Without Label";
const LABEL_NAME = "Filter QA";
const LABEL_COLOR_SWATCH = "teal";

test.describe("Filter bar", () => {
  test.describe.configure({ mode: "serial" });

  let boardId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const home = new HomePage(page);
    boardId = await home.createBoard(BOARD_NAME);

    const board = new BoardPage(page);
    await board.addList(LIST_NAME);
    const list = board.list(LIST_NAME);

    await list.addCard(LABELED_CARD_TITLE);
    await list.addCard(UNLABELED_CARD_TITLE);

    const modal = await list.openCard(LABELED_CARD_TITLE);
    const labelPicker = await modal.openLabels();
    await labelPicker.createLabel(LABEL_NAME, LABEL_COLOR_SWATCH);
    await expect(modal.assignedLabelPill(LABEL_NAME)).toBeVisible();
    await modal.close();

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    const board = new BoardPage(page);
    await board.goto(boardId);

    // Labels are global and outlive the board, so delete the one this spec
    // created before tearing down the board — otherwise it leaks into other
    // specs that assume a specific set of labels exist.
    const list = board.list(LIST_NAME);
    const modal = await list.openCard(LABELED_CARD_TITLE);
    const labelPicker = await modal.openLabels();
    await labelPicker.deleteLabel();
    await modal.close();

    await board.deleteBoardViaUI(boardId);
    await page.close();
  });

  test("filtering by label hides non-matching cards, clearing restores them", async ({
    page,
  }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);

    const list = board.list(LIST_NAME);
    await expect(list.card(LABELED_CARD_TITLE)).toBeVisible();
    await expect(list.card(UNLABELED_CARD_TITLE)).toBeVisible();

    await board.filterBar.filterByLabel(LABEL_NAME);

    await expect(list.card(LABELED_CARD_TITLE)).toBeVisible();
    await expect(list.card(UNLABELED_CARD_TITLE)).not.toBeVisible();

    await board.filterBar.clearFilters();

    await expect(list.card(LABELED_CARD_TITLE)).toBeVisible();
    await expect(list.card(UNLABELED_CARD_TITLE)).toBeVisible();
  });
});
