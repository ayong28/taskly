# Registering the Taskly MCP server with an AI agent

`packages/mcp-server/` (`@taskly/mcp-server`) exposes Taskly's boards/lists/
cards as MCP tools (`list_boards`, `list_cards`, `create_card`,
`update_card`, `archive_card`, `restore_card`, `delete_card`, etc. — see
[`../ARCHITECTURE.md`](ARCHITECTURE.md)'s "External/agent access (MCP)"
section for the full tool list and design tradeoffs).

It's a local **stdio** MCP server, launched with:

```
npx tsx packages/mcp-server/index.ts
```

**It must always be launched with this repo's root
(`/Users/adrian/workspace/2026-projects/project-manager-01`) as its working
directory** — the default SQLite DB path resolution in `packages/core/db.ts`
is relative to `process.cwd()`, not to the script's own location. Two of the
clients below (Codex, Gemini CLI/Antigravity) have a native `cwd` config
field; the other two (Claude Desktop, Claude Code) don't, so those configs
below use `${CLAUDE_PROJECT_DIR}`/an absolute path to the script instead —
which is *not* the same as setting the process's cwd, but works here because
`tsx <script-path>` doesn't change `process.cwd()` to the script's directory.

Snippets below are filled in with this repo's actual path — copy them as-is.

## Claude Code (this repo's `.mcp.json`)

Already registered — nothing to do. For reference, the entry lives in
[`../../.mcp.json`](../../.mcp.json):

```json
{
  "mcpServers": {
    "taskly": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-server/index.ts"]
    }
  }
}
```

This only applies when Claude Code is run from inside this repo (its working
directory is already the repo root, so no `cwd`/absolute-path handling is
needed).

## Claude Desktop

File: `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) — no native `cwd` field, so the script path must be absolute:

```json
{
  "mcpServers": {
    "taskly": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/Users/adrian/workspace/2026-projects/project-manager-01/packages/mcp-server/index.ts"
      ]
    }
  }
}
```

## OpenAI Codex CLI

File: `~/.codex/config.toml` (global) or `.codex/config.toml`
(project-scoped). TOML, not JSON — and it does support a native `cwd` key:

```toml
[mcp_servers.taskly]
command = "npx"
args = ["-y", "tsx", "packages/mcp-server/index.ts"]
cwd = "/Users/adrian/workspace/2026-projects/project-manager-01"
```

Or via the CLI directly:

```bash
codex mcp add taskly --cwd /Users/adrian/workspace/2026-projects/project-manager-01 -- npx -y tsx packages/mcp-server/index.ts
```

## Gemini CLI / Google Antigravity

Gemini CLI: `.gemini/settings.json` (project) or `~/.gemini/settings.json`
(user). Antigravity (Google's separate agentic IDE, not the same product as
the Gemini CLI terminal tool) shares the same `mcpServers` JSON shape, edited
via its "Manage MCP Servers → View raw config" UI or directly at
`~/.gemini/config/mcp_config.json`. Both support a native `cwd` field:

```json
{
  "mcpServers": {
    "taskly": {
      "command": "npx",
      "args": ["-y", "tsx", "packages/mcp-server/index.ts"],
      "cwd": "/Users/adrian/workspace/2026-projects/project-manager-01"
    }
  }
}
```

## Hermes agent

File: `~/.hermes/config.yaml`, under `mcp_servers:` — YAML, not JSON. No
native `cwd` field, so the working directory is set explicitly via a shell
wrapper:

```yaml
mcp_servers:
  taskly:
    command: sh
    args:
    - -c
    - cd /Users/adrian/workspace/2026-projects/project-manager-01 && npx tsx packages/mcp-server/index.ts
    timeout: 120
```

(This is the actual config already in use for this project — see
[`../handoff/2026-07-19-mcp-workspace-extraction.md`](handoff/2026-07-19-mcp-workspace-extraction.md).)

## After registering

Most clients require a restart (or an explicit reload/trust step — e.g.
Claude Code prompts to trust a project's `.mcp.json` on first use) to pick up
a new or changed MCP server entry.
