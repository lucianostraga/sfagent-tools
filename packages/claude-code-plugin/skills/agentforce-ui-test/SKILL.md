---
name: agentforce-ui-test
description: Use when testing what a Salesforce Agentforce agent shows to users, not only what it decides. Covers Custom Lightning Type (CLT) forms and cards rendered in the Agentforce panel of Lightning Experience, tested end to end with Playwright and paired with native Agentforce tests. Trigger on "test the agent UI", "test the CLT", "Playwright for Agentforce", "the form/card the agent renders", "prompt to pixel", or when a native agent test passes but users report a broken screen.
---

# Agentforce UI testing with Playwright

Native Agentforce tests (`sf agent test`, Testing Center, the Testing API) check what the agent **decides**:
subagent, actions, response, latency. They do not render anything: the testing channel reports
`__supports_result_display__: false`. When an action uses Custom Lightning Types, the user sees an LWC form
(editor) or card (renderer) that only a browser test can verify. This skill adds that layer with Playwright and
pairs it with a native test for the same utterance.

## Guardrails

- **Never run against production.** Check first:
  `sf data query -q "SELECT IsSandbox, OrganizationType FROM Organization" --json`. Continue only for a sandbox,
  a scratch org or a Developer Edition org.
- **Never print, log or store the frontdoor URL** from `sf org open --url-only`: it carries a session id. The kit's
  fixture uses it in memory only. Do not save Playwright `storageState` inside the repo.
- Submitting a CLT form runs the real action (Apex or Flow) and **creates data**. Use test values that are easy to
  find and clean up.
- Assert on structure and data the renderer shows (field values, IDs, labels), **not on the agent's prose**: prose
  is non-deterministic and belongs to native scorers.
- Do not weaken an assertion to make a test pass. If the UI is wrong, report it as a product bug.

## Workflow

### 1. Check the prerequisites

- The agent is **published and active**: `sf data query -q "SELECT DeveloperName, Type FROM BotDefinition"`.
  CLT renderers do not render for draft agents.
- The test user has **agent access** (a permission set with `<agentAccesses>` for the agent) and Apex class access
  for the action. Without it, the agent does not appear in the Agentforce panel.
- Playwright is installed in the project (`npx playwright --version`) and its browser is available. In firewalled
  dev containers, the org's `*.lightning.force.com` and `*.static.lightning.force.com` hosts must be allowed.

### 2. Find what the agent renders

Read the agent's `.agent` file (`aiAuthoringBundles/<Agent>/<Agent>.agent`). For each action:

- An **input** with `complex_data_type_name: "c__<type>"` and `is_user_input: True` renders an **editor** (a form).
- An **output** with `complex_data_type_name: "c__<type>"` and `is_displayable: True` renders a **renderer** (a card).

Map each type to its LWC: `lightningTypes/<type>/lightningDesktopGenAi/editor.json` or `renderer.json` →
`"definition": "c/<lwcName>"`. The DOM tag is `c-` plus the LWC name in kebab case
(`caseResultRenderer` → `c-case-result-renderer`). Read the LWC's HTML and JS to learn the form labels and which
fields the card shows; those become the assertions.

### 3. Pick the utterances

Reuse the utterances of existing native tests (`specs/*.yaml`, `aiTestingDefinitions/`) so both layers cover the
same scenario. If there are none, derive one per subagent from its `description`.

### 4. Add the kit and write the specs

If the project has no `tests/ui/`, copy this skill's `assets/` into the project root:
`assets/playwright.config.ts` and `assets/tests/ui/{fixtures,agentforce-panel}.ts`. Add `@playwright/test` as a dev
dependency, pinned to the Playwright version installed in the environment.

One spec per scenario, using the kit:

```ts
import { test, expect } from './fixtures';

test('<scenario>', async ({ agentforce, page }) => {
  await agentforce.send('<utterance>');

  const form = agentforce.component('c-<editor-tag>');
  await expect(form).toBeVisible();
  await form.getByLabel('<label>').fill('<value>');
  await agentforce.submitForm();

  const card = agentforce.component('c-<renderer-tag>');
  await expect(card).toBeVisible();
  await expect(card).toContainText('<value or pattern the card must show>');
});
```

The panel's **Submit** button is drawn by the panel, outside the editor LWC: use `agentforce.submitForm()`.
Prefer `getByLabel`, `getByRole` and `getByText`; never XPath or Lightning-internal CSS classes.

### 5. Run and read the results

`npx playwright test` (headless). On failure, read in this order: the error message, then
`test-results/<test>/error-context.md`, then the screenshot. Open the trace (`npx playwright show-trace`) only when
those are not enough. Decide whether the test or the product is wrong before changing anything.

### 6. Pair it with a native test

Make sure a native test exists for the same utterance, using the new runner and a structural scorer:

```yaml
name: <Test_Name>
description: <one line; required, it becomes the test's label>
subjectType: AGENT
subjectName: <AgentApiName>
testCases:
  - inputs:
      - utterance: <same utterance>
    scorers:
      - name: topic_sequence_match
        expected: <subagent>
```

`sf agent test create --spec <file> --api-name <Test_Name> --test-runner agentforce-studio`, then
`sf agent test run --api-name <Test_Name> --wait 20 --json` (with `--result-format json` the progress animation
gets mixed into the output). Report both results together:
"native: routed to `<subagent>`; UI: form and card verified" (or which layer failed).

## Known issues (Salesforce CLI 2.158, Playwright 1.64)

- `sf agent test run --result-format junit` can write "Unknown error" for passing `agentforce-studio` tests; read
  `--json` instead (`testScorerResults[].scorerResponse`).
- A native test spec without `description` fails with "Required fields are missing: [MasterLabel]".
- Right after creating a scratch org, `sf agent publish authoring-bundle` can fail with `fetch failed` for a few
  minutes while the agent API learns about the org; retry.
- The panel shows first-run screens (a memory dialog and a disclaimer) and ignores messages until it is ready;
  `agentforce-panel.ts` handles both.

A complete working example (org setup script, agent, native test and UI test) lives in
`examples/agentforce-ui-demo/` of the sfagent-tools repository.
