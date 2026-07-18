import { type Page, type Locator } from "@playwright/test";
import { ConfirmDialog } from "./ConfirmDialog";

/** The board-level options menu (archive board / delete board) in the board header. */
export class BoardOptionsMenu {
  readonly page: Page;
  readonly triggerButton: Locator;
  readonly archiveBoardItem: Locator;
  readonly deleteBoardItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.triggerButton = page.getByRole("button", { name: /board options|board menu/i });
    this.archiveBoardItem = page.getByRole("menuitem", { name: /archive board/i });
    this.deleteBoardItem = page.getByRole("menuitem", { name: /delete board/i });
  }

  async open() {
    await this.triggerButton.click();
  }

  /** Archives the board and waits until the URL leaves this board's page. */
  async archiveBoard(boardId: string) {
    await this.open();
    await this.archiveBoardItem.click();
    await this.page.waitForURL((url) => !url.href.includes(`/board/${boardId}`));
  }

  /** Deletes an already-archived board via its board-page options menu. */
  async deleteBoard() {
    await this.deleteBoardItem.click();
    const confirm = new ConfirmDialog(this.page, "alertdialog");
    await confirm.confirmDelete();
  }
}
