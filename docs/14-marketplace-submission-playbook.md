# Community Marketplace Submission Playbook

> Written 2026-05-26 after a painful round of submission issues. Read this BEFORE submitting or resubmitting to the Anthropic `claude-community` marketplace.

## TL;DR — if you need to resubmit

1. Make sure **`main` is the structure you want reviewed** (the root `.claude-plugin/marketplace.json` must exist and point at `./packages/claude-code-plugin`).
2. Run locally first: `claude plugin validate . --strict` → must pass.
3. Submit at https://claude.ai/settings/plugins/submit (or platform.claude.com/plugins/submit).
4. **"Link to plugin" field:** use the **deep link to the subdirectory**, not the bare repo URL:
   ```
   https://github.com/lucianostraga/sfagent-tools/tree/main/packages/claude-code-plugin
   ```
5. **"Plugin name" field:** lowercase `sfagent-tools` (must match the live community slug — NOT the display name "SFAgent Tools").
6. After submitting, monitor with the catalog check (below). Expect 24-48h.

---

## What went wrong (root causes)

### 1. Force-push created a divergent history → auto-bump is dead
At the start of the v0.2/v1.0 work we canonicalized on the local timeline and force-pushed over origin. The originally-published commit (`097f5f8`) is now an **orphan** — it has **no common ancestor** with `main` (only reachable via the `archive/origin-pre-rewrite-2026-05-23` tag).

The community marketplace's CI "bumps the pin automatically as you push new commits." That mechanism walks commits forward from the pinned SHA — but there's no path from `097f5f8` to `main`. **So the live entry will never auto-advance to v1.0.0.** Only a fresh review can move it.

> Lesson: a force-push that orphans the previously-published commit breaks marketplace auto-update. If we'd rebased/merged instead of force-pushing unrelated history, auto-bump would have kept working.

### 2. Monorepo move broke the bare-repo-URL submission
v0.1 had the plugin at the **repo root**, so the original submission's bare repo URL (`github.com/lucianostraga/sfagent-tools`) resolved correctly. After the monorepo restructure, the plugin moved to `packages/claude-code-plugin/` — the bare URL now points at a root with no plugin manifest.

> Lesson (and a mistake we made): when asked whether the restructure was "safe for the submission," the answer assumed the submission form had a separate "path within repo" field. It does NOT — it's a single "Link to plugin" URL field. So the subdirectory was never communicated. **Verify the actual submission mechanism before assuming a structural change is safe.**

### 3. Plugin-name vs display-name mismatch
The published entries showed "SFAgent Tools" (the `displayName`) while a resubmission used `sfagent-tools` (the `name`). A reviewer note literally flagged a "Forge plugin_name vs -community slug mismatch." Always submit with the lowercase technical `name`.

---

## The fixes now in place on `main`

- **Root `.claude-plugin/marketplace.json`** lists the plugin with `source: "./packages/claude-code-plugin"`. This makes both a bare-repo-URL submission AND `/plugin marketplace add lucianostraga/sfagent-tools` resolve to the subdir plugin. Verified by fresh-cloning from GitHub and running `claude plugin validate . --strict`.
- This mirrors how 177 other community monorepo plugins work — Anthropic's pipeline reads a root marketplace.json that points to subdirs and generates `git-subdir` catalog entries. So the pattern is fully supported.
- The redundant `packages/claude-code-plugin/.claude-plugin/marketplace.json` was removed; the plugin manifest (`plugin.json`) stays there, root marketplace.json is canonical.

---

## How to check the live catalog state

```bash
curl -s https://raw.githubusercontent.com/anthropics/claude-plugins-community/main/.claude-plugin/marketplace.json \
  | python3 -c "import sys,json; p=[x for x in json.load(sys.stdin)['plugins'] if x['name']=='sfagent-tools'][0]; print(json.dumps(p['source'],indent=2))"
```

| Output | Meaning |
|---|---|
| `git-subdir` + `path: packages/claude-code-plugin` | ✅ v1.0.0 live — success |
| `url` + a recent SHA (not `097f5f8`) | ✅ updated |
| `url` + `097f5f8` (still) | ⏳ stale v0.1 — pending review hasn't landed the fix; resubmit after 48h |

---

## Exact submission values (copy-paste)

| Field | Value |
|---|---|
| Link to plugin | `https://github.com/lucianostraga/sfagent-tools/tree/main/packages/claude-code-plugin` |
| Plugin homepage | `https://github.com/lucianostraga/sfagent-tools` |
| Plugin name | `sfagent-tools` (lowercase — matches the slug) |
| Plugin description | from `packages/claude-code-plugin/.claude-plugin/plugin.json` |
| Supported platforms | Claude Code (only — Codex/Vibes are MCP-config, not Claude plugins) |
| License | `Apache-2.0` |
| Email | lucianostraga@gmail.com |

---

## Two marketplaces, don't confuse them

- **`claude-plugins-official`** — curated by Anthropic, no application process, the submission form does NOT add here. Out of our control.
- **`claude-community`** — open submissions via the form. This is the one we're in (live, old v0.1) and updating (pending v1.0.0).

## Status as of 2026-05-26
- Published + LIVE in `claude-community`, pinned to the orphaned `097f5f8` (v0.1, plugin-at-root).
- A May 23 submission is pending; the root marketplace.json fix (May 26) should let a fresh review resolve v1.0.0.
- Auto-bump will NOT save us (divergent history) — a fresh review is required to advance the pin.
