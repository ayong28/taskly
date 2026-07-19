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

**It must always be launched with this repo's root as its working
directory** — the default SQLite DB path resolution in `packages/core/db.ts`
is relative to `process.cwd()`, not to the script's own location.

Every snippet below uses `/path/to/taskly` as a stand-in for
wherever you cloned this repo — **replace it with your actual absolute path
before using the snippet.** This isn't just a style choice: for Codex CLI and
Gemini CLI/Antigravity specifically, a *relative* path or `cwd` value
resolves against wherever the client process itself happens to be launched
from (a terminal session, an IDE extension host, a background daemon —
whatever started Codex/Gemini, not this repo), not against the project or
the config file's own directory. That's confirmed by both tools' own
behavior (Gemini CLI's `mcp-client.ts` passes `cwd` straight into
`child_process.spawn` with no resolution against the settings file's
location) and multiple open bug reports about exactly this kind of path
breaking under IDE integrations. A real absolute path is the only value
guaranteed to work regardless of how/where the client was started.

## Claude Code (this repo's `.mcp.json`)

Already registered — nothing to do, and no placeholder to fill in here. For
reference, the entry lives in [`../../.mcp.json`](../../.mcp.json):

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

This one *can* safely use a relative path with no `cwd` at all, because
Claude Code always runs with this repo's root as its own working directory
when it's operating on this repo — unlike the other clients below, there's
no "launched from somewhere else" scenario to worry about.

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
        "/path/to/taskly/packages/mcp-server/index.ts"
      ]
    }
  }
}
```

## OpenAI Codex CLI

File: `~/.codex/config.toml` (global) or `.codex/config.toml`
(project-scoped — requires the project be marked trusted first, either via
an interactive prompt on first use or a manual `trust_level = "trusted"`
entry under `projects."/path/to/taskly"` in `~/.codex/config.toml`).
TOML, not JSON — and it does support a native `cwd` key:

```toml
[mcp_servers.taskly]
command = "npx"
args = ["-y", "tsx", "packages/mcp-server/index.ts"]
cwd = "/path/to/taskly"
```

Or via the CLI directly:

```bash
codex mcp add taskly --cwd /path/to/taskly -- npx -y tsx packages/mcp-server/index.ts
```

## Gemini CLI / Google Antigravity

Gemini CLI: `.gemini/settings.json` (project — requires trusting the folder
first, via the interactive prompt on first launch from it, saved to
`~/.gemini/trustedFolders.json`) or `~/.gemini/settings.json` (user).
Antigravity (Google's separate agentic IDE, not the same product as the
Gemini CLI terminal tool) shares the same `mcpServers` JSON shape, edited via
its "Manage MCP Servers → View raw config" UI or directly at
`~/.gemini/config/mcp_config.json`. Both support a native `cwd` field:

```json
{
  "mcpServers": {
    "taskly": {
      "command": "npx",
      "args": ["-y", "tsx", "packages/mcp-server/index.ts"],
      "cwd": "/path/to/taskly"
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
    - cd /path/to/taskly && npx tsx packages/mcp-server/index.ts
    timeout: 120
```

## After registering

Most clients require a restart (or an explicit reload/trust step — e.g.
Claude Code prompts to trust a project's `.mcp.json` on first use) to pick up
a new or changed MCP server entry.
