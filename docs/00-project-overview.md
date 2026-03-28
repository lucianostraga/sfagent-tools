# SFAgent Tools

## Project Overview

**Marketplace Name**: SFAgent Tools
**Package Name**: `sfagent-tools`
**Type**: Claude Code Plugin (MCP server + skills + commands)
**Target**: Claude Code Marketplace
**License**: TBD (Apache 2.0 recommended -- matches Salesforce DX MCP Server)

## One-Line Pitch

> Test your Agentforce agents by having AI conversations with them.

## What It Does

A Claude Code plugin that lets developers test Salesforce Agentforce agents through AI-driven headless conversations. Users drop a test plan, run a command, and Claude has dozens of conversations with the agent -- testing edge cases, validating guardrails, checking topic routing -- then generates a detailed report of what works and what doesn't.

## Why It Exists (The Gap)

| Existing tool | What it does | What it lacks |
|---|---|---|
| Salesforce DX MCP Server (`@salesforce/mcp`) | `run_agent_test` for batch YAML tests | No interactive headless conversations, no ad-hoc testing |
| Community Agentforce MCP servers (3 repos) | Talk to agents via Agent API | Zero test assertions, no pass/fail, no reporting |
| Jaganpro's `sf-ai-agentforce-testing` skill | Claims multi-turn validation | It's a skill/prompt, not a full plugin with MCP server |
| Agentforce Vibes | Code-level testing (Apex, LWC) | Does NOT test agent behavior/conversations |
| Provar, Copado, TestZeus | Enterprise agent testing | Standalone SaaS, not Claude Code integrated |

**The gap**: No tool combines AI-driven exploratory headless conversations + automated test assertions + report generation inside Claude Code.

## Why Claude Code Specifically

1. **Claude is the tester.** A shell script runs predefined inputs. Claude *thinks about what to test*, adapts based on responses, and probes edge cases it discovers during conversation.
2. **Natural language test plans.** Users write "test that the agent handles angry customers returning expired products" -- Claude translates that into actual multi-turn conversations and assertions.
3. **Intelligent reporting.** Claude explains *why* the agent failed, *what configuration might fix it*, and *what additional tests to add*.
4. **Regression generation.** After exploratory testing, Claude converts findings into standard `AiEvaluationDefinition` YAML specs for CI/CD.

## Complementary Positioning

This plugin complements (never replaces) Salesforce's official tools:

| Development Stage | Tool | Responsibility |
|---|---|---|
| Build | Agentforce Vibes | Generate agent code, scaffold topics/actions |
| Unit test | Agentforce Vibes | Apex test classes, code coverage |
| **Behavioral test** | **SFAgent Tools** | Headless conversations, topic routing, response quality |
| **Batch evaluation** | **SFAgent Tools** | Structured test suites via Testing API |
| Deploy | SF CLI / DevOps Center | Deployment pipelines |
