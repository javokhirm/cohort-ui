import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getLocale } from '@repo/i18n';
import type { PaginatedResult } from '@repo/api-client';

import { manageApi } from '@/api/apiClient';

import {
	notificationOutboxKeys,
	notificationRulesKeys,
	notificationSettingsKeys,
	notificationTemplatesKeys,
	notificationTriggersKeys,
	type OutboxListFilters,
	type RuleListFilters,
	type TemplateListFilters,
} from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend response DTOs for the `/manage` communication surface
// (api-reference.md §3.18). The generated `@repo/api-client` OpenAPI types
// expose the request DTOs but not response bodies, so the shapes are declared
// here; reconcile if the spec starts emitting response schemas.

export const NOTIFICATION_CHANNELS = ['SMS', 'TELEGRAM', 'EMAIL', 'PUSH'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/**
 * `SENDING` is the dispatch worker's atomic claim marker — a row is only ever in
 * it for the duration of one gateway call, so it is transient in the UI.
 */
export const NOTIFICATION_STATUSES = [
	'QUEUED',
	'SENDING',
	'SENT',
	'DELIVERED',
	'FAILED',
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const NOTIFICATION_AUDIENCES = [
	'STUDENT',
	'PRIMARY_GUARDIAN',
	'STUDENT_AND_GUARDIAN',
	'BILLING_CONTACTS',
] as const;
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

/** `EVENT` fires immediately; `SCHEDULED` is evaluated by the daily sweep. */
export type NotificationTriggerKind = 'EVENT' | 'SCHEDULED';

/**
 * One entry of the trigger catalog. This is the contract the rule builder is
 * driven by: which audiences are legal, whether a day offset applies, and which
 * `{{variables}}` a template may use are all read from here rather than
 * duplicated in the frontend, so adding a trigger needs no UI change.
 */
export interface NotificationTrigger {
	trigger: string;
	kind: NotificationTriggerKind;
	/** Already localized by the backend (we send `x-lang`). */
	label: string;
	defaultTemplateCode: string;
	audiences: NotificationAudience[];
	variables: string[];
	requiresOffset: boolean;
}

export interface NotificationRule {
	id: number;
	/** Null = applies tenant-wide. */
	branchId: number | null;
	trigger: string;
	channels: NotificationChannel[];
	audience: NotificationAudience;
	templateCode: string;
	/** Negative = before the anchor date, 0 = on it, positive = after. */
	offsetDays: number | null;
	/** The on/off toggle. `false` = configured but silenced. */
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Where a template's copy comes from. `SYSTEM` is the code-owned platform default
 * (no database row); `TENANT` is a row the center saved to customize it. The list
 * merges both so every code shows in all three locales even before a center edits
 * anything — see `GET /manage/notification-templates` (api-reference §3.18).
 */
export type NotificationTemplateSource = 'SYSTEM' | 'TENANT';

export interface NotificationTemplate {
	/** `null` for a `SYSTEM` default — it has no row until the center customizes it. */
	id: number | null;
	code: string;
	channel: NotificationChannel;
	locale: string;
	subject: string | null;
	body: string;
	isActive: boolean;
	source: NotificationTemplateSource;
	/** `true` iff the center has saved its own copy (`source === 'TENANT'`). */
	isCustomized: boolean;
	/** `null` for a `SYSTEM` default (no row, so no timestamps). */
	createdAt: string | null;
	updatedAt: string | null;
}

/**
 * Where a message text stands with the SMS gateway's moderators.
 *
 * Uzbek gateways deliver only **pre-approved** copy — sending an unmoderated body
 * is rejected outright, and no retry helps. Every default template and every
 * customization is therefore submitted for approval when it is saved.
 *
 * - `PENDING` — Cohort never reached the gateway (see `error`); it retries on the
 *   next save.
 * - `MODERATION` — submitted, awaiting a human decision.
 * - `APPROVED` — sendable.
 * - `REJECTED` — refused. The **copy must change**; resubmitting the identical
 *   text only earns the identical refusal.
 */
export const TEMPLATE_MODERATION_STATUSES = [
	'PENDING',
	'MODERATION',
	'APPROVED',
	'REJECTED',
] as const;
export type TemplateModerationStatus = (typeof TEMPLATE_MODERATION_STATUSES)[number];

export interface TemplateModeration {
	/** The Cohort body, `{{placeholders}}` intact — how a row joins to a template. */
	sourceBody: string;
	/** What was submitted, in the gateway's syntax: `%w+: %w+ uchun %w %w …`. */
	templateText: string;
	status: TemplateModerationStatus;
	/** Gateway-side template id, once a status refresh has learned it. */
	providerRef: string | null;
	submittedAt: string | null;
	lastCheckedAt: string | null;
	/** Why the last attempt failed — set while `status` is `PENDING`. */
	error: string | null;
}

export interface TemplatePreview {
	body: string;
	/**
	 * Billable SMS parts. Cyrillic and diacritic text is UCS-2 (70 chars per part)
	 * rather than GSM-7 (160), so the same message can cost three times as much.
	 */
	segments: number;
}

export interface NotificationRecord {
	id: number;
	branchId: number | null;
	recipientUserId: number | null;
	recipientPhone: string | null;
	/** The recipient's display name, for the delivery log; null if unresolvable. */
	recipientName: string | null;
	channel: NotificationChannel;
	templateId: number | null;
	templateCode: string | null;
	/** Rule that produced it; null for a manual send. */
	ruleId: number | null;
	status: NotificationStatus;
	/** `{ body, variables }` — the rendered text, as sent. */
	payload: Record<string, unknown> | null;
	provider: string | null;
	attempts: number;
	error: string | null;
	segments: number | null;
	scheduledAt: string | null;
	sentAt: string | null;
	readAt: string | null;
	createdAt: string;
}

export interface NotificationStats {
	byStatus: Partial<Record<NotificationStatus, number>>;
	byChannel: Record<string, number>;
	totalSegments: number;
}

export interface ChannelSetting {
	channel: NotificationChannel;
	/** The channel-wide master switch. */
	isEnabled: boolean;
	provider: string;
	senderName: string | null;
	hasOwnCredentials: boolean;
	credentialSource: 'TENANT' | 'PLATFORM';
	/** Masked tenant login, or null when using the platform account. */
	maskedLogin: string | null;
	dailyLimit: number | null;
	sentToday: number;
	/**
	 * Enabled AND has a resolvable provider and credentials. `false` while
	 * `isEnabled` is `true` is the state worth surfacing prominently: the center
	 * thinks SMS is on, but nothing can send.
	 */
	isOperational: boolean;
	updatedAt: string | null;
}

export interface ChannelBalance {
	provider: string;
	credentialSource: 'TENANT' | 'PLATFORM';
	/** Null when the provider exposes none or is unreachable. */
	amount: number | null;
	currency: string | null;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * The trigger catalog. Long `staleTime` because it only changes on deploy, but
 * keyed by locale so switching language refetches the labels.
 */
export function useNotificationTriggers(enabled = true) {
	const locale = getLocale();
	return useQuery({
		queryKey: notificationTriggersKeys.list(locale),
		queryFn: () => manageApi.get<NotificationTrigger[]>('/notification-triggers'),
		staleTime: 30 * 60 * 1000,
		enabled,
	});
}

export function useNotificationRules(filters: RuleListFilters, enabled = true) {
	return useQuery({
		queryKey: notificationRulesKeys.list(filters),
		queryFn: () =>
			manageApi.getPaginated<NotificationRule>('/notification-rules', {
				params: filters,
			}) as Promise<PaginatedResult<NotificationRule>>,
		placeholderData: keepPreviousData,
		enabled,
	});
}

export function useNotificationTemplates(filters: TemplateListFilters, enabled = true) {
	return useQuery({
		queryKey: notificationTemplatesKeys.list(filters),
		queryFn: () =>
			manageApi.getPaginated<NotificationTemplate>('/notification-templates', {
				params: filters,
			}) as Promise<PaginatedResult<NotificationTemplate>>,
		placeholderData: keepPreviousData,
		enabled,
	});
}

/**
 * SMS gateway moderation state for this center's copy.
 *
 * Scoped server-side to the gateway **account** the center resolves to — the
 * shared platform account for most centers, its own for a center with its own
 * Eskiz contract — so it is a small, flat list, not a paginated one. Returns `[]`
 * when no SMS credentials resolve, which reads correctly as "nothing has been
 * submitted anywhere".
 *
 * No refetch interval: a moderator decides on a human timescale (hours), and the
 * backend calls the gateway on every read, so polling would spend gateway
 * round-trips to watch something that rarely moves. `staleTime` keeps tab
 * switching cheap while still refreshing on a real revisit.
 */
export function useTemplateModeration(enabled = true) {
	return useQuery({
		queryKey: notificationTemplatesKeys.moderation(),
		queryFn: () =>
			manageApi.get<TemplateModeration[]>('/notification-templates/moderation'),
		staleTime: 60 * 1000,
		enabled,
	});
}

export function useNotificationOutbox(filters: OutboxListFilters) {
	return useQuery({
		queryKey: notificationOutboxKeys.list(filters),
		queryFn: () =>
			manageApi.getPaginated<NotificationRecord>('/notifications', {
				params: filters,
			}) as Promise<PaginatedResult<NotificationRecord>>,
		placeholderData: keepPreviousData,
		// The outbox is a live operational view: a queued message becomes SENT
		// within a minute (the dispatch sweep's interval), so a short refetch
		// interval is what makes "did it go out?" answerable without a manual reload.
		refetchInterval: 30 * 1000,
	});
}

export function useNotificationStats(
	range: { from?: string; to?: string },
	enabled = true,
) {
	return useQuery({
		queryKey: notificationOutboxKeys.stats(range),
		queryFn: () =>
			manageApi.get<NotificationStats>('/notifications/stats', { params: range }),
		placeholderData: keepPreviousData,
		refetchInterval: 30 * 1000,
		enabled,
	});
}

/**
 * The channel settings list. `enabled` gates the fetch so the console header can
 * ask for it only when the principal holds `notification-settings.manage` — the
 * endpoint 403s otherwise (it exposes provider credentials).
 */
export function useChannelSettings(enabled = true) {
	return useQuery({
		queryKey: notificationSettingsKeys.list(),
		queryFn: () => manageApi.get<ChannelSetting[]>('/notification-settings'),
		enabled,
	});
}

/**
 * Provider balance for one channel.
 *
 * `retry: false` because the endpoint 400s when the channel is not configured —
 * an expected state while an operator is still setting SMS up, not a transient
 * failure worth retrying.
 */
export function useChannelBalance(channel: NotificationChannel, enabled: boolean) {
	return useQuery({
		queryKey: notificationSettingsKeys.balance(channel),
		queryFn: () =>
			manageApi.get<ChannelBalance>(`/notification-settings/${channel}/balance`),
		enabled,
		retry: false,
		staleTime: 5 * 60 * 1000,
	});
}
