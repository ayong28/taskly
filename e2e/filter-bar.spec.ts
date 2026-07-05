import { test, expect } from "@playwright/test";

const BOARD_NAME = "Filter Bar Test Board";
const LIST_NAME = "Filter Bar Test List";
const LABELED_CARD_TITLE = "Card With Label";
const UNLABELED_CARD_TITLE = "Card Without Label";
const LABEL_NAME = "Filter QA";
const LABEL_COLOR_SWATCH = "teal";

test.describe("Filter bar", () => {
  test.describe.configure({ mode: "serial" });

  let boardId: string;

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
    await page.getByPlaceholder(/card title/i).fill(LABELED_CARD_TITLE);
    await page.keyboard.press("Enter");
    await expect(listCol.getByText(LABELED_CARD_TITLE)).toBeVisible();

    await listCol.getByRole("button", { name: /add card/i }).click();
    await page.getByPlaceholder(/card title/i).fill(UNLABELED_CARD_TITLE);
    await page.keyboard.press("Enter");
    await expect(listCol.getByText(UNLABELED_CARD_TITLE)).toBeVisible();

    await listCol.getByText(LABELED_CARD_TITLE).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /labels/i }).click();
    await page.getByPlaceholder(/new label/i).pressSequentially(LABEL_NAME);
    await page.getByRole("button", { name: LABEL_COLOR_SWATCH, exact: true }).click();
    await page.getByRole("button", { name: /create label/i }).click();
    await expect(dialog.getByText(LABEL_NAME)).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`/board/${boardId}`);

    // Labels are global and outlive the board, so delete the one this spec
    // created before tearing down the board — otherwise it leaks into other
    // specs that assume a specific set of labels exist.
    const listCol = page.locator(`[aria-label="${LIST_NAME} list"]`);
    await listCol.getByText(LABELED_CARD_TITLE).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /labels/i }).click();
    await page.getByRole("button", { name: /^delete label$/i }).click();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await page.getByRole("button", { name: /board options/i }).click();
    await page.getByRole("menuitem", { name: /delete board/i }).click();
    await page.getByRole("button", { name: /^delete$/i }).click();
    await page.waitForURL((url) => !url.href.includes(`/board/${boardId}`));
    await page.close();
  });

  test("filtering by label hides non-matching cards, clearing restores them", async ({
    page,
  }) => {
    await page.goto(`/board/${boardId}`);

    const listCol = page.locator(`[aria-label="${LIST_NAME} list"]`);
    await expect(listCol.getByText(LABELED_CARD_TITLE)).toBeVisible();
    await expect(listCol.getByText(UNLABELED_CARD_TITLE)).toBeVisible();

    await page.getByLabel("Filter by label").selectOption({ label: LABEL_NAME });

    await expect(listCol.getByText(LABELED_CARD_TITLE)).toBeVisible();
    await expect(listCol.getByText(UNLABELED_CARD_TITLE)).not.toBeVisible();

    await page.getByRole("button", { name: /clear filters/i }).click();

    await expect(listCol.getByText(LABELED_CARD_TITLE)).toBeVisible();
    await expect(listCol.getByText(UNLABELED_CARD_TITLE)).toBeVisible();
  });
});
