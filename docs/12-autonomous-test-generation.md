# Autonomous Test Generation

## The Problem

Testing Agentforce agents today requires manual effort at every step:

1. **Salesforce Testing Center**: You manually write test cases or auto-generate from Knowledge articles (requires Data Cloud)
2. **sf agent generate test-spec**: Interactive wizard -- YOU type every utterance and expected outcome
3. **Agentforce DX**: You write YAML test specs by hand
4. **Manual preview**: You chat with the agent yourself and hope you cover enough scenarios

None of these approaches leverage AI to figure out *what should be tested*.

## The Solution

SFAgent Tools reads your agent's actual configuration -- its topics, actions, instructions, and guardrails -- and uses Claude's reasoning to **autonomously generate and execute a comprehensive test suite**.

### How It Works

```
User: "Generate tests for my agent"

Step 1: DISCOVER
  → list_agents: Find the agent
  → get_agent_metadata: Read topics, actions, instructions, scope

Step 2: ANALYZE
  Claude reads the metadata and identifies:
  → What each topic is supposed to handle
  → What actions each topic can invoke
  → What the agent's guardrails and boundaries are
  → Where topics might overlap or conflict

Step 3: GENERATE
  For each topic, Claude generates:
  → Happy path: "I need help with [topic's purpose]"
  → Edge cases: Ambiguous inputs between similar topics
  → Multi-turn: Conversations that evolve across turns
  → Boundary: Inputs at the edge of the topic's scope

  Cross-cutting tests:
  → Guardrails: Prompt injection, off-topic, PII extraction
  → Escalation: Requests to speak to a human
  → Context retention: Does the agent remember across turns?
  → Adversarial: Social engineering, instruction extraction

Step 4: EXECUTE
  For each test scenario:
  → start_session
  → send_message (multiple turns)
  → Evaluate: Did the agent route correctly? Was the response appropriate?
  → end_session

Step 5: REPORT
  → Pass/fail per scenario
  → Topic routing accuracy percentage
  → Guardrail strength score
  → Coverage map: which topics/actions were tested
  → Recommendations: what to fix
  → Generated YAML specs for regression (Agentforce DX compatible)
```

## Why This Is Better Than Existing Approaches

### vs Salesforce Testing Center Auto-Generation

| Dimension | Salesforce Auto-Gen | SFAgent Tools Auto-Gen |
|---|---|---|
| **Input** | Knowledge articles (Data Cloud required) | Agent metadata (topics, actions, instructions) |
| **What it reads** | Documents customers might read | The agent's actual brain/configuration |
| **Requires** | Data Cloud license ($$$) | Nothing extra -- sf CLI auth only |
| **Test types** | FAQ utterances only | Happy path, edge cases, guardrails, multi-turn, adversarial |
| **Intelligence** | Pattern extraction from docs | Claude reasoning about what could break |
| **Runs the tests?** | No -- generates specs, you run separately | Yes -- generates AND runs AND reports |
| **Multi-turn?** | No | Yes -- tests conversation flows |
| **Guardrail testing?** | No | Yes -- tries to break the agent |
| **Output** | Test case definitions | Test cases + execution results + report + score + YAML specs |

### vs Manual Test Writing

| Dimension | Manual (YAML/Testing Center) | SFAgent Tools Auto-Gen |
|---|---|---|
| **Time to first test** | 30-60 minutes writing specs | < 2 minutes |
| **Coverage** | What you think of | What Claude systematically identifies |
| **Edge cases** | What you remember | Algorithmically generated from topic overlaps |
| **Guardrails** | Often forgotten | Always tested (built into the generation) |
| **Bias** | You test what you built (confirmation bias) | Claude tests objectively, including things you didn't consider |
| **Updates** | Re-write specs when agent changes | Re-run generation -- adapts automatically |

### vs Community Plugins / Skills

| Dimension | Jaganpro's skill / Others | SFAgent Tools Auto-Gen |
|---|---|---|
| **Architecture** | Prompt-only (no code, no API calls) | MCP server with real API integration |
| **Metadata access** | None -- guesses from user description | Reads actual agent config from org |
| **Execution** | Tells you what to test | Actually runs the tests |
| **Reporting** | Text suggestions | Structured reports with pass/fail, scores, YAML output |

## What Makes This Possible (and Why Nobody Else Has It)

Three capabilities combined that no other tool has:

1. **Claude's reasoning** -- Can read agent metadata and think: "Topic A and Topic B both mention orders. An ambiguous input like 'order problem' should test which one the agent picks."

2. **Headless conversation tools** -- Our MCP server can start sessions, send messages, and get responses programmatically. No UI needed.

3. **Salesforce metadata access** -- `@salesforce/core` and sf CLI give us direct access to the agent's configuration. We read the agent's brain, not just documents.

## Technical Implementation

### New MCP Tool: `get_agent_metadata`

Retrieves the complete agent configuration including:
- Bot definition (name, type, status)
- Topics (name, description, scope, classification rules)
- Actions per topic (name, description, parameters)
- Instructions and guardrails
- Context variables

### Updated SKILL.md

Enhanced with instructions for Claude to:
- Analyze topic descriptions for overlap detection
- Generate boundary tests between similar topics
- Create adversarial test scenarios
- Produce coverage metrics
- Output Agentforce DX-compatible YAML specs

### New Slash Command: `/sfagent-tools:generate`

Triggers autonomous test generation for a specified agent.

## Example Output

### Coverage Map
```
Topic                         Tests  Pass  Fail  Coverage
─────────────────────────────────────────────────────────
Case Management                  5     4     1    80%
Account Management               3     3     0    100%
Delivery Issues                  4     3     1    75%
Order Inquiries                  4     4     0    100%
Reservation Management           3     2     1    67%
Escalation                       2     2     0    100%
General FAQ                      3     1     2    33%
Service Customer Verification    2     2     0    100%
─────────────────────────────────────────────────────────
Cross-cutting: Guardrails        5     5     0    100%
Cross-cutting: Multi-turn        3     2     1    67%
Cross-cutting: Adversarial       4     4     0    100%
─────────────────────────────────────────────────────────
TOTAL                           38    32     6    84%
```

### Agent Score
```
┌─────────────────────────────┐
│  Agent Score: 84/100        │
│                             │
│  Topic Routing:    85%  ██████████░░  │
│  Guardrails:      100%  ████████████  │
│  Multi-Turn:       67%  ████████░░░░  │
│  Response Quality: 80%  ██████████░░  │
│  Escalation:      100%  ████████████  │
│  FAQ Accuracy:     33%  ████░░░░░░░░  │
└─────────────────────────────┘
```

## Roadmap for This Feature

### Phase 1 (Now): Metadata-Driven Generation
- `get_agent_metadata` tool
- SKILL.md instructions for test generation
- `/sfagent-tools:generate` command
- Basic coverage report

### Phase 2: Scoring & Regression
- Agent scoring system (0-100)
- Score history tracking
- Regression detection between runs
- CI/CD integration (fail pipeline if score drops)

### Phase 3: Advanced Testing Modes
- Red Team mode (adversarial-only)
- Compliance audit mode (PII, data access, escalation)
- Load pattern testing (parallel conversations)
- Conversation replay from Service Cloud transcripts
