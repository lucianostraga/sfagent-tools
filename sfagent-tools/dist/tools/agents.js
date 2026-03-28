import { z } from 'zod';
import { getOrgConnection, isProductionOrg } from '../auth/sf-auth.js';
export const listAgentsSchema = z.object({
    targetOrg: z.string().describe('Org alias or username to query for agents'),
});
export async function listAgents(args) {
    const isProd = await isProductionOrg(args.targetOrg);
    if (isProd) {
        return {
            content: [
                {
                    type: 'text',
                    text: '⚠️ WARNING: This is a PRODUCTION org. Agent testing can modify data and consume Flex Credits. Use a sandbox or scratch org instead.',
                },
            ],
        };
    }
    const { accessToken, instanceUrl } = await getOrgConnection(args.targetOrg);
    // Query for Agentforce agents via the BotDefinition sObject
    const query = encodeURIComponent("SELECT Id, DeveloperName, MasterLabel FROM BotDefinition ORDER BY MasterLabel");
    const response = await fetch(`${instanceUrl}/services/data/v63.0/query/?q=${query}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to query agents: ${response.status} - ${errorBody}`);
    }
    const data = (await response.json());
    const agents = data.records.map((r) => ({
        id: r.Id,
        apiName: r.DeveloperName,
        label: r.MasterLabel,
    }));
    if (agents.length === 0) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'No active agents found in this org. Make sure Agentforce is enabled and you have at least one activated custom agent.',
                },
            ],
        };
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(agents, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=agents.js.map