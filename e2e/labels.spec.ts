import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { BoardPage } from "./pages/BoardPage";

const BOARD_NAME = "Labels Test Board";
const SECOND_BOARD_NAME = "Labels Test Board 2";
const LIST_NAME = "Labels Test List";
const CARD_TITLE = "Card With Labels";
const OTHER_CARD_TITLE = "Card Without Labels";

const LABEL_NAME = "Urgent QA";
const LABEL_COLOR_SWATCH = "orange";
const RENAMED_LABEL_NAME = "Urgent QA Renamed";

test.describe("Labels", () => {
  test.describe.configure({ mode: "serial" });

  let boardId: string;
  let secondBoardId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const home = new HomePage(page);

    boardId = await home.createBoard(BOARD_NAME);

    const board = new BoardPage(page);
    await board.addList(LIST_NAME);
    const list = board.list(LIST_NAME);
    await list.addCard(CARD_TITLE);
    await list.addCard(OTHER_CARD_TITLE);

    secondBoardId = await home.createBoard(SECOND_BOARD_NAME);

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    const board = new BoardPage(page);

    for (const id of [boardId, secondBoardId]) {
      await board.deleteBoardViaUI(id);
    }

    await page.close();
  });

  test("can create a label from a card and assign it, showing a swatch on the card tile", async ({
    page,
  }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);

    const list = board.list(LIST_NAME);
    const modal = await list.openCard(CARD_TITLE);

    const labelPicker = await modal.openLabels();
    // Use real per-key typing (not .fill(), which sets the value directly and
    // bypasses keydown events) — base-ui's Menu intercepts character keydowns
    // for typeahead navigation, which previously swallowed keystrokes meant
    // for this input. LabelPicker.createLabel uses pressSequentially for this.
    await labelPicker.createLabel(LABEL_NAME, LABEL_COLOR_SWATCH);

    // Newly created label is assigned to the card automatically and shown as a pill
    const labelPill = modal.assignedLabelPill(LABEL_NAME);
    await expect(labelPill).toBeVisible();
    await expect(labelPill).not.toHaveText("");

    await modal.close();

    // A colored dot swatch should now show on the card tile
    await expect(list.cardLabelSwatch(CARD_TITLE, LABEL_NAME)).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(list.cardLabelSwatch(CARD_TITLE, LABEL_NAME)).toBeVisible();
  });

  test("label is global — assignable to a card on a different board", async ({ page }) => {
    const board = new BoardPage(page);
    await board.goto(secondBoardId);
    await board.addList(LIST_NAME);

    const list = board.list(LIST_NAME);
    await list.addCard(OTHER_CARD_TITLE);

    const modal = await list.openCard(OTHER_CARD_TITLE);
    const labelPicker = await modal.openLabels();

    // The label created on the first board should already be listed here
    await expect(labelPicker.labelOption(LABEL_NAME)).toBeVisible();
    await labelPicker.toggleLabel(LABEL_NAME);
    await modal.close();

    await expect(list.cardLabelSwatch(OTHER_CARD_TITLE, LABEL_NAME)).toBeVisible();
  });

  test("removing a label from a card removes its swatch", async ({ page }) => {
    const board = new BoardPage(page);
    await board.goto(boardId);

    const list = board.list(LIST_NAME);
    const modal = await list.openCard(CARD_TITLE);

    const labelPicker = await modal.openLabels();
    // Scope to role=button: the picker row is a button, unlike the read-only
    // assigned-label pill already shown in the dialog body for this card.
    await labelPicker.toggleLabel(LABEL_NAME); // toggle off
    await modal.close();

    await expect(list.cardLabelSwatch(CARD_TITLE, LABEL_NAME)).not.toBeVisible();

    await page.reload();
    await expect(list.cardLabelSwatch(CARD_TITLE, LABEL_NAME)).not.toBeVisible();
  });

  test("renaming a label updates it everywhere it's assigned", async ({ page }) => {
    const board = new BoardPage(page);
    await board.goto(secondBoardId);

    // Re-assign to the card on board 2 so we can verify the rename propagates there
    const list = board.list(LIST_NAME);
    const modal = await list.openCard(OTHER_CARD_TITLE);
    const labelPicker = await modal.openLabels();
    await expect(labelPicker.labelOption(LABEL_NAME)).toBeVisible();

    await labelPicker.renameLabel(RENAMED_LABEL_NAME);
    await modal.close();

    await expect(list.cardLabelSwatch(OTHER_CARD_TITLE, RENAMED_LABEL_NAME)).toBeVisible();
  });

  test("deleting a label removes it from the picker and from every card", async ({ page }) => {
    const board = new BoardPage(page);
    await board.goto(secondBoardId);

    const list = board.list(LIST_NAME);
    const modal = await list.openCard(OTHER_CARD_TITLE);
    const labelPicker = await modal.openLabels();
    await expect(labelPicker.labelOption(RENAMED_LABEL_NAME)).toBeVisible();

    await labelPicker.deleteLabel();

    await expect(modal.assignedLabelPill(RENAMED_LABEL_NAME)).not.toBeVisible();
    await expect(labelPicker.labelOption(RENAMED_LABEL_NAME)).not.toBeVisible();
    await modal.close();

    await expect(list.cardLabelSwatch(OTHER_CARD_TITLE, RENAMED_LABEL_NAME)).not.toBeVisible();
  });
});
