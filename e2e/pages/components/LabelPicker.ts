import { type Page, type Locator, expect } from "@playwright/test";

/** The label picker popover opened from a card's "Labels" button. */
export class LabelPicker {
  readonly page: Page;
  readonly newLabelInput: Locator;
  readonly createLabelButton: Locator;
  readonly renameButton: Locator;
  readonly deleteLabelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // The picker renders inside the card dialog, layered as a popover above
    // it; its controls are scoped against the full page rather than the
    // dialog root.
    this.newLabelInput = page.getByPlaceholder(/new label/i);
    this.createLabelButton = page.getByRole("button", { name: /create label/i });
    this.renameButton = page.getByRole("button", { name: /rename/i });
    this.deleteLabelButton = page.getByRole("button", { name: /^delete label$/i });
  }

  colorSwatch(color: string): Locator {
    return this.page.getByRole("button", { name: color, exact: true });
  }

  /** The clickable picker row for an existing label (assign/unassign toggle). */
  labelOption(name: string): Locator {
    return this.page.getByRole("button", { name });
  }

  async createLabel(name: string, color: string) {
    await this.newLabelInput.pressSequentially(name);
    await this.colorSwatch(color).click();
    await this.createLabelButton.click();
  }

  /** Toggles an existing label's assignment on the currently open card. */
  async toggleLabel(name: string) {
    await this.labelOption(name).click();
  }

  async renameLabel(newName: string) {
    await this.renameButton.click();
    await this.page.getByPlaceholder("Label name", { exact: true }).pressSequentially(newName);
    await this.page.keyboard.press("Enter");
    await expect(this.labelOption(newName)).toBeVisible();
  }

  async deleteLabel() {
    await this.deleteLabelButton.click();
  }
}
