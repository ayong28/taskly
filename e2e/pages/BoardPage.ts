import { type Page, type Locator, expect } from "@playwright/test";
import { Sidebar } from "./components/Sidebar";
import { BoardOptionsMenu } from "./components/BoardOptionsMenu";
import { FilterBar } from "./components/FilterBar";
import { ListColumn } from "./components/ListColumn";
import { ConfirmDialog } from "./components/ConfirmDialog";

/** A single board's page: header, lists, filter bar, and the persistent sidebar. */
export class BoardPage {
  readonly page: Page;
  readonly sidebar: Sidebar;
  readonly boardOptionsMenu: BoardOptionsMenu;
  readonly filterBar: FilterBar;
  readonly main: Locator;
  readonly addListButton: Locator;
  readonly listNameInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new Sidebar(page);
    this.boardOptionsMenu = new BoardOptionsMenu(page);
    this.filterBar = new FilterBar(page);
    this.main = page.getByRole("main");
    this.addListButton = page.getByRole("button", { name: /add list/i });
    this.listNameInput = page.getByPlaceholder(/list name|enter a title/i);
  }

  async goto(boardId: string) {
    await this.page.goto(`/board/${boardId}`);
  }

  heading(name: string): Locator {
    return this.page.getByRole("heading", { name });
  }

  notFoundMessage(): Locator {
    return this.page.getByText(/could not be found/i);
  }

  list(name: string): ListColumn {
    return new ListColumn(this.page, name);
  }

  async addList(name: string) {
    await this.addListButton.click();
    await this.listNameInput.fill(name);
    await this.page.keyboard.press("Enter");
    await expect(this.page.getByText(name)).toBeVisible();
  }

  /** Clicks a list's title to make it editable, then renames it. */
  async renameList(currentName: string, newName: string) {
    await this.page.getByText(currentName).click();
    await this.page.getByRole("textbox", { name: /list name/i }).fill(newName);
    await this.page.keyboard.press("Enter");
  }

  async startEditingListTitle(currentName: string) {
    await this.page.getByText(currentName).click();
  }

  listNameTextbox(): Locator {
    return this.page.getByRole("textbox", { name: /list name/i });
  }

  /** Clicks the board heading to make it editable, then renames it. */
  async renameBoardTitle(currentName: string, newName: string) {
    await this.heading(currentName).click();
    await this.page.getByRole("textbox", { name: /board name/i }).fill(newName);
    await this.page.keyboard.press("Enter");
  }

  /**
   * Boards can only be hard-deleted once archived (the board options menu
   * only shows "Delete Board" for an already-archived board). Drives the
   * full two-step archive-then-delete flow, used as test cleanup.
   */
  async deleteBoardViaUI(boardId: string) {
    await this.goto(boardId);
    await this.boardOptionsMenu.archiveBoard(boardId);

    await this.goto(boardId);
    await this.boardOptionsMenu.open();
    await this.boardOptionsMenu.deleteBoardItem.click();
    const confirm = new ConfirmDialog(this.page, "alertdialog");
    await confirm.confirmDelete();
    await this.page.waitForURL((url) => !url.href.includes(`/board/${boardId}`));
    await confirm.waitUntilClosed();
  }
}
