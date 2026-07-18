import { type Page, type Locator, expect } from "@playwright/test";

/** The "New board" creation dialog opened from the sidebar. */
export class NewBoardDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly nameInput: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.nameInput = this.dialog.getByLabel(/name/i);
    this.createButton = this.dialog.getByRole("button", { name: /create/i });
    this.cancelButton = this.dialog.getByRole("button", { name: /cancel/i });
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async cancel() {
    await this.cancelButton.click();
  }

  /** Fills the name, submits, waits for navigation to the new board, and returns its id. */
  async createAndGetBoardId(name: string): Promise<string> {
    const urlBeforeCreate = this.page.url();
    await this.fillName(name);
    await this.createButton.click();
    await this.page.waitForURL((url) => url.href !== urlBeforeCreate);
    const boardId = this.page.url().match(/\/board\/(\d+)/)?.[1] ?? "";
    expect(boardId).not.toBe("");
    return boardId;
  }
}
