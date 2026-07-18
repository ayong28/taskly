import { type Page, type Locator } from "@playwright/test";
import { Sidebar } from "./components/Sidebar";

/** The home page ("/"): the board list sidebar plus an empty main area. */
export class HomePage {
  readonly page: Page;
  readonly sidebar: Sidebar;
  readonly main: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new Sidebar(page);
    this.main = page.getByRole("main");
  }

  async goto() {
    await this.page.goto("/");
  }

  /** Creates a board from the home page and returns its id. */
  async createBoard(name: string): Promise<string> {
    await this.goto();
    return this.sidebar.createBoard(name);
  }
}
