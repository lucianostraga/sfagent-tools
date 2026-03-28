#!/bin/bash
# End-to-end test: multi-turn conversation via MCP server
# This sends multiple JSON-RPC requests to the MCP server in a single session

cd "$(dirname "$0")/.."

echo "=== SFAgent Tools - End-to-End Conversation Test ==="
echo ""

# Build the sequence of JSON-RPC messages
cat <<'JSONRPC' | timeout 180 node dist/index.js 2>/dev/null | while IFS= read -r line; do
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"notifications/initialized","params":{}}
{"jsonrpc":"2.0","id":10,"method":"tools/call","params":{"name":"start_session","arguments":{"targetOrg":"sfagent-dev","agentApiName":"Agentforce_Service_Agent"}}}
JSONRPC

  # Parse each response
  id=$(echo "$line" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)

  case "$id" in
    10)
      echo "--- START SESSION ---"
      echo "$line" | python3 -c "import sys,json; d=json.load(sys.stdin); content=json.loads(d['result']['content'][0]['text']); print(f\"Session ID: {content['sessionId']}\"); print(f\"Status: {content['status']}\")" 2>/dev/null
      echo ""
      ;;
  esac
done

echo "=== Test Complete ==="
