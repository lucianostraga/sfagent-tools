Generate or regenerate a test report from the most recent test session.

Look for test session data (transcripts, results) in the current project directory. If found, generate a comprehensive markdown report including:

1. **Executive Summary** — Overall pass/fail, key findings
2. **Test Coverage** — Which topics/actions were tested
3. **Conversation Transcripts** — Each test conversation with annotations
4. **Issues Found** — Categorized by severity (critical, warning, info)
5. **Recommendations** — Specific agent configuration suggestions
6. **Generated Test Specs** — YAML test cases for regression testing (Agentforce DX format)

Save the report in the user's current working directory under `sfagent-reports/`. This keeps reports in the user's project, not inside the plugin directory. Create the directory if it doesn't exist.
