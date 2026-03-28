Run a test plan against an Agentforce agent.

If a test plan file path is provided as an argument, read it first. If no file is provided, ask the user what they want to test.

Steps:
1. Use `mcp__sfagent-tools__list_orgs` to discover available orgs
2. Ask the user which org to target (or use the default)
3. Use `mcp__sfagent-tools__list_agents` to find available agents
4. Ask the user which agent to test (or use the one in the test plan)
5. Start a session with `mcp__sfagent-tools__start_session`
6. Execute the test conversations using `mcp__sfagent-tools__send_message`
7. End the session with `mcp__sfagent-tools__end_session`
8. Generate a test report as a markdown file in the project

If a YAML test spec (Agentforce DX format) is provided, execute each test case as a conversation and validate the expected topic, actions, and outcome.

If natural language instructions are provided, interpret them and design appropriate test conversations.

Always warn the user if the target org appears to be a production org.
