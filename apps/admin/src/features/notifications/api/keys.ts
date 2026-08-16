/**
 * Query keys and list-filter shapes for the communication surface
 * (api-reference.md §3.18).
 *
 * One namespace per resource so a mutation can invalidate exactly the slice it
 * touched: toggling a rule need not refetch the outbox, but sending a broadcast
 * must refetch both the outbox and its stats.
 */

export interface RuleListFilters {
	page?: number;
	limit?: number;
	trigger?: string;
	channel?: string;
	isActive?: boolean;
}

export const notificationRulesKeys = {
	all: ['notification-rules'] as const,

	list: (filters: RuleListFilters) =>
		[...notificationRulesKeys.all, 'list', filters] as const,
	detail: (id: number) => [...notificationRulesKeys.all, 'detail', id] as const,
};

/**
 * The trigger catalog is served from a code-owned constant on the backend, so it
 * only changes on deploy — but it *is* localized, so the key carries the locale
 * and a language switch refetches rather than showing stale labels.
 */
export const notificationTriggersKeys = {
	all: ['notification-triggers'] as const,
	list: (locale: string) => [...notificationTriggersKeys.all, 'list', locale] as const,
};

export interface TemplateListFilters {
	page?: number;
	limit?: number;
	code?: string;
	channel?: string;
	locale?: string;
	isActive?: boolean;
}

export const notificationTemplatesKeys = {
	all: ['notification-templates'] as const,

	list: (filters: TemplateListFilters) =>
		[...notificationTemplatesKeys.all, 'list', filters] as const,
	detail: (id: number) => [...notificationTemplatesKeys.all, 'detail', id] as const,
	/**
	 * SMS gateway moderation state. Nested under `all` on purpose: saving a
	 * template submits its copy for approval, so the existing template mutations
	 * already invalidate this slice without naming it.
	 */
	moderation: () => [...notificationTemplatesKeys.all, 'moderation'] as const,
};

export interface OutboxListFilters {
	page?: number;
	limit?: number;
	status?: string;
	channel?: string;
	ruleId?: number;
	recipientUserId?: number;
	from?: string;
	to?: string;
}

export const notificationOutboxKeys = {
	all: ['notifications'] as const,

	list: (filters: OutboxListFilters) =>
		[...notificationOutboxKeys.all, 'list', filters] as const,
	detail: (id: number) => [...notificationOutboxKeys.all, 'detail', id] as const,
	stats: (range: { from?: string; to?: string }) =>
		[...notificationOutboxKeys.all, 'stats', range] as const,
};

export const notificationSettingsKeys = {
	all: ['notification-settings'] as const,

	list: () => [...notificationSettingsKeys.all, 'list'] as const,
	detail: (channel: string) =>
		[...notificationSettingsKeys.all, 'detail', channel] as const,
	balance: (channel: string) =>
		[...notificationSettingsKeys.all, 'balance', channel] as const,
};
