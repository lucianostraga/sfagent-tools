import type { SfOrg } from '../types/index.js';
export declare function listAuthenticatedOrgs(): Promise<SfOrg[]>;
export declare function getOrgConnection(aliasOrUsername: string): Promise<{
    accessToken: string;
    instanceUrl: string;
    orgId: string;
}>;
export declare function isProductionOrg(aliasOrUsername: string): Promise<boolean>;
//# sourceMappingURL=sf-auth.d.ts.map