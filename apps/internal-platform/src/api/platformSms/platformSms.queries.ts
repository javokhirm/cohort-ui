import { superAdminApi } from '@/api/apiClient';

import type {
	PlatformDefaultTemplate,
	PlatformSmsBalance,
	PlatformSmsStatus,
	PlatformTemplateModeration,
} from './types';

export function getPlatformSmsStatus(): Promise<PlatformSmsStatus> {
	return superAdminApi.get<PlatformSmsStatus>('/notification-settings/sms');
}

/** 400s (`NOTIFICATION_CHANNEL_NOT_CONFIGURED`) when the platform account isn't set up. */
export function getPlatformSmsBalance(): Promise<PlatformSmsBalance> {
	return superAdminApi.get<PlatformSmsBalance>('/notification-settings/sms/balance');
}

/** The code-owned SMS defaults — read-only; they change only in the backend codebase. */
export function listPlatformDefaultTemplates(): Promise<PlatformDefaultTemplate[]> {
	return superAdminApi.get<PlatformDefaultTemplate[]>(
		'/notification-templates/defaults',
	);
}

/** `[]` when the platform account isn't configured — nothing has been submitted. */
export function listPlatformTemplateModeration(): Promise<PlatformTemplateModeration[]> {
	return superAdminApi.get<PlatformTemplateModeration[]>(
		'/notification-templates/moderation',
	);
}
