/**
 * Domain types for the platform's own (shared/default) Eskiz SMS account —
 * `/super-admin/notification-settings/sms*` and `/super-admin/notification-templates/*`
 * (api-reference.md §3.18, Super Admin subsection).
 *
 * This is deliberately **not** the tenant channel-settings shape a center sees
 * under `/manage` (`@repo/api-client` doesn't cover this either — see
 * `apps/admin/src/features/notifications/api/notifications.queries.ts` for that
 * shape). There is exactly one account here, it is never tenant-scoped, and it
 * has no on/off switch, daily cap or credential-source concept — a tenant either
 * resolves to it by having no account of its own, or does not use it at all.
 */

export interface PlatformSmsStatus {
	/** Adapter key the platform account resolves through, e.g. `eskiz`. */
	provider: string;
	senderName: string | null;
	/** Whether `ESKIZ_SMS_LOGIN`/`ESKIZ_SMS_PASSWORD` are set on the backend. */
	configured: boolean;
}

export interface PlatformSmsBalance {
	provider: string;
	/** `null` when the provider exposes no balance endpoint or is unreachable. */
	amount: number | null;
	currency: string | null;
}

export interface PlatformSmsTestResult {
	success: boolean;
	providerMessageId: string | null;
	/** Localized failure reason when `success` is `false`. */
	error: string | null;
}

/** Code-owned SMS default, in the same read shape a tenant's template list uses. */
export interface PlatformDefaultTemplate {
	id: null;
	code: string;
	channel: 'SMS';
	locale: string;
	subject: string | null;
	body: string;
	isActive: true;
	source: 'SYSTEM';
	isCustomized: false;
	createdAt: null;
	updatedAt: null;
}

export const PLATFORM_TEMPLATE_MODERATION_STATUSES = [
	'PENDING',
	'MODERATION',
	'APPROVED',
	'REJECTED',
] as const;
export type PlatformTemplateModerationStatus =
	(typeof PLATFORM_TEMPLATE_MODERATION_STATUSES)[number];

/** One submitted text's standing with the gateway, on the platform account. */
export interface PlatformTemplateModeration {
	/** The Cohort body, `{{placeholders}}` intact — joins to a default by this. */
	sourceBody: string;
	templateText: string;
	status: PlatformTemplateModerationStatus;
	providerRef: string | null;
	submittedAt: string | null;
	lastCheckedAt: string | null;
	error: string | null;
	defaults: { code: string; locale: string }[];
}

export interface PlatformModerationSyncResult {
	submitted: number;
	matched: number;
	skipped: number;
	failed: number;
}
