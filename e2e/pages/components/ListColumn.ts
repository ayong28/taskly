import { type Page, type Locator, expect } from "@playwright/test";
import { CardModal } from "./CardModal";

/** A single list column on a board (e.g. "To Do", "Archived", "Restored"). */
export class ListColumn {
  readonly page: Page;
  readonly name: string;
  readonly root: Locator;
  readonly addCardButton: Locator;
  readonly listOptionsButton: Locator;

  constructor(page: Page, name: string) {
    this.page = page;
    this.name = name;
    this.root = page.locator(`[aria-label="${name} list"]`);
    this.addCardButton = this.root.getByRole("button", { name: /add card/i });
    this.listOptionsButton = this.root.getByRole("button", { name: /list options|list menu/i });
  }

  card(title: string): Locator {
    return this.root.getByText(title);
  }

  /** The small swatch/dot on a card tile for a given assigned label. */
  cardLabelSwatch(cardTitle: string, labelName: string): Locator {
    return this.card(cardTitle).locator("..").getByTitle(labelName);
  }

  async scrollIntoView() {
    await this.root.scrollIntoViewIfNeeded();
  }

  /** Opens the "Add card" dialog and fills + submits the title. */
  async addCard(title: string) {
    await this.addCardButton.click();
    const modal = new CardModal(this.page);
    await modal.titleInput.fill(title);
    await this.page.getByRole("dialog").getByRole("button", { name: /^add card$/i }).click();
    await expect(modal.dialog).not.toBeVisible();
    await expect(this.card(title)).toBeVisible();
  }

  /** Opens the card detail dialog for an existing card on this list. */
  async openCard(title: string): Promise<CardModal> {
    await this.card(title).click();
    return new CardModal(this.page);
  }

  async deleteList() {
    await this.listOptionsButton.click();
    await this.page.getByRole("menuitem", { name: /delete list/i }).click();
  }
}
