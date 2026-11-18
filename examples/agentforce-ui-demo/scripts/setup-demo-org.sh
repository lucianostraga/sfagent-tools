#!/usr/bin/env bash
# Creates the demo scratch org: an employee agent whose action renders Custom Lightning Types
# (a form and a result card), plus the native Agentforce test for the same scenario.
#
# Usage: scripts/setup-demo-org.sh [alias]     (default alias: sfagent-demo)
# Needs a default Dev Hub with Agentforce scratch org features (sf config set target-dev-hub <alias>).
# In a firewalled dev container, allow the new org's domains when the script prints them.
set -euo pipefail
cd "$(dirname "$0")/.."
ALIAS="${1:-sfagent-demo}"

sf org create scratch -f config/project-scratch-def.json -a "$ALIAS" -d -y 30 --wait 15
echo "New org: $(sf org display -o "$ALIAS" --json | node -e 'process.stdin.on("data",d=>console.log(JSON.parse(d).result.instanceUrl))')"

sf org assign permset -o "$ALIAS" -n EinsteinGPTPromptTemplateManager -n AgentPlatformBuilder -n CopilotSalesforceAdmin

# 1. Everything the agent needs, before publishing it.
sf project deploy start -o "$ALIAS" --wait 20 \
  --source-dir force-app/main/default/classes \
  --source-dir force-app/main/default/genAiFunctions \
  --source-dir force-app/main/default/lightningTypes \
  --source-dir force-app/main/default/lwc \
  --source-dir force-app/main/default/aiAuthoringBundles

# 2. Publish and activate. Right after the org is created the agent API may not know it yet
#    (404, then a confusing "fetch failed"), so retry for a few minutes.
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if sf agent publish authoring-bundle -o "$ALIAS" --api-name CustomLightningTypes; then break; fi
  [ "$attempt" = 10 ] && { echo "Publish kept failing" >&2; exit 1; }
  echo "Publish failed (attempt $attempt); retrying in 60 s..."; sleep 60
done
sf agent activate -o "$ALIAS" --api-name CustomLightningTypes

# 3. Access to the agent for the admin user, and the native tests (both need the published agent).
sf project deploy start -o "$ALIAS" --wait 20 \
  --source-dir force-app/main/default/permissionsets \
  --source-dir force-app/main/default/aiTestingDefinitions
sf org assign permset -o "$ALIAS" -n CustomLightningTypes_Access

echo "Done. Native test: sf agent test run --api-name Case_Submission_Topic --wait 20"
echo "      UI test:     npm install && npx playwright test"
