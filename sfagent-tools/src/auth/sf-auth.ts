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

export async function isProductionOrg(aliasOrUsername: string): Promise<boolean> {
  const authorizations = await AuthInfo.listAllAuthorizations();
  const match = authorizations.find(
    (auth) => auth.username === aliasOrUsername || auth.aliases?.includes(aliasOrUsername)
  );

  if (!match) return false;
  return !match.isSandbox && !match.isScratchOrg;
}
