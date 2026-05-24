import { z } from 'zod';
import { getOrgConnection } from '../auth/sf-auth.js';

export const getAgentMetadataSchema = z.object({
  targetOrg: z.string().describe('Org alias or username'),
  agentApiName: z.string().describe('API name of the agent (from list_agents)'),
});

interface SubagentRecord {
  Id: string;
  DeveloperName: string;
  MasterLabel: string;
  Description: string | null;
}

interface ActionRecord {
  Id: string;
  DeveloperName: string;
  MasterLabel: string;
  Description: string | null;
}

interface QueryResult<T> {
  records: Array<T & { attributes: { type: string; url: string } }>;
}

export async function getAgentMetadata(args: z.infer<typeof getAgentMetadataSchema>) {
  const { accessToken, instanceUrl } = await getOrgConnection(args.targetOrg);

  const apiVersion = 'v63.0';
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1. Get the planner (agent definition)
  const plannerQuery = encodeURIComponent(
    `SELECT Id, DeveloperName, MasterLabel FROM GenAiPlannerDefinition WHERE DeveloperName = '${args.agentApiName}'`
  );
  const plannerResp = await fetch(`${instanceUrl}/services/data/${apiVersion}/query/?q=${plannerQuery}`, { headers });
  const plannerData = (await plannerResp.json()) as QueryResult<{ Id: string; DeveloperName: string; MasterLabel: string }>;

  if (!plannerData.records?.length) {
    return {
      content: [{
        type: 'text' as const,
        text: `No agent planner found with API name "${args.agentApiName}". Check the agent exists and is activated.`,
      }],
    };
  }

  const planner = plannerData.records[0];

  // 2. Get all subagents (GenAiPluginDefinition — called "topics" in pre-Apr-2026 Agent Script)
  const subagentsQuery = encodeURIComponent(
    'SELECT Id, DeveloperName, MasterLabel, Description FROM GenAiPluginDefinition ORDER BY MasterLabel'
  );
  const subagentsResp = await fetch(`${instanceUrl}/services/data/${apiVersion}/query/?q=${subagentsQuery}`, { headers });
  const subagentsData = (await subagentsResp.json()) as QueryResult<SubagentRecord>;
  const subagents = subagentsData.records ?? [];

  // 3. Get all actions (GenAiFunctionDefinition)
  const actionsQuery = encodeURIComponent(
    'SELECT Id, DeveloperName, MasterLabel, Description FROM GenAiFunctionDefinition ORDER BY MasterLabel'
  );
  const actionsResp = await fetch(`${instanceUrl}/services/data/${apiVersion}/query/?q=${actionsQuery}`, { headers });
  const actionsData = (await actionsResp.json()) as QueryResult<ActionRecord>;
  const allActions = actionsData.records ?? [];

  // 4. Map actions to subagents by matching the suffix in DeveloperName.
  // Action DeveloperName pattern: ActionName_SubagentId15 (e.g., "AddCaseComment_179DR00000000pp")
  // Subagent IDs are 18 chars but the suffix in action names uses the 15-char version.
  const subagentMap = subagents.map((subagent) => {
    const subagentId15 = subagent.Id.slice(0, 15);
    const subagentActions = allActions
      .filter((action) => action.DeveloperName.endsWith(subagentId15))
      .map((action) => ({
        name: action.MasterLabel,
        apiName: action.DeveloperName,
        description: action.Description,
      }));

    return {
      name: subagent.MasterLabel,
      apiName: subagent.DeveloperName,
      description: subagent.Description,
      actions: subagentActions,
    };
  });

  // 5. Find unassigned actions (linked to planner, not a subagent)
  const assignedActionIds = new Set(subagentMap.flatMap((s) => s.actions.map((a) => a.apiName)));
  const unassignedActions = allActions
    .filter((a) => !assignedActionIds.has(a.DeveloperName))
    .map((a) => ({
      name: a.MasterLabel,
      apiName: a.DeveloperName,
      description: a.Description,
    }));

  const metadata = {
    agent: {
      name: planner.MasterLabel,
      apiName: planner.DeveloperName,
      id: planner.Id,
    },
    subagents: subagentMap,
    unassignedActions,
    summary: {
      totalSubagents: subagentMap.length,
      totalActions: allActions.length,
      subagentsWithActions: subagentMap.filter((s) => s.actions.length > 0).length,
    },
  };

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify(metadata, null, 2),
    }],
  };
}
