# Codex Plugin Assets

Drop the following files here for marketplace presentation:

- `icon.png` — composer icon (recommended 64×64 PNG)
- `icon-small.svg` — small skill icon (32×32 SVG, referenced by `agents/openai.yaml`)
- `icon-large.png` — large skill icon (256×256 PNG, referenced by `agents/openai.yaml`)
- `logo.png` — directory listing logo (recommended 256×256 PNG)
- `screenshot-1.png`, `screenshot-2.png` — usage screenshots for the directory listing

These are referenced by [`packages/codex-plugin/.codex-plugin/plugin.json`](../.codex-plugin/plugin.json) and [`packages/codex-plugin/skills/sfagent-tools/agents/openai.yaml`](../skills/sfagent-tools/agents/openai.yaml).

Until you add real assets, Codex will fall back to default placeholders.
