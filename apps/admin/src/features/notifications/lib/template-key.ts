import { getLocale } from '@repo/i18n';

import type {
	NotificationChannel,
	NotificationTemplate,
} from '../api/notifications.queries';

/**
 * The stable identity of a template row in the merged list: `(code, channel,
 * locale)`. Used for selection instead of `id` because a `SYSTEM` default has no
 * `id` — and because it survives a customization (editing a default `POST`s a
 * `TENANT` row for the *same* slot, so the same key keeps the same row selected
 * after the list refetches).
 */
export function templateKey(
	template: Pick<NotificationTemplate, 'code' | 'channel' | 'locale'>,
): string {
	return `${template.code}::${template.channel}::${template.locale}`;
}

/** A rule's `(templateCode, channels)` — enough to resolve which row it sends. */
export interface TemplateFocusRequest {
	code: string;
	channels: NotificationChannel[];
}

/**
 * The best-match row for a rule's trigger click: prefers a channel the rule
 * actually sends on, breaking ties toward the current UI locale. Returns
 * `null` when nothing in `templates` matches the code — e.g. the rule is
 * paused and no other active rule shares its template, so it never made it
 * into the Templates tab's (active-only) visible set — letting the caller
 * fall back to its own default selection instead of selecting nothing.
 */
export function resolveTemplateKey(
	templates: Pick<NotificationTemplate, 'code' | 'channel' | 'locale'>[],
	code: string,
	channels: NotificationChannel[],
): string | null {
	const matches = templates.filter((t) => t.code === code);
	if (matches.length === 0) return null;

	const locale = getLocale();
	for (const channel of channels) {
		const match =
			matches.find((t) => t.channel === channel && t.locale === locale) ??
			matches.find((t) => t.channel === channel);
		if (match) return templateKey(match);
	}
	return templateKey(matches[0]);
}
