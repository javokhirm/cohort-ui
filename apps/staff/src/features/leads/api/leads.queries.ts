import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import { leadsKeys, type LeadListFilters } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Response shapes for the `/manage/leads` surface (api-reference.md §3.2),
// cross-checked against educore-be src/api/manage/dto/leads/lead-response.dto.ts.
// openapi-typescript emits only the request DTOs, so the response bodies (and the
// enums the whole feature keys off) are declared here as the single source.

export const LEAD_SOURCES = [
	'INSTAGRAM',
	'TELEGRAM',
	'REFERRAL',
	'WALK_IN',
	'WEBSITE',
	'OTHER',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = [
	'NEW',
	'CONTACTED',
	'TRIAL_BOOKED',
	'ENROLLED',
	'LOST',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_ACTIVITY_TYPES = [
	'CALL',
	'MESSAGE',
	'TRIAL',
	'NOTE',
	'STATUS_CHANGE',
	'CONVERT',
] as const;
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

/** The subset a client may log (`POST /leads/:id/activities`). */
export const LEAD_LOGGABLE_ACTIVITY_TYPES = ['CALL', 'MESSAGE', 'TRIAL', 'NOTE'] as const;
export type LeadLoggableActivityType = (typeof LEAD_LOGGABLE_ACTIVITY_TYPES)[number];

/** Cards pre-loaded per column (backend `DEFAULT_BOARD_LIMIT`, UI cap 12). */
export const LEAD_COLUMN_PAGE_SIZE = 12;

export interface NamedRef {
	id: number;
	name: string;
}

export interface LeadLatestActivity {
	type: LeadActivityType;
	notes: string | null;
	createdAt: string;
}

/** A pipeline card (`GET /leads` items). */
export interface LeadCard {
	id: number;
	firstName: string;
	lastName: string | null;
	phoneNumber: string;
	source: LeadSource;
	status: LeadStatus;
	branchId: number;
	courseInterest: NamedRef | null;
	assignedTo: NamedRef | null;
	latestActivity: LeadLatestActivity | null;
	createdAt: string;
}

/** A single entry in a lead's timeline. `actorName = null` ⇒ system-generated. */
export interface LeadActivity {
	id: number;
	type: LeadActivityType;
	status: LeadStatus;
	label: string;
	notes: string | null;
	scheduledAt: string | null;
	actorStaffId: number | null;
	actorName: string | null;
	createdAt: string;
}

/** Full lead detail: a card plus contact fields and the ordered timeline. */
export interface LeadDetail extends LeadCard {
	email: string | null;
	notes: string | null;
	convertedStudentId: number | null;
	activities: LeadActivity[];
}

export interface LeadColumn {
	status: LeadStatus;
	total: number;
	items: LeadCard[];
}

export interface LeadBoard {
	columns: LeadColumn[];
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * The Kanban board: one column per status (fixed pipeline order), each with its
 * true total and the first {@link LEAD_COLUMN_PAGE_SIZE} cards. The global branch
 * selection is folded into the effective filters (and thus the key), so switching
 * the selector refetches; an explicit caller value still wins.
 */
export function useLeadBoard(filters: LeadListFilters) {
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: LeadListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: leadsKeys.board(effectiveFilters),
		queryFn: () =>
			manageApi.get<LeadBoard>('/leads', {
				params: { ...effectiveFilters, limit: LEAD_COLUMN_PAGE_SIZE },
			}),
		placeholderData: keepPreviousData,
	});
}

/**
 * A single column's "load more" expansion — the flat, paginated `?status=` mode.
 * Board mode already delivers page 1, so this infinite query starts at page 2 and
 * the caller concatenates its rows onto the board column's items.
 */
export function useLeadColumnPages(
	status: LeadStatus,
	filters: LeadListFilters,
	enabled: boolean,
) {
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: LeadListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useInfiniteQuery({
		queryKey: leadsKeys.column(status, effectiveFilters),
		queryFn: ({ pageParam }) =>
			manageApi.getPaginated<LeadCard>('/leads', {
				params: {
					...effectiveFilters,
					status,
					page: pageParam,
					limit: LEAD_COLUMN_PAGE_SIZE,
				},
			}) as Promise<PaginatedResult<LeadCard>>,
		initialPageParam: 2,
		getNextPageParam: (last) =>
			last.page < last.totalPages ? last.page + 1 : undefined,
		enabled,
	});
}

/** Full detail incl. the ordered activity timeline. Lazy: pass `null` to skip. */
export function useLead(id: number | null) {
	return useQuery({
		queryKey: leadsKeys.detail(id ?? 0),
		queryFn: () => manageApi.get<LeadDetail>(`/leads/${id}`),
		enabled: id != null && id > 0,
	});
}
