import { type Page, type Locator } from "@playwright/test";

/** The board-level filter bar (filter by label / clear filters). */
export class FilterBar {
  readonly page: Page;
  readonly labelFilterSelect: Locator;
  readonly clearFiltersButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.labelFilterSelect = page.getByLabel("Filter by label");
    this.clearFiltersButton = page.getByRole("button", { name: /clear filters/i });
  }

  async filterByLabel(labelName: string) {
    await this.labelFilterSelect.selectOption({ label: labelName });
  }

  async clearFilters() {
    await this.clearFiltersButton.click();
  }
}
