import { test, expect } from "@playwright/test";
import { deleteBoardViaUI } from "./helpers";

const BOARD_NAME = "Drag Drop Test Board";
const LIST_NAME = "Drag Test List";
const TARGET_LIST_NAME = "Target List";
const CARD_1 = "First Card";
const CARD_2 = "Second Card";
const TARGET_CARD = "Target Card";

async function dragTo(
  page: import("@playwright/test").Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  // dnd-kit uses pointer events attached to document — dispatch them natively
  // so React's synthetic event system and dnd-kit's document listeners both fire.
  await page.evaluate(
    async ({ sx, sy, ex, ey }: { sx: number; sy: number; ex: number; ey: number }) => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const el = document.elementFromPoint(sx, sy) as Element;
      el.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true, cancelable: true,
          clientX: sx, clientY: sy,
          isPrimary: true, button: 0, buttons: 1,
        })
      );

      await sleep(80);

      // Move gradually to exceed the 8px distance activation threshold
      for (let i = 1; i <= 15; i++) {
        document.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true, cancelable: true,
            clientX: sx, clientY: sy + i,
            isPrimary: true, buttons: 1,
          })
        );
        await sleep(8);
      }

      // Drag to destination
      const steps = 25;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        document.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true, cancelable: true,
            clientX: sx + (ex - sx) * t,
            clientY: (sy + 15) + (ey - sy - 15) * t,
            isPrimary: true, buttons: 1,
          })
        );
        await sleep(8);
      }

      await sleep(80);

      document.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true, cancelable: true,
          clientX: ex, clientY: ey,
          isPrimary: true, button: 0, buttons: 0,
        })
      );

      await sleep(50);
    },
    { sx: startX, sy: startY, ex: endX, ey: endY }
  );
}

