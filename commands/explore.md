Start an exploratory testing session with an Agentforce agent.

In exploratory mode, you have open-ended conversations with the agent to discover issues, test edge cases, and validate guardrails. You should:

1. Connect to the org and agent (use list_orgs and list_agents to discover)
2. Start with broad, happy-path conversations
3. Then systematically probe:
   - Topic routing accuracy (does the agent pick the right topic?)
   - Guardrail effectiveness (can you make the agent go off-topic?)
   - Edge cases (ambiguous inputs, typos, special characters)
   - Multi-turn coherence (does the agent maintain context?)
   - Error handling (unexpected inputs, empty messages)
4. After exploring, summarize findings and recommend:
   - Specific issues to fix in the agent configuration
   - New formal test cases to add to the regression suite
   - Generate YAML test specs (Agentforce DX format) for discovered issues

Always warn the user if the target org appears to be a production org.
