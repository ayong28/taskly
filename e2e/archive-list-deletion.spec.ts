import { test, expect } from "@playwright/test";
import { deleteBoardViaUI } from "./helpers";

const BOARD_NAME = "Archive List Deletion Test Board";
const LIST_1 = "List1";
const CARD_1 = "card1";
const CARD_2 = "card2";

test.describe("Deleting a list archives its cards, then restore fans them into Restored", () => {
  let boardId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Boards" })
      .getByRole("button", { name: /new board/i })
      .click();
    await page.getByRole("dialog").getByLabel(/name/i).fill(BOARD_NAME);
    const urlBeforeCreate = page.url();
    await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await page.waitForURL((url) => url.href !== urlBeforeCreate);
    boardId = page.url().match(/\/board\/(\d+)/)?.[1] ?? "";

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteBoardViaUI(page, boardId);
    await page.close();
  });

  test("delete a list, its cards land in Archived, then restoring each fans them into Restored", async ({
    page,
  }) => {
    await page.goto(`/board/${boardId}`);

    // 1. Create a new list - "List1"
    await page.getByRole("button", { name: /add list/i }).click();
    await page.getByPlaceholder(/list name/i).fill(LIST_1);
    await page.keyboard.press("Enter");
    await expect(page.getByText(LIST_1)).toBeVisible();

    // 2. Create 2 cards in the list, "card1", "card2"
    const listCol = page.locator(`[aria-label="${LIST_1} list"]`);
    for (const title of [CARD_1, CARD_2]) {
      await listCol.getByRole("button", { name: /add card/i }).click();
      await page.getByPlaceholder(/card title/i).fill(title);
      await page.keyboard.press("Enter");
      await expect(listCol.getByText(title)).toBeVisible();
    }

    // 3. Delete "List1"
    await listCol.getByRole("button", { name: /list options/i }).click();
    await page.getByRole("menuitem", { name: /delete list/i }).click();
    await expect(page.locator(`[aria-label="${LIST_1} list"]`)).toHaveCount(0);

    // 5. Assertion: "Archived" list is created and card1/card2 are in it
    const archivedList = page.locator('[aria-label="Archived list"]');
    await expect(archivedList).toBeVisible();
    await expect(archivedList.getByText(CARD_1)).toBeVisible();
    await expect(archivedList.getByText(CARD_2)).toBeVisible();

    // 6. Restore "card1"
    await archivedList.getByText(CARD_1).click();
    await page.getByRole("button", { name: /^restore$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 7. Assertion: "Restored" list is created, card1 is in it
    const restoredList = page.locator('[aria-label="Restored list"]');
    await expect(restoredList).toBeVisible();
    await expect(restoredList.getByText(CARD_1)).toBeVisible();

    // 8. Restore "card2"
    await archivedList.getByText(CARD_2).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /^restore$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 9. Assertion: card2 is in the "Restored" list
    await expect(restoredList.getByText(CARD_2)).toBeVisible();

    // Only one Restored list should ever exist on this board
    await expect(page.locator('[aria-label="Restored list"]')).toHaveCount(1);
  });
});
