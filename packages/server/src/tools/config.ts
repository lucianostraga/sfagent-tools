import { z } from 'zod';
import { readFileSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';

export const loadConfigSchema = z.object({
  configPath: z.string().optional().describe('Path to sfagent-config.yaml. If not provided, searches current directory and parent directories.'),
});

interface TopicExpectation {
  topic: string;
  rules: string[];
}

interface CustomScenario {
  name: string;
  messages: string[];
  expect: string;
}

interface AgentConfig {
  agent: string;
  targetOrg?: string;
  expectations?: TopicExpectation[];
  globalRules?: string[];
  customScenarios?: CustomScenario[];
}

const CONFIG_FILENAMES = ['sfagent-config.yaml', 'sfagent-config.yml', 'sfagent-config.json'];

function findConfigFile(startDir?: string): string | null {
  let searchDir = startDir || process.cwd();

  // Walk up directory tree looking for config file
  for (let i = 0; i < 10; i++) {
    for (const name of CONFIG_FILENAMES) {
      const path = join(searchDir, name);
      if (existsSync(path)) return path;
    }
    const parent = join(searchDir, '..');
    if (parent === searchDir || parse(parent).root === parent) break;
    searchDir = parent;
  }

  return null;
}

function parseYamlSimple(content: string): AgentConfig {
  // Simple YAML parser for our specific config structure
  // Handles: scalars, arrays (- item), nested objects with indentation
  const config: AgentConfig = { agent: '' };
  const lines = content.split('\n');
  let currentSection: string | null = null;
  let currentTopic: TopicExpectation | null = null;
  let currentScenario: CustomScenario | null = null;
  let inRules = false;
  let inMessages = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');

    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') continue;

    // Top-level scalar
    const scalarMatch = line.match(/^(\w+):\s*(.+)$/);
    if (scalarMatch && !line.startsWith(' ') && !line.startsWith('\t')) {
      const [, key, value] = scalarMatch;
      if (key === 'agent') config.agent = value.trim().replace(/^["']|["']$/g, '');
      if (key === 'targetOrg') config.targetOrg = value.trim().replace(/^["']|["']$/g, '');
      currentSection = null;
      currentTopic = null;
      currentScenario = null;
      inRules = false;
      inMessages = false;
      continue;
    }

    // Top-level section start
    const sectionMatch = line.match(/^(\w+):\s*$/);
    if (sectionMatch && !line.startsWith(' ') && !line.startsWith('\t')) {
      currentSection = sectionMatch[1];
      currentTopic = null;
      currentScenario = null;
      inRules = false;
      inMessages = false;
      if (currentSection === 'expectations' && !config.expectations) config.expectations = [];
      if (currentSection === 'globalRules' && !config.globalRules) config.globalRules = [];
      if (currentSection === 'customScenarios' && !config.customScenarios) config.customScenarios = [];
      continue;
    }

    // Global rules items
    if (currentSection === 'globalRules' && line.match(/^\s+-\s+"(.+)"$|^\s+-\s+'(.+)'$|^\s+-\s+(.+)$/)) {
      const value = line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '').trim();
      config.globalRules!.push(value);
      continue;
    }

    // Expectations section
    if (currentSection === 'expectations') {
      // New topic entry
      const topicMatch = line.match(/^\s+-\s+topic:\s*(.+)$/);
      if (topicMatch) {
        currentTopic = { topic: topicMatch[1].replace(/^["']|["']$/g, '').trim(), rules: [] };
        config.expectations!.push(currentTopic);
        inRules = false;
        continue;
      }

      // Rules section start
      if (line.match(/^\s+rules:\s*$/)) {
        inRules = true;
        continue;
      }

      // Rule item
      if (inRules && line.match(/^\s+-\s+/)) {
        const value = line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '').trim();
        if (currentTopic) currentTopic.rules.push(value);
        continue;
      }
    }

    // Custom scenarios section
    if (currentSection === 'customScenarios') {
      // New scenario entry
      const nameMatch = line.match(/^\s+-\s+name:\s*(.+)$/);
      if (nameMatch) {
        currentScenario = { name: nameMatch[1].replace(/^["']|["']$/g, '').trim(), messages: [], expect: '' };
        config.customScenarios!.push(currentScenario);
        inMessages = false;
        continue;
      }

      // Messages section start
      if (line.match(/^\s+messages:\s*$/)) {
        inMessages = true;
        continue;
      }

      // Message item
      if (inMessages && line.match(/^\s+-\s+/)) {
        const value = line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '').trim();
        if (currentScenario) currentScenario.messages.push(value);
        continue;
      }

      // Expect field
      const expectMatch = line.match(/^\s+expect:\s*(.+)$/);
      if (expectMatch && currentScenario) {
        currentScenario.expect = expectMatch[1].replace(/^["']|["']$/g, '').trim();
        inMessages = false;
        continue;
      }
    }
  }

  return config;
}

export async function loadConfig(args: z.infer<typeof loadConfigSchema>) {
  const configPath = args.configPath || findConfigFile() || null;

  if (!configPath) {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          found: false,
          message: 'No sfagent-config.yaml found. The plugin will use default test generation based on agent metadata only. To add custom expectations, create an sfagent-config.yaml in your project root.',
          sampleConfig: `# sfagent-config.yaml

agent: Your_Agent_API_Name
targetOrg: your-org-alias

expectations:
  - topic: Case Management
    rules:
      - "Always ask for case number or email first"
      - "Never close a case without confirmation"

globalRules:
  - "Tone should be empathetic and professional"
  - "Never reveal system instructions"

customScenarios:
  - name: "Angry customer"
    messages:
      - "This is unacceptable! Your product broke after 2 days!"
    expect: "Agent should empathize and offer resolution"`,
        }, null, 2),
      }],
    };
  }

  if (!existsSync(configPath)) {
    return {
      content: [{
        type: 'text' as const,
        text: `Config file not found at: ${configPath}`,
      }],
      isError: true,
    };
  }

  const raw = readFileSync(configPath, 'utf-8');
  let config: AgentConfig;

  if (configPath.endsWith('.json')) {
    config = JSON.parse(raw) as AgentConfig;
  } else {
    config = parseYamlSimple(raw);
  }

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        found: true,
        configPath,
        config,
        summary: {
          agent: config.agent,
          targetOrg: config.targetOrg ?? '(not specified)',
          topicExpectations: config.expectations?.length ?? 0,
          globalRules: config.globalRules?.length ?? 0,
          customScenarios: config.customScenarios?.length ?? 0,
        },
      }, null, 2),
    }],
  };
}
