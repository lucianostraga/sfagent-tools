# Agentforce UI demo: from prompt to pixel

An employee agent whose action renders **Custom Lightning Types**: a form to file a support case and a card
with the result. Two tests cover the same scenario:

| Test | What it checks | Sees the form and the card? |
| --- | --- | --- |
| `specs/case-submission-topic.ngt.yaml` (native, `AiTestingDefinition`) | The agent routes to `case_submission` | No. The testing channel reports `__supports_result_display__: false` |
| `tests/ui/case-submission.spec.ts` (Playwright) | The form renders, can be filled and submitted, and the card shows the case number | Yes |

Break the card (for example, read `number` instead of `caseNumber` in `caseResultRenderer.js`) and deploy it:
the native test still passes, the Playwright test fails.

The agent, its Apex class, Lightning types and LWCs come from Salesforce's
[agent-script-recipes](https://github.com/trailheadapps/agent-script-recipes) (Custom Lightning Types recipe, Apache-2.0).

## Run it

```bash
scripts/setup-demo-org.sh                                   # scratch org + agent + native test
sf agent test run --api-name Case_Submission_Topic --wait 20   # native
npm install && npx playwright test                          # UI, headless
```

The UI test logs in with a fresh `sf org open --url-only` frontdoor URL on every run; the session is never stored.

## Good to know

- Right after creating the scratch org, `sf agent publish` can fail with `fetch failed` for a few minutes; the setup
  script retries.
- The Agentforce panel shows first-run screens and ignores messages until it finishes loading;
  `tests/ui/agentforce-panel.ts` handles both.
- CLI 2.158 writes a JUnit "Unknown error" for passing `agentforce-studio` tests; use `--result-format json`.
