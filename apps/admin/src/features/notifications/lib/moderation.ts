import type { StatusTone } from '@repo/ui';

import type {
	NotificationTemplate,
	TemplateModeration,
	TemplateModerationStatus,
} from '../api/notifications.queries';

/**
 * Joining a template row to its SMS gateway moderation state.
 *
 * Uzbek gateways deliver only pre-approved copy, so a saved template is not yet a
 * sendable one — it is sendable once a moderator clears it. The backend submits
 * every body on save and reports the verdict per **message text**, keyed by the
 * exact Cohort body it submitted (`sourceBody`). That is the join: a template's
 * `body` is the same string the backend sent, so an exact match is both correct
 * and the only thing the contract guarantees.
 *
 * Two consequences worth knowing:
 *
 *  - **The state belongs to the text, not the row.** Two centers with identical
 *    copy on the shared platform account share one moderation decision, which is
 *    exactly why the backend does not key it by template id.
 *  - **A miss means "unknown", never "pending".** An edited-but-unsaved body, a
 *    center with no SMS credentials (the endpoint returns `[]`), or a non-SMS
 *    channel all land here. Showing a status we do not have would be worse than
 *    showing none.
 */

/** Only SMS is moderated; nothing else has a gateway that reviews copy. */
export function isModeratedChannel(channel: string): boolean {
	return channel === 'SMS';
}

/** Index the moderation list by the body it was submitted from. */
export function indexModeration(
	rows: TemplateModeration[] | undefined,
): Map<string, TemplateModeration> {
	return new Map((rows ?? []).map((row) => [row.sourceBody, row]));
}

/**
 * The moderation state for one template, or `undefined` when it is unknown or
 * does not apply. `body` overrides the template's stored copy so the editor can
 * ask about a draft the user is still typing.
 */
export function moderationFor(
	index: Map<string, TemplateModeration>,
	template: Pick<NotificationTemplate, 'channel' | 'body'>,
	body?: string,
): TemplateModeration | undefined {
	if (!isModeratedChannel(template.channel)) return undefined;
	return index.get(body ?? template.body);
}

/**
 * Pill tone per status. `REJECTED` is the only red one: it is the only state the
 * center has to *act* on, because resubmitting identical text earns the identical
 * refusal. `PENDING` is amber rather than red — Cohort has not reached the
 * gateway yet, which is usually transient and retries on the next save.
 */
export const MODERATION_TONES: Record<TemplateModerationStatus, StatusTone> = {
	PENDING: 'amber',
	MODERATION: 'blue',
	APPROVED: 'green',
	REJECTED: 'red',
};

/**
 * Whether this state is worth flagging in the master list.
 *
 * Approved is the steady state — for a center whose templates all cleared weeks
 * ago, marking every row would be forty badges saying "fine". The list therefore
 * surfaces only what blocks sending, and the editor shows the full state for the
 * one row in hand.
 */
export function needsAttention(
	moderation: TemplateModeration | undefined,
): moderation is BlockingModeration {
	return moderation !== undefined && moderation.status !== 'APPROVED';
}

/** A moderation state that currently blocks sending — everything but `APPROVED`. */
export type BlockingModeration = TemplateModeration & {
	status: Exclude<TemplateModerationStatus, 'APPROVED'>;
};
