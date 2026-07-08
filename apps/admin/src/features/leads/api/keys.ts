import type { LeadSource, LeadStatus } from './leads.queries';

/**
 * Filters for the CRM leads surface (`GET /manage/leads`, api-reference.md §3.2).
 * `status` switches the endpoint from board mode (all columns) to a flat
 * paginated single column; `page`/`limit` are only meaningful in that column mode.
 */
export interface LeadListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	status?: LeadStatus;
	source?: LeadSource;
	assignedToStaffId?: number;
	courseInterestId?: number;
	search?: string;
	createdAfter?: string;
}

export const leadsKeys = {
	all: ['leads'] as const,

	leads: () => [...leadsKeys.all, 'lead'] as const,
	/** The full Kanban board (all columns, first page each). */
	board: (filters: LeadListFilters) =>
		[...leadsKeys.leads(), 'board', filters] as const,
	/** A single column's paginated pages (the "load more" expansion). */
	column: (status: LeadStatus, filters: LeadListFilters) =>
		[...leadsKeys.leads(), 'column', status, filters] as const,
	detail: (id: number) => [...leadsKeys.leads(), 'detail', id] as const,
	activities: (id: number) =>
		[...leadsKeys.leads(), 'detail', id, 'activities'] as const,
};
