# Security Model

This document defines the security constraints, threat model, and mitigation strategies for the SFAgent Tools.

---

## Core Security Principles

1. **Zero credential storage.** The plugin never stores, handles, or transports raw credentials (tokens, secrets, passwords).
2. **Delegate auth to SF CLI.** All authentication is handled by `@salesforce/core`, which manages encrypted token storage and refresh.
3. **Least privilege.** Document and enforce minimum required permissions.
4. **Sandbox awareness.** Agent tests can modify data and consume API credits -- warn users prominently.
5. **Input validation.** All MCP tool inputs validated with Zod schemas before processing.

---

## What the Plugin Stores

### Allowed in config files
- Org aliases/usernames (e.g., `my-sandbox`)
- Agent IDs (18-character Salesforce IDs)
- File paths to test specs
- Feature flags and preferences
- Test report output paths

### Never stored anywhere
- Access tokens or refresh tokens
- Client IDs or client secrets
- Passwords or security tokens
- OAuth callback URLs with tokens
- Any content from `~/.sfdx/` directory

---

## Authentication Flow

```
User runs: sf org login web --alias my-sandbox
  └── Browser-based OAuth (MFA/SSO compatible)
  └── Token encrypted and stored by @salesforce/core in ~/.sfdx/

Plugin needs to call Salesforce:
  └── Org.create({ aliasOrUsername: 'my-sandbox' })
  └── org.refreshAuth()  // handles expired tokens
  └── conn.getConnection()  // provides accessToken + instanceUrl
  └── Plugin makes API call with token
  └── Token is NEVER logged, stored in plugin config, or persisted
```

The plugin is never in the auth flow. It consumes already-authenticated orgs.

---

## Threat Model

| Threat | Mitigation |
|---|---|
| **Credential leakage via config** | Config only stores org aliases, never secrets. Enforced by code review and Zod validation. |
| **Token logging** | Access tokens never appear in any log output. Debug logging redacts Authorization headers. |
| **Man-in-the-middle** | All Salesforce API calls use TLS 1.2+ (enforced by Salesforce). |
| **Excessive permissions** | Document minimum OAuth scopes. Plugin uses only `api`, `chatbot_api`, `sfap_api`, `refresh_token`. |
| **Data modification in production** | Prominent sandbox-only warnings. Plugin should detect org type and warn if production. |
| **MCP tool injection** | All inputs validated with Zod schemas. Agent IDs validated as 18-character Salesforce IDs. |
| **Credential store compromise** | Not our responsibility -- `@salesforce/core` handles encryption. Document that `~/.sfdx/key.json` should be protected. |
| **Plugin supply chain** | Minimal dependency tree. Only `@modelcontextprotocol/sdk`, `@salesforce/core`, and `zod`. |

---

## Sandbox Detection

The plugin should check the org type and warn users:

```typescript
const org = await Org.create({ aliasOrUsername: targetOrg });
const orgInfo = await org.getOrgInfo();
// Check if sandbox
if (orgInfo.isSandbox === false) {
  // Emit prominent warning: "You are targeting a PRODUCTION org.
  // Agent tests can modify data and consume API credits.
  // Salesforce recommends running agent tests in sandboxes only."
}
```

---

## Distribution Security

### For Claude Code Marketplace
- No Salesforce security review required (not an AppExchange package)
- No managed package -- runs entirely on the developer's local machine
- Users must have their own sf CLI auth configured
- Plugin source is open for audit (Apache 2.0 license)

### .gitignore requirements
```
.sfdx/
node_modules/
*.env
*.key
credentials.*
```

### Environment variables
- The plugin does NOT require any environment variables for credentials
- `MAX_MCP_OUTPUT_TOKENS` may be set by users for large transcripts (optional, Claude Code setting)
- No secrets should ever appear in `.mcp.json` `env` block

---

## External Client App (ECA) -- Advanced Path

For users who need the full Agent API Client Credentials flow (e.g., `bypassUser: true`), the plugin documents but does NOT automate ECA setup:

1. User creates ECA in Salesforce Setup
2. User configures OAuth scopes: `api`, `chatbot_api`, `sfap_api`, `refresh_token`
3. User enables Client Credentials flow
4. User authenticates the ECA via sf CLI (`sf org login web` with the connected app)
5. Plugin consumes the authenticated org as usual

The plugin never sees or handles the Client ID/Secret. The ECA setup is a one-time org admin task.

---

## Compliance Notes

| Standard | Status |
|---|---|
| OWASP Top 10 | No injection vectors (no SQL, no user-controlled command execution) |
| Salesforce Secure Coding Guide | Followed -- no credential storage, TLS enforced, least privilege |
| Claude Code Plugin Guidelines | Zero secrets in config, minimal permissions, input validation |
| GDPR/Data Privacy | Plugin does not store personal data. Test transcripts are local files. |
