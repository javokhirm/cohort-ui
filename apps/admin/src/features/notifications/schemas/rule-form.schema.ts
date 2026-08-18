import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import type { useAppT } from '@/locales';

import {
	NOTIFICATION_AUDIENCES,
	NOTIFICATION_CHANNELS,
} from '../api/notifications.queries';

type NotificationsT = ReturnType<typeof useAppT<'notifications'>>;

/** Matches the backend's guard against a fat-fingered offset (`±1 year`). */
const MAX_OFFSET_DAYS = 365;

/**
 * Rule form schema. Mirrors the backend `CreateNotificationRuleDto` /
 * `UpdateNotificationRuleDto` (api-reference §3.18).
 *
 * A factory rather than a module constant because the messages are user-facing: a
 * literal captured at module load would never re-translate when the language
 * changes (conventions.md §7). Callers memoise on the translator.
 *
 * **`offsetDays` is intentionally not conditionally required here.** Whether it
 * applies depends on the selected trigger's `kind`, which comes from the
 * server-served catalog — encoding that in the schema would mean duplicating the
 * catalog in the frontend, exactly what serving it was meant to avoid. The form
 * shows or hides the field based on the catalog and sends `null` when hidden; the
 * backend is the authority and returns a translated 400 if the pairing is wrong.
 */
export function ruleFormSchema(t: Translator<'validation'>, tn: NotificationsT) {
	return z.object({
		trigger: z.string().min(1, t('required')),
		channels: z
			.array(z.enum(NOTIFICATION_CHANNELS))
			.min(1, tn('rules.validation.channelsRequired')),
		audience: z.enum(NOTIFICATION_AUDIENCES),
		offsetDays: z
			.number()
			.int()
			.min(-MAX_OFFSET_DAYS, tn('rules.validation.offsetRange'))
			.max(MAX_OFFSET_DAYS, tn('rules.validation.offsetRange'))
			.nullable()
			.optional(),
		isActive: z.boolean(),
	});
}

export type RuleFormValues = z.infer<ReturnType<typeof ruleFormSchema>>;
