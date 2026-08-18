import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import {
	notificationOutboxKeys,
	notificationRulesKeys,
	notificationSettingsKeys,
	notificationTemplatesKeys,
} from './keys';
import type {
	ChannelSetting,
	NotificationAudience,
	NotificationChannel,
	NotificationRecord,
	NotificationRule,
	NotificationTemplate,
	TemplatePreview,
} from './notifications.queries';

// ─── Input types ─────────────────────────────────────────────────────────────
// Mirror the backend DTOs for the `/manage` communication surface
// (api-reference.md §3.18).

export interface CreateRuleInput {
	trigger: string;
	channels: NotificationChannel[];
	audience: NotificationAudience;
	templateCode?: string;
	/** Required for SCHEDULED triggers, rejected for EVENT ones. */
	offsetDays?: number | null;
	branchId?: number | null;
	isActive?: boolean;
}

/** `trigger` is absent by design — it is immutable on the backend. */
export interface UpdateRuleInput {
	id: number;
	channels?: NotificationChannel[];
	audience?: NotificationAudience;
	templateCode?: string;
	offsetDays?: number | null;
	branchId?: number | null;
	isActive?: boolean;
}

export interface CreateTemplateInput {
	code: string;
	channel: NotificationChannel;
	locale?: string;
	subject?: string | null;
	body: string;
	isActive?: boolean;
}

export interface UpdateTemplateInput {
	id: number;
	code?: string;
	channel?: NotificationChannel;
	locale?: string;
	subject?: string | null;
	body?: string;
	isActive?: boolean;
}

export interface UpsertChannelSettingInput {
	channel: NotificationChannel;
	isEnabled: boolean;
	provider?: string | null;
	senderName?: string | null;
	/**
	 * Omit to leave stored credentials untouched; pass `null` to clear them and
	 * fall back to the platform account.
	 */
	credentials?: { login: string; password: string } | null;
	dailyLimit?: number | null;
}

export interface SendNotificationInput {
	channel: NotificationChannel;
	templateId?: number | null;
	body?: string;
	/** Exactly one recipient scope. */
	recipientUserIds?: number[];
	recipientGroupId?: number;
	recipientBranchId?: number;
	variables?: Record<string, unknown>;
	scheduledAt?: string;
}

export interface SendNotificationResult {
	queued: number;
	/** Resolved recipients with no usable address for the channel. */
	skipped: number;
	notificationIds: number[];
}

export interface ChannelTestResult {
	success: boolean;
	providerMessageId: string | null;
	/** Failure reason when `success` is false — already localized. */
	error: string | null;
}

// ─── Rules ───────────────────────────────────────────────────────────────────

export function useCreateNotificationRule() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateRuleInput) =>
			manageApi.post<NotificationRule>('/notification-rules', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: notificationRulesKeys.all });
		},
	});
}

export function useUpdateNotificationRule() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateRuleInput) =>
			manageApi.patch<NotificationRule>(`/notification-rules/${id}`, body),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: notificationRulesKeys.all });
		},
	});
}

/**
 * The on/off switch, as its own mutation against the dedicated endpoint.
 *
 * Deliberately not folded into `useUpdateNotificationRule`: flipping a toggle in a
 * list must not round-trip the rest of the rule, or it would clobber a concurrent
 * edit to the copy or the channels.
 */
export function useToggleNotificationRule() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
			manageApi.patch<NotificationRule>(`/notification-rules/${id}/toggle`, {
				isActive,
			}),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: notificationRulesKeys.all });
		},
	});
}

export function useDeleteNotificationRule() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => manageApi.delete(`/notification-rules/${id}`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: notificationRulesKeys.all });
		},
	});
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function useCreateNotificationTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateTemplateInput) =>
			manageApi.post<NotificationTemplate>('/notification-templates', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: notificationTemplatesKeys.all });
		},
	});
}

export function useUpdateNotificationTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateTemplateInput) =>
			manageApi.patch<NotificationTemplate>(`/notification-templates/${id}`, body),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: notificationTemplatesKeys.all });
		},
	});
}

export function useDeleteNotificationTemplate() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => manageApi.delete(`/notification-templates/${id}`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: notificationTemplatesKeys.all });
		},
	});
}

/**
 * Render a draft body against sample values. A mutation rather than a query
 * because it is an explicit user action on unsaved input — there is no cacheable
 * resource, and caching keyed on a body the user is still typing would be noise.
 */
export function usePreviewNotificationTemplate() {
	return useMutation({
		mutationFn: (input: { body: string; variables?: Record<string, unknown> }) =>
			manageApi.post<TemplatePreview>('/notification-templates/preview', input),
	});
}

export interface SmsModerationSyncResult {
	/** Texts newly sent to the gateway's moderators. */
	submitted: number;
	/** Texts the gateway already held verbatim; the existing decision was adopted. */
	matched: number;
	/** Texts already settled locally — no gateway call needed. */
	skipped: number;
	/** Submissions the gateway refused or that could not be delivered. */
	failed: number;
}

/**
 * Operator-triggered sweep: submit the code-owned default SMS copy the gateway
 * doesn't already hold. Deliberately not run automatically — moderation is a
 * human review queue at the gateway, so it only fires when someone presses the
 * button. Safe to repeat: the backend reconciles against the account's existing
 * templates first and submits only what's missing.
 */
export function useSyncTemplateModeration() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () =>
			manageApi.post<SmsModerationSyncResult>(
				'/notification-templates/moderation/sync',
			),
		onSuccess: () => {
			void qc.invalidateQueries({
				queryKey: notificationTemplatesKeys.moderation(),
			});
		},
	});
}

// ─── Channel settings ────────────────────────────────────────────────────────

export function useUpsertChannelSetting() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ channel, ...body }: UpsertChannelSettingInput) =>
			manageApi.put<ChannelSetting>(`/notification-settings/${channel}`, body),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: notificationSettingsKeys.all });
		},
	});
}

/**
 * Send one real test message.
 *
 * Note this resolves successfully even when the gateway rejected the message —
 * the endpoint returns `{ success: false, error }` rather than a 5xx, because
 * "your password is wrong" is the expected answer while configuring. Callers must
 * branch on `result.success`, not merely on the promise resolving.
 */
export function useTestChannel() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			channel,
			...body
		}: {
			channel: NotificationChannel;
			phone: string;
			message?: string;
		}) =>
			manageApi.post<ChannelTestResult>(
				`/notification-settings/${channel}/test`,
				body,
			),
		onSuccess: () => {
			// A successful test proves the credentials work, which can flip
			// `isOperational` and moves the balance.
			void qc.invalidateQueries({ queryKey: notificationSettingsKeys.all });
		},
	});
}

// ─── Outbox ──────────────────────────────────────────────────────────────────

export function useSendNotification() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: SendNotificationInput) =>
			manageApi.post<SendNotificationResult>('/notifications', input),
		onSuccess: () => {
			// Invalidates the whole namespace, which covers both the list and stats.
			void qc.invalidateQueries({ queryKey: notificationOutboxKeys.all });
		},
	});
}

/** Re-queue a FAILED notification. Only FAILED rows qualify (400 otherwise). */
export function useRetryNotification() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) =>
			manageApi.post<NotificationRecord>(`/notifications/${id}/retry`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: notificationOutboxKeys.all });
		},
	});
}
