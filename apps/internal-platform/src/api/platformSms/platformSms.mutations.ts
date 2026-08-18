import { superAdminApi } from '@/api/apiClient';

import type { PlatformModerationSyncResult, PlatformSmsTestResult } from './types';

/** Sends one real message through the platform account. Failures are data, not a 5xx. */
export function testPlatformSms(input: {
	phone: string;
	message?: string;
}): Promise<PlatformSmsTestResult> {
	return superAdminApi.post<PlatformSmsTestResult>(
		'/notification-settings/sms/test',
		input,
	);
}

/** Submits the code-owned SMS defaults the platform account doesn't already hold. */
export function syncPlatformTemplateModeration(): Promise<PlatformModerationSyncResult> {
	return superAdminApi.post<PlatformModerationSyncResult>(
		'/notification-templates/moderation/sync',
	);
}
