import { AuthInfo, Org } from '@salesforce/core';
import type { SfOrg } from '../types/index.js';

export async function listAuthenticatedOrgs(): Promise<SfOrg[]> {
  const authorizations = await AuthInfo.listAllAuthorizations();

  return authorizations
    .filter((auth) => auth.username)
    .map((auth) => ({
      alias: auth.aliases?.[0] ?? '',
      username: auth.username ?? '',
      orgId: auth.orgId ?? '',
      instanceUrl: auth.instanceUrl ?? '',
      connectedStatus: auth.error ? `Error: ${auth.error}` : (auth.isExpired === true ? 'Expired' : 'Connected'),
      isSandbox: auth.isSandbox ?? false,
      isScratch: auth.isScratchOrg ?? false,
      isDevHub: auth.isDevHub ?? false,
    }));
}

export async function getOrgConnection(aliasOrUsername: string) {
  const org = await Org.create({ aliasOrUsername });
  await org.refreshAuth();
  const conn = org.getConnection();

  return {
    accessToken: conn.accessToken as string,
    instanceUrl: conn.instanceUrl as string,
    orgId: org.getOrgId(),
  };
}

// Blocks production. Asks the org itself instead of trusting local auth metadata, and fails closed: if the org
// type cannot be verified, it is treated as production. Allowed: sandboxes (scratch orgs report IsSandbox = true)
// and Developer Edition orgs.
export function isProductionOrgType(record: { IsSandbox?: boolean; OrganizationType?: string } | undefined): boolean {
  if (!record) return true;
  if (record.IsSandbox === true) return false;
  return record.OrganizationType !== 'Developer Edition';
}

export async function isProductionOrg(aliasOrUsername: string): Promise<boolean> {
  try {
    const org = await Org.create({ aliasOrUsername });
    const result = await org
      .getConnection()
      .query<{ IsSandbox: boolean; OrganizationType: string }>('SELECT IsSandbox, OrganizationType FROM Organization');
    return isProductionOrgType(result.records[0]);
  } catch {
    return true;
  }
}
