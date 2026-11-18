# Changelog

## 2.0.0 (2026-11-18)

From prompt to pixel: the plugin now tests what an Agentforce agent renders, not only what it decides.

### Added
- `agentforce-ui-test` skill: Claude Code finds the Custom Lightning Type forms and cards an agent renders, writes
  Playwright tests for them with the bundled kit (one-time frontdoor login, Agentforce panel page object, config),
  runs them, and pairs each with a native test for the same utterance.
- `examples/agentforce-ui-demo`: a reproducible scratch org with an employee agent that renders a form and a card, a
  native test and a Playwright test. With a broken card, the native test passes and the Playwright test fails.
- `start_session`: preview local authoring bundles (`authoringBundle`, simulated actions by default, `liveActions` to
  opt in) and typed `contextVariables`.
- `send_message`: `rendersUi` when the agent asks for input through a CLT editor that a headless session cannot show.
- `run_batch_test` / `get_test_results`: Agentforce Studio tests (`AiTestingDefinition`) with an optional `testRunner`,
  run states normalized across runners, and per-scorer results.
- `generate_test_spec`: writes the Agentforce Studio format by default (`format: run-eval` keeps the old Beta YAML).
- Unit tests for the server (`npm test` in `packages/server`).

### Fixed
- The Salesforce CLI is called without a shell: org aliases, agent names, session ids and utterances can no longer be
  interpreted by a shell.
- `send_message` kept only `Inform` replies, so an agent that asks a question (`Inquire`) looked silent.
- `run_batch_test` compared the status with `"Completed"`, which neither runner returns.
- The production guard trusted local auth metadata and blocked Developer Edition orgs. It now asks the org
  (`IsSandbox`, `OrganizationType`) and fails closed.
- The MCP server reported version 0.2.0; it now reads its version from `package.json`.

### Changed
- Requires Node.js 22+ and Salesforce CLI 2.152+.
- Removed the IDE's `.sfdx` cache and `.bak` files from the repository.
