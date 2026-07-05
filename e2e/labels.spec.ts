import { test, expect } from "@playwright/test";

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

  async function createBoard(page: import("@playwright/test").Page, name: string) {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Boards" })
      .getByRole("button", { name: /new board/i })
      .click();
    await page.getByRole("dialog").getByLabel(/name/i).fill(name);
    const urlBeforeCreate = page.url();
    await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await page.waitForURL((url) => url.href !== urlBeforeCreate);
    return page.url().match(/\/board\/(\d+)/)?.[1] ?? "";
  }

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    boardId = await createBoard(page, BOARD_NAME);

    await page.getByRole("button", { name: /add list/i }).click();
    await page.getByPlaceholder(/list name/i).fill(LIST_NAME);
    await page.keyboard.press("Enter");
    await expect(page.getByText(LIST_NAME)).toBeVisible();

    const listCol = page.locator(`[aria-label="${LIST_NAME} list"]`);
    await listCol.getByRole("button", { name: /add card/i }).click();
    await page.getByPlaceholder(/card title/i).fill(CARD_TITLE);
    await page.keyboard.press("Enter");
    await expect(listCol.getByText(CARD_TITLE)).toBeVisible();

    await listCol.getByRole("button", { name: /add card/i }).click();
    await page.getByPlaceholder(/card title/i).fill(OTHER_CARD_TITLE);
    await page.keyboard.press("Enter");
    await expect(listCol.getByText(OTHER_CARD_TITLE)).toBeVisible();

    secondBoardId = await createBoard(page, SECOND_BOARD_NAME);

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();

    for (const id of [boardId, secondBoardId]) {
      await page.goto(`/board/${id}`);
      await page.getByRole("button", { name: /board options/i }).click();
      await page.getByRole("menuitem", { name: /delete board/i }).click();
      await page.getByRole("button", { name: /^delete$/i }).click();
      await page.waitForURL((url) => !url.href.includes(`/board/${id}`));
    }

    await page.close();
  });

  test("can create a label from a card and assign it, showing a swatch on the card tile", async ({
    page,
  }) => {
    await page.goto(`/board/${boardId}`);

    const listCol = page.locator(`[aria-label="${LIST_NAME} list"]`);
    await listCol.getByText(CARD_TITLE).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /labels/i }).click();
    // Use real per-key typing (not .fill(), which sets the value directly and
    // bypasses keydown events) — base-ui's Menu intercepts character keydowns
    // for typeahead navigation, which previously swallowed keystrokes meant
    // for this input.
    await page.getByPlaceholder(/new label/i).pressSequentially(LABEL_NAME);
    await page.getByRole("button", { name: LABEL_COLOR_SWATCH, exact: true }).click();
    await page.getByRole("button", { name: /create label/i }).click();

    // Newly created label is assigned to the card automatically and shown as a pill
    const labelPill = dialog.getByText(LABEL_NAME);
    await expect(labelPill).toBeVisible();
    await expect(labelPill).not.toHaveText("");

    await page.keyboard.press("Escape"); // closes the label popover
    await page.keyboard.press("Escape"); // closes the card dialog
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // A colored dot swatch should now show on the card tile
    await expect(listCol.getByText(CARD_TITLE).locator("..").getByTitle(LABEL_NAME)).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(listCol.getByText(CARD_TITLE).locator("..").getByTitle(LABEL_NAME)).toBeVisible();
  });

  test("label is global — assignable to a card on a different board", async ({ page }) => {
    await page.goto(`/board/${secondBoardId}`);

    await page.getByRole("button", { name: /add list/i }).click();
    await page.getByPlaceholder(/list name/i).fill(LIST_NAME);
    await page.keyboard.press("Enter");

    const listCol = page.locator(`[aria-label="${LIST_NAME} list"]`);
    await listCol.getByRole("button", { name: /add card/i }).click();
    await page.getByPlaceholder(/card title/i).fill(OTHER_CARD_TITLE);
    await page.keyboard.press("Enter");
    await expect(listCol.getByText(OTHER_CARD_TITLE)).toBeVisible();

    await listCol.getByText(OTHER_CARD_TITLE).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /labels/i }).click();

    // The label created on the first board should already be listed here
    await expect(page.getByRole("button", { name: LABEL_NAME })).toBeVisible();
    await page.getByRole("button", { name: LABEL_NAME }).click();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(
      listCol.getByText(OTHER_CARD_TITLE).locator("..").getByTitle(LABEL_NAME)
    ).toBeVisible();
  });

  test("removing a label from a card removes its swatch", async ({ page }) => {
    await page.goto(`/board/${boardId}`);

    const listCol = page.locator(`[aria-label="${LIST_NAME} list"]`);
    await listCol.getByText(CARD_TITLE).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /labels/i }).click();
    // Scope to role=button: the picker row is a button, unlike the read-only
    // assigned-label pill already shown in the dialog body for this card.
    await page.getByRole("button", { name: LABEL_NAME }).click(); // toggle off
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(
      listCol.getByText(CARD_TITLE).locator("..").getByTitle(LABEL_NAME)
    ).not.toBeVisible();

    await page.reload();
    await expect(
      listCol.getByText(CARD_TITLE).locator("..").getByTitle(LABEL_NAME)
    ).not.toBeVisible();
  });

  test("renaming a label updates it everywhere it's assigned", async ({ page }) => {
    await page.goto(`/board/${secondBoardId}`);

    // Re-assign to the card on board 2 so we can verify the rename propagates there
    const listCol = page.locator(`[aria-label="${LIST_NAME} list"]`);
    await listCol.getByText(OTHER_CARD_TITLE).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /labels/i }).click();
    await expect(page.getByRole("button", { name: LABEL_NAME })).toBeVisible();

    await page.getByRole("button", { name: /rename/i }).click();
    await page.getByPlaceholder("Label name", { exact: true }).pressSequentially(RENAMED_LABEL_NAME);
    await page.keyboard.press("Enter");

    await expect(page.getByRole("button", { name: RENAMED_LABEL_NAME })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    dialog = page.getByRole("dialog");
    await expect(dialog).not.toBeVisible();

    await expect(
      listCol.getByText(OTHER_CARD_TITLE).locator("..").getByTitle(RENAMED_LABEL_NAME)
    ).toBeVisible();
  });

  test("deleting a label removes it from the picker and from every card", async ({ page }) => {
    await page.goto(`/board/${secondBoardId}`);

    const listCol = page.locator(`[aria-label="${LIST_NAME} list"]`);
    await listCol.getByText(OTHER_CARD_TITLE).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /labels/i }).click();
    await expect(page.getByRole("button", { name: RENAMED_LABEL_NAME })).toBeVisible();

    await page.getByRole("button", { name: /^delete label$/i }).click();

    await expect(dialog.getByText(RENAMED_LABEL_NAME)).not.toBeVisible();
    await expect(page.getByRole("button", { name: RENAMED_LABEL_NAME })).not.toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(
      listCol.getByText(OTHER_CARD_TITLE).locator("..").getByTitle(RENAMED_LABEL_NAME)
    ).not.toBeVisible();
  });
});
