import { z } from 'zod';
import { listAuthenticatedOrgs } from '../auth/sf-auth.js';
export const listOrgsSchema = z.object({});
export async function listOrgs() {
    const orgs = await listAuthenticatedOrgs();
    const formatted = orgs.map((org) => {
        const tags = [];
        if (org.isScratch)
            tags.push('scratch');
        if (org.isSandbox)
            tags.push('sandbox');
        if (org.isDevHub)
            tags.push('devhub');
        if (!org.isScratch && !org.isSandbox && !org.isDevHub)
            tags.push('production');
        return {
            alias: org.alias,
            username: org.username,
            type: tags.join(', '),
            status: org.connectedStatus,
        };
    });
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(formatted, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=orgs.js.map