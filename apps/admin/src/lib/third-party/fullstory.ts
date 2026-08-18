import { FullStory, init, isInitialized } from '@fullstory/browser';

import type { TenantSummary } from '@/lib/auth/types';

const FULLSTORY_ORG_ID = 'o-25177W-na1';

/** Boots the FullStory session recorder. Call once at app startup. */
export function initFullStory(): void {
	init({ orgId: FULLSTORY_ORG_ID });
}

/** Records a custom FullStory analytics event. No-ops until FullStory has booted. */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
	if (!isInitialized()) return;
	FullStory('trackEvent', { name, properties: properties ?? {} });
}

/**
 * Ties the current FullStory session to the signed-in user. No-ops until FullStory has
 * booted. Callable more than once per session (e.g. once at login, again after
 * `/manage/me` resolves permissions) — each call merges into the same identity.
 */
export function identify(
	user: {
		id: number;
		firstName: string;
		lastName: string;
		roles: string[];
		email?: string | null;
	},
	tenant: TenantSummary,
): void {
	if (!isInitialized()) return;
	FullStory('setIdentity', {
		uid: String(user.id),
		properties: {
			displayName: `${user.firstName} ${user.lastName}`,
			role: user.roles.join(','),
			tenantId: tenant.id,
			tenantName: tenant.name,
			...(user.email ? { email: user.email } : {}),
		},
	});
}

/** Detaches the current FullStory session from any identified user. No-ops until FullStory has booted. */
export function clearIdentity(): void {
	if (!isInitialized()) return;
	FullStory('setIdentity', { anonymous: true });
}
