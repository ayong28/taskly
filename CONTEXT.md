# Context: Project Manager App

## Glossary

### User
The single person who owns and uses the app. No authentication required. All data belongs to this one person.

### Board
A top-level container scoped to a single project (e.g. "Website Redesign"). Has a natural end state — boards can be archived when a project is complete. New boards are seeded with a default List template.

### List
A named column within a Board representing a workflow stage. Freeform — the user can rename, reorder, add, or remove lists. New boards default to: To Do / In Progress / Done.

### Card
A discrete unit of work (task) that lives within a List. Has a clear done state. Can be moved between Lists as work progresses.

Fields: Title (required), Description (free text), Due Date, Labels, Priority (high/medium/low).

### Label
A global colour-coded tag reused across all Boards. Defined once by the User and applied to any Card. Examples: "Bug", "Feature", "Urgent".

### Archive
A soft-delete state available on both Boards and Cards. Archived items are hidden from normal views but remain in the database and can be restored. Hard delete is also available for permanent removal.

### Dashboard
The main app layout: a persistent left sidebar listing all active Boards, with the selected Board's content filling the main area. No separate "home" page — the app opens directly into the last active Board.

### Drag and Drop
Supported interactions: reorder Cards within a List, move Cards between Lists, reorder Lists within a Board. Cross-board card moves are handled via a "Move to Board" action in the Card detail, not drag-and-drop.

### Filter
A filter bar within a Board view allowing the User to narrow visible Cards by Label and/or Priority. No global search across Boards.

### Board Background
A solid colour selected from a preset palette (8–12 colours). No gradients or image uploads.

### Due Date
A date field on a Card. Overdue cards display a red badge. No notifications or automatic sorting.