test.describe("Drag and drop", () => {
  test.describe.configure({ mode: "serial" });

  let boardId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto("/");

    // Create board
    await page
      .getByRole("navigation", { name: "Boards" })
      .getByRole("button", { name: /new board/i })
      .click();
    await page.getByRole("dialog").getByLabel(/name/i).fill(BOARD_NAME);
    const urlBeforeCreate = page.url();
    await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await page.waitForURL((url) => url.href !== urlBeforeCreate);
    boardId = page.url().match(/\/board\/(\d+)/)?.[1] ?? "";

    // Create list
    await page.getByRole("button", { name: /add list/i }).click();
    await page.getByPlaceholder(/list name/i).fill(LIST_NAME);
    await page.keyboard.press("Enter");
    await expect(page.getByText(LIST_NAME)).toBeVisible();

    // Add two cards
    const listCol = page.locator(`[aria-label="${LIST_NAME} list"]`);
    await listCol.getByRole("button", { name: /add card/i }).click();
    await page.getByRole("dialog").getByLabel(/title/i).fill(CARD_1);
    await page.getByRole("dialog").getByRole("button", { name: /^add card$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(listCol.getByText(CARD_1)).toBeVisible();

    await listCol.getByRole("button", { name: /add card/i }).click();
    await page.getByRole("dialog").getByLabel(/title/i).fill(CARD_2);
    await page.getByRole("dialog").getByRole("button", { name: /^add card$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(listCol.getByText(CARD_2)).toBeVisible();

    // Create target list with one card (for cross-list drag tests)
    await page.getByRole("button", { name: /add list/i }).click();
    await page.getByPlaceholder(/list name/i).fill(TARGET_LIST_NAME);
    await page.keyboard.press("Enter");
    await expect(page.getByText(TARGET_LIST_NAME)).toBeVisible();

    const targetListCol = page.locator(`[aria-label="${TARGET_LIST_NAME} list"]`);
    await targetListCol.getByRole("button", { name: /add card/i }).click();
    await page.getByRole("dialog").getByLabel(/title/i).fill(TARGET_CARD);
    await page.getByRole("dialog").getByRole("button", { name: /^add card$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(targetListCol.getByText(TARGET_CARD)).toBeVisible();

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`/board/${boardId}`);

    for (const listName of [TARGET_LIST_NAME, LIST_NAME]) {
      await page.locator(`[aria-label="${listName} list"]`).scrollIntoViewIfNeeded();
      await page
        .locator(`[aria-label="${listName} list"]`)
        .getByRole("button", { name: /list options/i })
        .click();
      await page.getByRole("menuitem", { name: /delete list/i }).click();
    }

    await deleteBoardViaUI(page, boardId);

    await page.close();
  });

  test("can reorder cards within a list by dragging", async ({ page }) => {
    await page.goto(`/board/${boardId}`);

    const listCol = page.locator(`[aria-label="${LIST_NAME} list"]`);
    const card1 = listCol.getByText(CARD_1);
    const card2 = listCol.getByText(CARD_2);

    // Scroll cards into viewport (they may be off-screen behind other list columns)
    await card1.scrollIntoViewIfNeeded();

    // Assert initial order: CARD_1 above CARD_2
    const box1Before = await card1.boundingBox();
    const box2Before = await card2.boundingBox();
    expect(box1Before!.y).toBeLessThan(box2Before!.y);

    // Drag CARD_1 below CARD_2
    await dragTo(
      page,
      box1Before!.x + box1Before!.width / 2,
      box1Before!.y + box1Before!.height / 2,
      box2Before!.x + box2Before!.width / 2,
      box2Before!.y + box2Before!.height
    );

    // Verify visual reorder
    await expect(async () => {
      const box1 = await card1.boundingBox();
      const box2 = await card2.boundingBox();
      expect(box2!.y).toBeLessThan(box1!.y);
    }).toPass({ timeout: 5000 });

    // Reload and verify persistence
    await page.reload();
    const box1After = await card1.boundingBox();
    const box2After = await card2.boundingBox();
    expect(box2After!.y).toBeLessThan(box1After!.y);
  });

  test("can drag a card into an empty list", async ({ page }) => {
    // New boards auto-create "To Do" / "In Progress" / "Done" lists (see DEFAULT_LISTS
    // in lib/actions/boards.ts) — reuse those instead of creating duplicates.
    const EMPTY_SOURCE_LIST = "To Do";
    const EMPTY_DEST_LIST = "In Progress";
    const CARD_TITLE = "Create Title";

    await page.goto(`/board/${boardId}`);

    await expect(page.getByText(EMPTY_SOURCE_LIST)).toBeVisible();
    await expect(page.getByText(EMPTY_DEST_LIST)).toBeVisible();

    // Add one card to the source (empty) list
    const sourceListCol = page.locator(`[aria-label="${EMPTY_SOURCE_LIST} list"]`);
    await sourceListCol.getByRole("button", { name: /add card/i }).click();
    await page.getByRole("dialog").getByLabel(/title/i).fill(CARD_TITLE);
    await page.getByRole("dialog").getByRole("button", { name: /^add card$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(sourceListCol.getByText(CARD_TITLE)).toBeVisible();

    // Destination list must remain empty before the drag
    const destListCol = page.locator(`[aria-label="${EMPTY_DEST_LIST} list"]`);
    await expect(destListCol.getByText(CARD_TITLE)).not.toBeVisible();

    const card = sourceListCol.getByText(CARD_TITLE);
    await card.scrollIntoViewIfNeeded();
    await destListCol.scrollIntoViewIfNeeded();

    const cardBox = await card.boundingBox();
    const destBox = await destListCol.boundingBox();

    await dragTo(
      page,
      cardBox!.x + cardBox!.width / 2,
      cardBox!.y + cardBox!.height / 2,
      destBox!.x + destBox!.width / 2,
      destBox!.y + destBox!.height / 2
    );

    // Card should now appear in the destination (previously empty) list
    await expect(destListCol.getByText(CARD_TITLE)).toBeVisible();
    await expect(sourceListCol.getByText(CARD_TITLE)).not.toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await page.locator(`[aria-label="${EMPTY_DEST_LIST} list"]`).getByText(CARD_TITLE).scrollIntoViewIfNeeded();
    await expect(
      page.locator(`[aria-label="${EMPTY_DEST_LIST} list"]`).getByText(CARD_TITLE)
    ).toBeVisible();
    await expect(
      page.locator(`[aria-label="${EMPTY_SOURCE_LIST} list"]`).getByText(CARD_TITLE)
    ).not.toBeVisible();

    // Clean up the card so the default lists are empty again for other tests / teardown
    await page.locator(`[aria-label="${EMPTY_DEST_LIST} list"]`).getByText(CARD_TITLE).click();
    await page.getByRole("button", { name: /^archive$/i }).click();
  });

  test("can drag a card to a different list", async ({ page }) => {
    await page.goto(`/board/${boardId}`);

    // Scroll target list into view — this also brings Drag Test List into viewport
    // since both lists are adjacent columns
    const targetCard = page.locator(`[aria-label="${TARGET_LIST_NAME} list"]`).getByText(TARGET_CARD);
    await targetCard.scrollIntoViewIfNeeded();

    // After test 1, CARD_2 is at the top of Drag Test List
    const sourceCard = page.locator(`[aria-label="${LIST_NAME} list"]`).getByText(CARD_2);
    const sourceBox = await sourceCard.boundingBox();
    const targetBox = await targetCard.boundingBox();

    await dragTo(
      page,
      sourceBox!.x + sourceBox!.width / 2,
      sourceBox!.y + sourceBox!.height / 2,
      targetBox!.x + targetBox!.width / 2,
      targetBox!.y + targetBox!.height / 2
    );

    // CARD_2 should now appear in Target List
    await expect(
      page.locator(`[aria-label="${TARGET_LIST_NAME} list"]`).getByText(CARD_2)
    ).toBeVisible();
    // And be gone from Drag Test List
    await expect(
      page.locator(`[aria-label="${LIST_NAME} list"]`).getByText(CARD_2)
    ).not.toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await page.locator(`[aria-label="${TARGET_LIST_NAME} list"]`).getByText(CARD_2).scrollIntoViewIfNeeded();
    await expect(
      page.locator(`[aria-label="${TARGET_LIST_NAME} list"]`).getByText(CARD_2)
    ).toBeVisible();
    await expect(
      page.locator(`[aria-label="${LIST_NAME} list"]`).getByText(CARD_2)
    ).not.toBeVisible();
  });
});
