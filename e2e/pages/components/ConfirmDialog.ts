import { type Page, type Locator, expect } from "@playwright/test";

/**
 * A generic "are you sure" confirmation dialog. Covers both the plain
 * `dialog` role (board delete from the board page) and `alertdialog`
 * role (board delete from the sidebar's archived section).
 */
export class ConfirmDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page, role: "dialog" | "alertdialog" = "dialog") {
    this.page = page;
    this.dialog = page.getByRole(role);
    this.deleteButton = this.dialog.getByRole("button", { name: /^delete$/i });
  }

  async confirmDelete() {
    await this.deleteButton.click();
  }

  async waitUntilClosed() {
    await expect(this.dialog).not.toBeVisible();
  }
}
