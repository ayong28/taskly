import { test, expect } from "@playwright/test";

const BOARD_NAME = "Card CRUD Test Board";
const LIST_NAME = "Card Test List";
const CARD_TITLE = "My Test Card";
const CARD_TITLE_UPDATED = "Updated Test Card";

test.describe("Card CRUD", () => {
  test.describe.configure({ mode: "serial" });

  let boardId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    // Create board
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

    // Create list
    await page.getByRole("button", { name: /add list/i }).click();
    await page.getByPlaceholder(/list name/i).fill(LIST_NAME);
    await page.keyboard.press("Enter");
    await expect(page.getByText(LIST_NAME)).toBeVisible();

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`/board/${boardId}`);

    // Delete card if still present (may already be gone if delete test passed,
    // or delete UI may not exist yet during early TDD phases)
    try {
      for (const title of [CARD_TITLE_UPDATED, CARD_TITLE]) {
        if (await page.getByText(title).isVisible({ timeout: 2000 })) {
          await page.getByText(title).click();
          await page.getByRole("button", { name: /delete/i }).click({ timeout: 5000 });
          break;
        }
      }
    } catch {
      // card already deleted or delete UI not yet available
    }

    // Delete list
    await page
      .locator(`[aria-label="${LIST_NAME} list"]`)
      .getByRole("button", { name: /list options/i })
      .click();
    await page.getByRole("menuitem", { name: /delete list/i }).click();

    // Delete board
    await page.getByRole("button", { name: /board options/i }).click();
    await page.getByRole("menuitem", { name: /delete board/i }).click();
    await page.getByRole("button", { name: /^delete$/i }).click();

    await page.close();
  });

  test("can create a card in a list", async ({ page }) => {
    await page.goto(`/board/${boardId}`);

    await page
      .locator(`[aria-label="${LIST_NAME} list"]`)
      .getByRole("button", { name: /add card/i })
      .click();
    await page.getByPlaceholder(/card title/i).fill(CARD_TITLE);
    await page.keyboard.press("Enter");

    await expect(page.getByText(CARD_TITLE)).toBeVisible();
  });

  test("can edit a card title", async ({ page }) => {
    await page.goto(`/board/${boardId}`);

    await page.getByText(CARD_TITLE).click();
    await page.getByLabel(/title/i).fill(CARD_TITLE_UPDATED);
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText(CARD_TITLE_UPDATED)).toBeVisible();
  });

  test("can delete a card", async ({ page }) => {
    await page.goto(`/board/${boardId}`);

    await page.getByText(CARD_TITLE_UPDATED).click();
    await page.getByRole("button", { name: /delete/i }).click();

    await expect(
      page.locator(`[aria-label="${LIST_NAME} list"]`).getByText(CARD_TITLE_UPDATED)
    ).not.toBeVisible();
  });
});
