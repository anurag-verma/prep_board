import type { Application } from '../types/models';

/** Resolves a question's companyId chip to a display name. Applications can
 * be deleted while still referenced by a question's companyIds (a soft
 * reference, per Frontend spec §6) — this never throws, it just degrades. */
export function resolveCompanyName(
  applicationId: string,
  applications: Pick<Application, 'id' | 'company'>[],
): string {
  return applications.find((app) => app.id === applicationId)?.company ?? '(archived)';
}
