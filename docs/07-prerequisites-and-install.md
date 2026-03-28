# Prerequisites and Installation

The plugin is designed to be plug-and-play. If you're a Salesforce developer with Agentforce, you likely already have everything you need.

---

## What the User Needs (Before Installing the Plugin)

### On their machine (already there for any SF developer)

| Prerequisite | Minimum Version | Check Command |
|---|---|---|
| **Node.js** | >= 20.0.0 | `node --version` |
| **Salesforce CLI** (`sf`) | v2.x (any recent) | `sf --version` |
| **At least one authenticated org** | -- | `sf org list` |

### In their Salesforce org (standard Agentforce setup)

| Prerequisite | Where | Notes |
|---|---|---|
| **Einstein enabled** | Setup > Einstein Setup | One-time toggle |
| **Agentforce enabled** | Setup > Agentforce | One-time toggle |
| **Custom agent created and activated** | Setup > Agentforce Agents | Must be "custom" type, NOT "Agentforce (Default)" |
| **Org edition** | -- | Enterprise, Unlimited, or free Developer Edition |
| **Sandbox recommended** | -- | Tests can modify data and consume Flex Credits |

### What the user does NOT need

- No External Client App (ECA) setup
- No OAuth client ID/secret
- No environment variables
- No Salesforce DX MCP Server
- No `.mcp.json` editing
- No additional npm packages
- No Connected App creation
- No Named Credentials

---

## Installation

```bash
# One command
claude plugin install sfagent-tools
```

That's it. The plugin bundles its own MCP server that starts automatically.

---

## First Run Experience

When the user runs `/sfagent-tools:test-run` for the first time:

1. **Claude calls `list_orgs`** -- discovers all sf CLI authenticated orgs
2. **Claude asks the user** which org to target (or uses the default target org)
3. **Claude calls `list_agents`** -- discovers available agents in that org
4. **Claude asks the user** which agent to test (or picks the one specified in test plan)
5. **Testing begins** -- no config files needed

If something is missing, Claude provides helpful guidance:

| Missing thing | What Claude says |
|---|---|
| No authenticated orgs | "No orgs found. Run `sf org login web --alias my-sandbox` to authenticate." |
| No agents found | "No agents found in this org. Is Agentforce enabled? Do you have an activated custom agent?" |
| Agent API fails | "The Agent API requires a custom agent type (not 'Agentforce Default'). Check your agent type in Setup." |
| Token expired | Handled automatically by `@salesforce/core` -- user never sees this |

---

## How Authentication Works (Transparent to User)

```
                   Plugin runtime
                        │
                        ▼
              ┌─────────────────────┐
              │  @salesforce/core   │
              │  Org.create(alias)  │
              │  org.refreshAuth()  │
              └──────────┬──────────┘
                         │ reads encrypted files
                         ▼
              ┌─────────────────────┐
              │  ~/.sf/ + ~/.sfdx/  │  ← Created by: sf org login web
              │  AES-256-GCM        │
              │  encrypted tokens   │
              └─────────────────────┘
```

- Plugin never sees raw credentials
- Token refresh is automatic
- No secrets in any config file
- Auth store was created by the user's normal `sf org login web` flow

---

## Optional: Advanced Authentication (ECA)

For users who need `bypassUser: true` (run tests as the agent's configured user instead of the developer's user), a separate External Client App setup is needed. This is documented but NOT required for normal use.

See [04-security-model.md](04-security-model.md) for the ECA setup steps.

---

## Compatibility

| Tool | Relationship |
|---|---|
| **Salesforce DX MCP Server** | Independent. Both can run simultaneously. No conflict, no dependency. |
| **Agentforce Vibes** | Complementary. Vibes builds; our plugin tests behavior. |
| **sf agent test / sf agent preview** | Our plugin wraps these commands. User can also run them directly. |
| **Testing Center UI** | Same backend APIs. Tests created via our plugin appear in Testing Center too. |
