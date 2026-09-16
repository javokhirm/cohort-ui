import { FullStory, init, isInitialized } from '@fullstory/browser';

import type { AuthUserSummary } from '@/lib/auth/types';

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
 * Ties the current FullStory session to the signed-in teacher. No-ops until
 * FullStory has booted. Unlike the admin console, this surface's `AuthResult`
 * carries no tenant object and no boot profile fetch (no `/teach/me`) — the
 * login/refresh `user` summary is the only identity ever available to identify
 * against.
 */
export function identify(user: AuthUserSummary): void {
	if (!isInitialized()) return;
	FullStory('setIdentity', {
		uid: String(user.id),
		properties: {
			displayName: `${user.firstName} ${user.lastName}`,
			role: user.roles.join(','),
		},
	});
}

/** Detaches the current FullStory session from any identified user. No-ops until FullStory has booted. */
export function clearIdentity(): void {
	if (!isInitialized()) return;
	FullStory('setIdentity', { anonymous: true });
}
