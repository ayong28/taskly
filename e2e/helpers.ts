import { expect, type Page } from "@playwright/test";

/**
 * Boards can only be hard-deleted once archived (BoardHeader only shows
 * "Delete Board" for an already-archived board). This drives that full
 * two-step flow for test cleanup.
 */
export async function deleteBoardViaUI(page: Page, boardId: string) {
  await page.goto(`/board/${boardId}`);
  await page.getByRole("button", { name: /board options/i }).click();
  await page.getByRole("menuitem", { name: /archive board/i }).click();
  await page.waitForURL((url) => !url.href.includes(`/board/${boardId}`));

  await page.goto(`/board/${boardId}`);
  await page.getByRole("button", { name: /board options/i }).click();
  await page.getByRole("menuitem", { name: /delete board/i }).click();
  await page.getByRole("button", { name: /^delete$/i }).click();
  await page.waitForURL((url) => !url.href.includes(`/board/${boardId}`));
  await expect(page.getByRole("dialog")).not.toBeVisible();
}
