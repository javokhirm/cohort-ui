import type { NotificationTemplate } from '../api/notifications.queries';

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

/** A rule's template code — seeds the Templates tab's search bar on arrival. */
export interface TemplateFocusRequest {
	code: string;
}
