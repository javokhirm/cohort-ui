import type { useAppT } from '@/locales';

import type { NotificationRule, NotificationTrigger } from '../api/notifications.queries';

type NotificationsT = ReturnType<typeof useAppT<'notifications'>>;

/**
 * A rule's offset as a human phrase, anchor-agnostic: "3 days before" / "On the
 * day" / "3 days after". Deliberately generic (no "due date") — the same offset
 * ladder hangs off invoice dates, lesson starts and more, and the group header
 * already names the anchor. Doubles as the create-form preview of a scheduled
 * rule's label.
 */
export function offsetTiming(
	offsetDays: number | null | undefined,
	tn: NotificationsT,
): string {
	if (offsetDays == null || offsetDays === 0) return tn('rules.timingOn');
	if (offsetDays < 0) return tn('rules.timingBefore', { days: Math.abs(offsetDays) });
	return tn('rules.timingAfter', { days: offsetDays });
}

/**
 * The label shown for a rule in the list — a rule has no stored name, so it is
 * derived entirely from the event and offset, and therefore always in the current
 * language. Scheduled rules show their timing (the group header carries the
 * event); event rules show the event label, falling back to the raw trigger code
 * only while the catalog is still loading.
 */
export function ruleDisplayLabel(
	rule: NotificationRule,
	trigger: NotificationTrigger | undefined,
	tn: NotificationsT,
): string {
	const scheduled = trigger ? trigger.kind === 'SCHEDULED' : rule.offsetDays != null;
	if (scheduled) return offsetTiming(rule.offsetDays, tn);
	return trigger?.label ?? rule.trigger;
}
