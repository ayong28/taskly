import { type Page, type Locator, expect } from "@playwright/test";
import { LabelPicker } from "./LabelPicker";

/** The card detail dialog opened by clicking a card tile. */
export class CardModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleInput: Locator;
  readonly saveButton: Locator;
  readonly archiveButton: Locator;
  readonly restoreButton: Locator;
  readonly labelsButton: Locator;
  readonly labelPicker: LabelPicker;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.titleInput = page.getByLabel(/title/i);
    this.saveButton = page.getByRole("button", { name: /save/i });
    this.archiveButton = page.getByRole("button", { name: /^archive$/i });
    this.restoreButton = page.getByRole("button", { name: /^restore$/i });
    this.labelsButton = this.dialog.getByRole("button", { name: /labels/i });
    this.labelPicker = new LabelPicker(page);
  }

  /** Assigned label pill (read-only text) shown in the dialog body. */
  assignedLabelPill(name: string): Locator {
    return this.dialog.getByText(name);
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async save() {
    await this.saveButton.click();
  }

  async archive() {
    await this.archiveButton.click();
    await expect(this.dialog).not.toBeVisible();
  }

  async restore() {
    await this.restoreButton.click();
    await expect(this.dialog).not.toBeVisible();
  }

  async openLabels(): Promise<LabelPicker> {
    await this.labelsButton.click();
    return this.labelPicker;
  }

  /** Closes the label popover (if open) and then the card dialog itself. */
  async close() {
    await this.page.keyboard.press("Escape");
    await this.page.keyboard.press("Escape");
    await expect(this.dialog).not.toBeVisible();
  }
}
