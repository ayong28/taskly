import { test, expect } from "@playwright/test";
import { deleteBoardViaUI } from "./helpers";

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

  async function addList(page: import("@playwright/test").Page, name: string) {
    await page.getByRole("button", { name: /add list/i }).click();
    await page.getByPlaceholder(/list name/i).fill(name);
    await page.keyboard.press("Enter");
    await expect(page.getByText(name)).toBeVisible();
  }

  async function addCard(
    page: import("@playwright/test").Page,
    listName: string,
    cardTitle: string
  ) {
    const listCol = page.locator(`[aria-label="${listName} list"]`);
    await listCol.getByRole("button", { name: /add card/i }).click();
    await page.getByPlaceholder(/card title/i).fill(cardTitle);
    await page.keyboard.press("Enter");
    await expect(listCol.getByText(cardTitle)).toBeVisible();
  }

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

    await addList(page, LIST_A);
    await addCard(page, LIST_A, CARD_1);
    await addCard(page, LIST_A, CARD_2);

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteBoardViaUI(page, boardId);
    await page.close();
  });

  test("archiving a card creates the Archived list and moves the card into it", async ({
    page,
  }) => {
    await page.goto(`/board/${boardId}`);
    const listA = page.locator(`[aria-label="${LIST_A} list"]`);

    await listA.getByText(CARD_1).click();
    await page.getByRole("button", { name: /^archive$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(listA.getByText(CARD_1)).not.toBeVisible();
    await expect(listA.getByText(CARD_2)).toBeVisible();

    const archivedList = page.locator('[aria-label="Archived list"]');
    await expect(archivedList).toBeVisible();
    await expect(archivedList.getByText(CARD_1)).toBeVisible();
  });

  test("the Archived list has no list-options menu", async ({ page }) => {
    await page.goto(`/board/${boardId}`);
    const archivedList = page.locator('[aria-label="Archived list"]');

    await expect(
      archivedList.getByRole("button", { name: /list options/i })
    ).not.toBeVisible();
  });

  test("restoring a card whose original list still exists returns it there, and the Archived list persists even when empty", async ({
    page,
  }) => {
    await page.goto(`/board/${boardId}`);
    const archivedList = page.locator('[aria-label="Archived list"]');

    await archivedList.getByText(CARD_1).click();
    await page.getByRole("button", { name: /^restore$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const listA = page.locator(`[aria-label="${LIST_A} list"]`);
    await expect(listA.getByText(CARD_1)).toBeVisible();

    // Archived list stays on the board even though it's now empty
    await expect(archivedList).toBeVisible();
    await expect(archivedList.getByText(CARD_1)).not.toBeVisible();
  });

  test("deleting a list archives all its cards into the Archived list", async ({ page }) => {
    await page.goto(`/board/${boardId}`);
    await addList(page, LIST_B);
    await addCard(page, LIST_B, CARD_3);

    await page
      .locator(`[aria-label="${LIST_B} list"]`)
      .getByRole("button", { name: /list options/i })
      .click();
    await page.getByRole("menuitem", { name: /delete list/i }).click();

    await expect(page.locator(`[aria-label="${LIST_B} list"]`)).toHaveCount(0);

    const archivedList = page.locator('[aria-label="Archived list"]');
    await expect(archivedList.getByText(CARD_3)).toBeVisible();
  });

  test("restoring a card whose original list was deleted moves it into a new Restored list", async ({
    page,
  }) => {
    await page.goto(`/board/${boardId}`);
    const archivedList = page.locator('[aria-label="Archived list"]');

    await archivedList.getByText(CARD_3).click();
    await page.getByRole("button", { name: /^restore$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const restoredList = page.locator('[aria-label="Restored list"]');
    await expect(restoredList).toBeVisible();
    await expect(restoredList.getByText(CARD_3)).toBeVisible();
    await expect(
      restoredList.getByRole("button", { name: /list options/i })
    ).not.toBeVisible();
  });

  test("a second card restored to a missing original list reuses the same Restored list", async ({
    page,
  }) => {
    await page.goto(`/board/${boardId}`);
    await addList(page, LIST_C);
    await addCard(page, LIST_C, CARD_4);

    await page
      .locator(`[aria-label="${LIST_C} list"]`)
      .getByRole("button", { name: /list options/i })
      .click();
    await page.getByRole("menuitem", { name: /delete list/i }).click();

    const archivedList = page.locator('[aria-label="Archived list"]');
    await archivedList.getByText(CARD_4).click();
    await page.getByRole("button", { name: /^restore$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Exactly one Restored list on the board, now containing both cards
    await expect(page.locator('[aria-label="Restored list"]')).toHaveCount(1);
    const restoredList = page.locator('[aria-label="Restored list"]');
    await expect(restoredList.getByText(CARD_3)).toBeVisible();
    await expect(restoredList.getByText(CARD_4)).toBeVisible();
  });
});
