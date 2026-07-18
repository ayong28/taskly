import { type Page, type Locator } from "@playwright/test";
import { NewBoardDialog } from "./NewBoardDialog";
import { ConfirmDialog } from "./ConfirmDialog";

/** The persistent sidebar (nav landmark named "Boards") shown on every page. */
export class Sidebar {
  readonly page: Page;
  readonly nav: Locator;
  readonly newBoardButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = page.getByRole("navigation", { name: "Boards" });
    this.newBoardButton = this.nav.getByRole("button", { name: /new board|add board|create board/i });
  }

  boardLink(name: string): Locator {
    return this.nav.getByText(name);
  }

  archivedSectionButton(): Locator {
    return this.nav.getByRole("button", { name: /archived \(\d+\)/i });
  }

  /** Opens the New Board dialog and returns it for further interaction. */
  async openNewBoardDialog(): Promise<NewBoardDialog> {
    await this.newBoardButton.click();
    return new NewBoardDialog(this.page);
  }

  /** Creates a board via the sidebar dialog and returns the new board id. */
  async createBoard(name: string): Promise<string> {
    const dialog = await this.openNewBoardDialog();
    return dialog.createAndGetBoardId(name);
  }

  async openArchivedSection() {
    await this.archivedSectionButton().click();
  }

  /**
   * Row (list item) for an archived board with the given name. Scoped to the
   * *last* match since multiple specs may leave same-titled archived boards
   * behind without deleting them.
   */
  archivedBoardRow(name: string): Locator {
    return this.nav.getByText(name).last().locator("..");
  }

  /** Deletes an archived board directly from the sidebar's Archived section. */
  async deleteArchivedBoard(name: string) {
    await this.openArchivedSection();
    await this.archivedBoardRow(name).getByRole("button", { name: /delete board/i }).click();
    const confirm = new ConfirmDialog(this.page, "alertdialog");
    await confirm.confirmDelete();
  }
}
