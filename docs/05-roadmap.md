# Build Roadmap

## Phase 1 -- MVP (Validate the Concept)

**Goal**: A working plugin that can have headless conversations with an Agentforce agent and produce a test report.

### Deliverables
- [ ] Plugin scaffold (`.claude-plugin/plugin.json`, directory structure)
- [ ] MCP server with 5 core tools: `list_orgs`, `start_session`, `send_message`, `end_session`, `run_batch_test`
- [ ] Auth module using `@salesforce/core`
- [ ] Agent API client (SSE consumer, synchronous return)
- [ ] SKILL.md that teaches Claude how to orchestrate test conversations
- [ ] `/sfagent-tools:test-run` slash command
- [ ] Basic markdown report generation
- [ ] README with installation instructions

### What "working" means
User can:
1. Install the plugin
2. Point it at an authenticated sandbox org
3. Describe what to test in natural language or provide a YAML spec
4. Claude has multi-turn conversations with the agent
5. Claude produces a report with findings

### Technical stack
- TypeScript, MCP SDK (`@modelcontextprotocol/sdk`), `@salesforce/core`, Zod
- stdio transport
- No external services, no database, no cloud dependencies

---

## Phase 2 -- Intelligence Layer

**Goal**: Claude doesn't just test -- it analyzes, suggests fixes, and generates regression specs.

### Deliverables
- [ ] `get_test_results` tool for batch test result analysis
- [ ] `list_agents` tool for agent discovery
- [ ] Test assertion logic (topic routing accuracy, action sequence validation)
- [ ] Auto-generation of `AiEvaluationDefinition` YAML specs from exploratory findings
- [ ] `/sfagent-tools:test-explore` slash command (open-ended exploratory testing)
- [ ] `/sfagent-tools:test-report` slash command (regenerate reports)
- [ ] Failure analysis with suggested agent configuration fixes
- [ ] Query agent metadata (topics, actions, instructions) for smarter test generation

### What "working" means
User can:
1. Run exploratory tests where Claude adapts its questioning based on agent responses
2. Get actionable suggestions ("Topic X is misconfigured because...")
3. Auto-generate YAML test specs from discovered issues
4. Run those specs as formal regression tests

---

## Phase 3 -- Polish and Distribution

**Goal**: Production-quality plugin ready for Claude Code Marketplace.

### Deliverables
- [ ] MCP `notifications/progress` for status updates during long operations
- [ ] JUnit and TAP output format support for CI/CD integration
- [ ] Comprehensive error handling and user-friendly error messages
- [ ] Sandbox detection with production org warnings
- [ ] Test report templates (summary, detailed, CI-friendly)
- [ ] Plugin marketplace listing (description, screenshots, docs)
- [ ] End-to-end test suite for the plugin itself
- [ ] Performance optimization (connection pooling, response caching)

### What "working" means
- Plugin is installable from Claude Code Marketplace
- Works reliably across different org configurations
- Produces reports suitable for stakeholder review
- Integrates cleanly with CI/CD pipelines

---

## Phase 4 -- Enterprise Features (Future)

**Goal**: Features for teams and enterprise adoption.

### Potential deliverables
- [ ] MCP channels for real-time streaming conversation progress
- [ ] Multi-agent testing (test interactions between agents)
- [ ] Test coverage metrics (which topics/actions are tested)
- [ ] Historical trend analysis (compare test results over time)
- [ ] Team-shared test plans and report templates
- [ ] Custom assertion plugins (user-defined evaluation criteria)

---

## Decision Log

| Decision | Date | Rationale |
|---|---|---|
| Start with Agent API, not just sf CLI wrapping | 2026-03-28 | Agent API enables true interactive testing; CLI only does batch |
| TypeScript for MCP server | 2026-03-28 | Matches SF ecosystem, enables @salesforce/core direct usage |
| 7 tools max | 2026-03-28 | Salesforce recommends ~20 max; lean is better for LLM comprehension |
| No custom test format | 2026-03-28 | Agentforce DX YAML + natural language covers all use cases |
| SF CLI auth delegation | 2026-03-28 | Security, simplicity, precedent from @salesforce/mcp |
| Apache 2.0 license | 2026-03-28 | Matches Salesforce DX MCP Server license |
