# Development Environment

## Scratch Org Strategy

Use your devhub to create scratch orgs for plugin development and testing. Scratch orgs are disposable, isolated, and free (uses devhub entitlements).

---

## Why Scratch Orgs (Not Sandboxes)

| Factor | Scratch Org | Developer Sandbox |
|---|---|---|
| **Cost** | Free (devhub entitlements) | Free (from production) |
| **Spin-up time** | ~1-2 minutes | ~5-30 minutes |
| **Disposable** | Yes -- delete and recreate anytime | Yes but slower to refresh |
| **Agentforce support** | Yes (via org definition features) | Yes |
| **Agent API support** | Yes | Yes |
| **Testing API support** | Yes | Yes |
| **Isolation** | Complete -- no shared data | Depends on sandbox type |
| **Reproducible** | Yes -- org definition file defines features | Manual setup each time |
| **Ideal for** | Plugin development, CI/CD, testing | Longer-lived dev work |

Scratch orgs are the Salesforce DX standard for development. They fit perfectly with plugin development because:
- You can define exactly what features are enabled (Einstein, Agentforce) in a config file
- You can create and destroy them freely during development
- Each test run gets a clean environment
- The org definition file is committed to the repo (reproducible)

---

## Scratch Org Definition

File: `config/project-scratch-def.json` (in the sfagent-tools repo)

```json
{
  "orgName": "SFAgent Tools Dev",
  "edition": "Developer",
  "features": [
    "EinsteinGPTForDevelopers",
    "AgentForce"
  ],
  "settings": {
    "einsteinSettings": {
      "enableEinsteinGPT": true
    }
  }
}
```

> **Note**: The exact feature names and settings may need validation against current Salesforce scratch org feature availability. Agentforce scratch org support was added in recent releases. Verify with `sf org create scratch --help` and the [Scratch Org Features Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_scratch_orgs_def_file_config_values.htm).

---

## Scratch Org Workflow

### One-time setup (devhub already authenticated)

```bash
# Verify your devhub is authenticated
sf org list

# Set as default devhub if not already
sf config set target-dev-hub your-devhub-alias
```

### Per-development-session

```bash
# Create a scratch org (expires in 7 days by default)
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias sfagent-dev \
  --duration-days 7 \
  --set-default

# Open the org to set up a test agent manually (first time)
sf org open --target-org sfagent-dev

# In Setup:
#   1. Verify Einstein is enabled
#   2. Create a custom Agentforce agent
#   3. Configure topics and actions
#   4. Activate the agent

# Now test the plugin against this org
claude --plugin-dir ./
/sfagent-tools:test
```

### Cleanup

```bash
# Delete when done
sf org delete scratch --target-org sfagent-dev --no-prompt
```

---

## Agent Setup Automation (Future)

For faster iteration, we could create scripts or metadata to auto-deploy a sample agent:

```
config/
├── project-scratch-def.json           # Org definition
└── sample-agent/                      # Deployable agent metadata (future)
    ├── bots/
    ├── genAiPlugins/
    └── genAiFunctions/
```

This would allow:
```bash
# Create scratch org + deploy sample agent in one step
sf org create scratch -f config/project-scratch-def.json -a sfagent-dev
sf project deploy start --source-dir config/sample-agent --target-org sfagent-dev
```

This is a Phase 2 improvement. For MVP, manual agent setup in the scratch org is fine.

---

## Org Types That Work for End Users

Document this in the plugin README for end users:

| Org Type | Works? | Notes |
|---|---|---|
| **Scratch org** | Yes | Best for development. Use devhub entitlements. |
| **Developer sandbox** | Yes | Common for developers. |
| **Developer Pro sandbox** | Yes | More storage than Developer. |
| **Partial Copy sandbox** | Yes | Good for integration testing with data. |
| **Full Copy sandbox** | Yes | Best for UAT/staging. |
| **Free Developer Edition** | Yes | Includes Agentforce since March 2025. Free, no expiry. |
| **Production** | **No** | Tests modify data and consume Flex Credits. Plugin will warn. |

---

## Development Tools

| Tool | Purpose |
|---|---|
| **SF CLI** (`sf`) | Org management, scratch org creation, agent commands |
| **Node.js >= 20** | MCP server runtime |
| **TypeScript** | MCP server source language |
| **Claude Code** | Plugin host + development assistant |
| **VS Code** (optional) | Code editing alongside Claude Code |

---

## Environment Variables (Development Only)

These are for plugin development, NOT for end users:

```bash
# Optional: increase MCP output token limit for testing large transcripts
export MAX_MCP_OUTPUT_TOKENS=50000

# Optional: enable debug logging in the MCP server
export SFAGENT_DEBUG=true
```

No environment variables are required for normal plugin operation.
