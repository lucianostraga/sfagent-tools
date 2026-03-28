import { z } from 'zod';
import { getOrgConnection } from '../auth/sf-auth.js';

export const getAgentMetadataSchema = z.object({
  targetOrg: z.string().describe('Org alias or username'),
  agentApiName: z.string().describe('API name of the agent (from list_agents)'),
});

interface TopicRecord {
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

  // 2. Get all topics (GenAiPluginDefinition)
  const topicsQuery = encodeURIComponent(
    'SELECT Id, DeveloperName, MasterLabel, Description FROM GenAiPluginDefinition ORDER BY MasterLabel'
  );
  const topicsResp = await fetch(`${instanceUrl}/services/data/${apiVersion}/query/?q=${topicsQuery}`, { headers });
  const topicsData = (await topicsResp.json()) as QueryResult<TopicRecord>;
  const topics = topicsData.records ?? [];

  // 3. Get all actions (GenAiFunctionDefinition)
  const actionsQuery = encodeURIComponent(
    'SELECT Id, DeveloperName, MasterLabel, Description FROM GenAiFunctionDefinition ORDER BY MasterLabel'
  );
  const actionsResp = await fetch(`${instanceUrl}/services/data/${apiVersion}/query/?q=${actionsQuery}`, { headers });
  const actionsData = (await actionsResp.json()) as QueryResult<ActionRecord>;
  const allActions = actionsData.records ?? [];

  // 4. Map actions to topics by matching the suffix in DeveloperName
  // Action DeveloperName pattern: ActionName_TopicId15 (e.g., "AddCaseComment_179DR00000000pp")
  // Topic IDs are 18 chars but the suffix in action names uses the 15-char version
  const topicMap = topics.map((topic) => {
    const topicId15 = topic.Id.slice(0, 15);
    const topicActions = allActions
      .filter((action) => action.DeveloperName.endsWith(topicId15))
      .map((action) => ({
        name: action.MasterLabel,
        apiName: action.DeveloperName,
        description: action.Description,
      }));

    return {
      name: topic.MasterLabel,
      apiName: topic.DeveloperName,
      description: topic.Description,
      actions: topicActions,
    };
  });

  // 5. Find unassigned actions (linked to planner, not a topic)
  const assignedActionIds = new Set(topicMap.flatMap((t) => t.actions.map((a) => a.apiName)));
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
    topics: topicMap,
    unassignedActions,
    summary: {
      totalTopics: topicMap.length,
      totalActions: allActions.length,
      topicsWithActions: topicMap.filter((t) => t.actions.length > 0).length,
    },
  };

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify(metadata, null, 2),
    }],
  };
}
