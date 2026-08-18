import { FullStory, init, isInitialized } from '@fullstory/browser';

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
