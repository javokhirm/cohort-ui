/** One `platformLeads` row (cohort-be docs/api-reference.md §2.11). */
export interface PlatformLead {
	id: number;
	name: string;
	email: string;
	phone: string | null;
	centerName: string | null;
	message: string | null;
	/** Caller-identified, e.g. `WEBSITE` — open-ended, not a closed backend enum. */
	source: string;
	createdAt: string;
}

export interface PlatformLeadListFilters {
	search?: string;
	source?: string;
	from?: string;
	to?: string;
	page?: number;
	limit?: number;
}
