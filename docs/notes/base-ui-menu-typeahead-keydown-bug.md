# Bug deep-dive: base-ui Menu typeahead swallowing keystrokes

**Status:** Fixed in commit `eb9915d` (never shipped in a broken state — caught before that commit).
**Files involved:** `components/Label/LabelPicker.tsx`, `e2e/labels.spec.ts`, `node_modules/@base-ui/react/floating-ui-react/hooks/useTypeahead.js`

## Symptom

While manually testing the new Labels feature, typing into the "New label name" text field (and the label "rename" field) inside the label popover did nothing — no characters appeared, and the "Create label" button stayed disabled. Yet the Playwright E2E test for this exact flow (`e2e/labels.spec.ts`, "can create a label from a card and assign it...") was green.

## Root cause

`components/Label/LabelPicker.tsx` renders its "assign/create/rename" UI inside `@/components/ui/dropdown-menu`'s `DropdownMenuContent`, which wraps `@base-ui/react`'s `Menu` primitive (`MenuPrimitive.Popup`).

base-ui's `Menu` includes built-in **typeahead navigation**: while the menu is open, pressing a letter key is supposed to jump-focus the menu item whose label starts with that letter (standard listbox/menu a11y behavior — same idea as Windows Start Menu). This is implemented in `useTypeahead` (`node_modules/@base-ui/react/floating-ui-react/hooks/useTypeahead.js`), which attaches an `onKeyDown` handler at the menu-popup level:

```js
// useTypeahead.js — abbreviated
const onKeyDown = useStableCallback((event) => {
  ...
  if (listContent == null || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  if (open && event.key !== ' ') {
    stopEvent(event); // preventDefault() + stopPropagation()
    ...
  }
});
```

Any single-character keydown event that reaches this handler gets `preventDefault()` + `stopPropagation()`'d, *regardless of what element the keystroke actually targets*. It does not check whether `event.target` is a form control (`<input>`, `<textarea>`) that should be exempt.

Our "New label name" `<input>` and the inline "rename" `<input>` are both rendered as **children of** `DropdownMenuContent`, i.e. descendants of the same DOM subtree the menu's typeahead listener is bound to. Native keydown events bubble from the input up through that subtree, so:

1. User presses a key while focused on the input.
2. The input's own (nonexistent, originally) keydown handling would normally let the browser insert the character.
3. But the event bubbles up to the menu popup's `onKeyDown` (attached via base-ui's `getFloatingProps()`/similar prop-getter spread onto the popup element) *before* the browser finishes it's default action, and that handler calls `preventDefault()`, which cancels the native text-insertion behavior for that keystroke.
4. Net effect: the keystroke is silently absorbed by the menu's typeahead logic instead of reaching the input's value.

This is a known category of bug with headless menu/listbox/combobox libraries (Radix, react-aria, base-ui, Reach UI have all had versions of it): typeahead-style keyboard handling is designed for a list of non-interactive items, and doesn't universally special-case "what if a real text input is nested inside me."

## Why the first E2E test run didn't catch it

The original test used Playwright's `locator.fill(value)`:

```ts
await page.getByPlaceholder(/new label/i).fill(LABEL_NAME);
```

`.fill()` sets the DOM element's `value` property directly (via CDP) and dispatches a single synthetic `input` (and `change`) event — it does **not** dispatch a `keydown`/`keyup` per character the way a real user typing would. Since the bug lives entirely in a `keydown` listener, `.fill()` bypasses the exact mechanism that's broken. The test exercised "does the component correctly hold a `newName` state and forward it to `createLabel` when set" — which was true — but never exercised "can a human actually get a character into this field."

## The fix

Two one-line additions in `components/Label/LabelPicker.tsx`, one per affected input:

```tsx
// "New label name" input
<input
  ...
  onKeyDown={(e) => e.stopPropagation()}
/>

// inline "rename" input
<input
  ...
  onKeyDown={(e) => {
    e.stopPropagation();
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") setEditingId(null);
  }}
/>
```

Calling `stopPropagation()` on the input's own (bubble-phase) keydown handler prevents the event from ever reaching the ancestor menu-popup's listener, so base-ui's typeahead code never runs for these keystrokes, and the browser's native text-insertion behavior proceeds normally. This does *not* call `preventDefault()` ourselves, so nothing about the input's own behavior (including IME composition, autofill, etc.) is affected — only the propagation to ancestors is stopped.

## Test fix

`e2e/labels.spec.ts` now uses `locator.pressSequentially(value)` for these two specific fields instead of `.fill()`:

```ts
await page.getByPlaceholder(/new label/i).pressSequentially(LABEL_NAME);
...
await page.getByPlaceholder("Label name", { exact: true }).pressSequentially(RENAMED_LABEL_NAME);
```

`pressSequentially` dispatches real `keydown`/`keypress`/`keyup`/`input` events character-by-character, the same way a physical keyboard would, so it exercises the exact code path that was broken.

Verified the regression test actually catches the bug: temporarily reverted the `stopPropagation()` fix, re-ran the test, confirmed it failed with a 30s timeout waiting for "Create label" to become enabled (the button stayed disabled because `newName` state never updated). Restored the fix, confirmed green.

## Open questions / things to dig into tomorrow

- **Scope of the risk**: are there other places in the codebase that nest a plain `<input>`/`<textarea>` inside a `DropdownMenuContent` (or any other base-ui composite widget — `Select`, `Combobox`, `AriaCombobox` also use `useTypeahead` per `grep`)? Worth an audit — `grep -rn "DropdownMenuContent" components/` to enumerate all current usages and check each for nested form controls.
- **Is `stopPropagation()` the right long-term fix, or a patch?** An alternative used by some codebases: check `event.target` inside a wrapper before forwarding to typeahead (not something we control since it's inside `node_modules`), or use base-ui's documented escape hatch if one exists for "this child is an interactive form control, don't typeahead-intercept it" (worth checking base-ui's docs/changelog — version in use is whatever's pinned in `package.json` for `@base-ui/react`).
- **Does this affect other keyboard interactions inside the popover**, e.g. arrow-key list navigation stealing focus away from the input while typing (typeahead is one hook among several — `useListNavigation` also binds keydown for arrow keys, which `stopPropagation()` on our input also neutralizes, which is what we want, but worth confirming arrow-key nav still works correctly for the *non-input* label rows in the same popover).
- **Should this pattern become a lint rule or shared test note?** e.g. a project convention: "any input rendered inside `DropdownMenuContent` must include `onKeyDown={(e) => e.stopPropagation()}`, and its E2E test must use `pressSequentially` not `fill()`."
