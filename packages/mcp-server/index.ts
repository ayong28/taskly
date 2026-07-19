import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listBoards, listCardsForBoard, getCard } from "@taskly/core/queries";
import {
  createCardCore,
  updateCardCore,
  deleteCardCore,
  archiveCardCore,
  restoreCardCore,
  moveCardCore,
} from "@taskly/core/cards";
import { listListsForBoard } from "@taskly/core/queries";

const server = new McpServer({ name: "taskly", version: "0.1.0" });

server.registerTool(
  "list_boards",
  {
    title: "List boards",
    description: "List all Taskly boards (id, title, archived state).",
    inputSchema: {},
  },
  async () => ({
    content: [{ type: "text", text: JSON.stringify(await listBoards(), null, 2) }],
  })
);

server.registerTool(
  "list_lists",
  {
    title: "List a board's lists",
    description: "List the columns/lists on a given board, including their ids.",
    inputSchema: { boardId: z.number().int() },
  },
  async ({ boardId }) => ({
    content: [{ type: "text", text: JSON.stringify(await listListsForBoard(boardId), null, 2) }],
  })
);

server.registerTool(
  "list_cards",
  {
    title: "List a board's cards",
    description:
      "List every task/card on a board, including which list it's in and whether it's archived.",
    inputSchema: { boardId: z.number().int() },
  },
  async ({ boardId }) => ({
    content: [{ type: "text", text: JSON.stringify(await listCardsForBoard(boardId), null, 2) }],
  })
);

server.registerTool(
  "get_card",
  {
    title: "Get a single card",
    description: "Fetch one task/card by id.",
    inputSchema: { cardId: z.number().int() },
  },
  async ({ cardId }) => {
    const card = await getCard(cardId);
    if (!card) return { content: [{ type: "text", text: `No card with id ${cardId}` }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(card, null, 2) }] };
  }
);

server.registerTool(
  "create_card",
  {
    title: "Create a task",
    description: "Create a new task/card in a list. Use list_lists to find a listId first.",
    inputSchema: {
      listId: z.number().int(),
      title: z.string().min(1),
      description: z.string().optional(),
      dueDate: z.string().optional().describe("ISO date string, e.g. 2026-08-01"),
    },
  },
  async ({ listId, title, description, dueDate }) => {
    const card = await createCardCore(listId, title, { description, dueDate });
    return { content: [{ type: "text", text: JSON.stringify(card, null, 2) }] };
  }
);

server.registerTool(
  "update_card",
  {
    title: "Edit a task",
    description: "Update a task/card's title, description, and/or due date.",
    inputSchema: {
      cardId: z.number().int(),
      title: z.string().min(1),
      description: z.string().optional(),
      dueDate: z.string().optional(),
    },
  },
  async ({ cardId, title, description, dueDate }) => {
    await updateCardCore(cardId, { title, description, dueDate });
    return { content: [{ type: "text", text: `Updated card ${cardId}.` }] };
  }
);

server.registerTool(
  "move_card",
  {
    title: "Move a task to another list",
    description: "Move a task/card to a different list on the same board (appends to the end).",
    inputSchema: { cardId: z.number().int(), listId: z.number().int() },
  },
  async ({ cardId, listId }) => {
    await moveCardCore(cardId, listId);
    return { content: [{ type: "text", text: `Moved card ${cardId} to list ${listId}.` }] };
  }
);

server.registerTool(
  "archive_card",
  {
    title: "Archive a task",
    description:
      "Soft-delete a task by moving it into the board's Archived list. Restorable via restore_card.",
    inputSchema: { cardId: z.number().int(), boardId: z.number().int() },
  },
  async ({ cardId, boardId }) => {
    await archiveCardCore(cardId, boardId);
    return { content: [{ type: "text", text: `Archived card ${cardId}.` }] };
  }
);

server.registerTool(
  "restore_card",
  {
    title: "Restore an archived task",
    description: "Restore a previously archived task back to its original list (or a Restored list).",
    inputSchema: { cardId: z.number().int(), boardId: z.number().int() },
  },
  async ({ cardId, boardId }) => {
    await restoreCardCore(cardId, boardId);
    return { content: [{ type: "text", text: `Restored card ${cardId}.` }] };
  }
);

server.registerTool(
  "delete_card",
  {
    title: "Permanently delete a task",
    description:
      "Hard-delete a task/card. Irreversible — the app's UI only allows this once a card is already archived; this tool does not enforce that, so confirm intent before calling it on an active (non-archived) card.",
    inputSchema: { cardId: z.number().int() },
  },
  async ({ cardId }) => {
    await deleteCardCore(cardId);
    return { content: [{ type: "text", text: `Deleted card ${cardId}.` }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Taskly MCP server failed to start:", error);
  process.exit(1);
});
