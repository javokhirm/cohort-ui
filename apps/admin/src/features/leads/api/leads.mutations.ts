import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { leadsKeys } from './keys';
import type {
	LeadDetail,
	LeadActivity,
	LeadLoggableActivityType,
	LeadSource,
	LeadStatus,
} from './leads.queries';

// Mirrors the backend request DTOs for `/manage/leads` (api-reference.md §3.2):
// CreateLeadDto / UpdateLeadDto / MoveLeadStatusDto / CreateLeadActivityDto /
// ConvertLeadDto. Mutations invalidate the whole `leads` subtree (board + every
// column) plus the affected detail — never optimistic (repo convention).

export interface CreateLeadInput {
	branchId?: number;
	firstName: string;
	lastName?: string;
	phoneNumber: string;
	email?: string;
	source: LeadSource;
	courseInterestId?: number;
	assignedToStaffId?: number;
	notes?: string;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
	id: number;
	status?: LeadStatus;
}

export interface MoveLeadStatusInput {
	id: number;
	status: LeadStatus;
	note?: string;
}

export interface LogLeadActivityInput {
	id: number;
	type: LeadLoggableActivityType;
	notes?: string;
	scheduledAt?: string;
}

export interface ConvertLeadInput {
	id: number;
	branchId?: number;
	firstName?: string;
	lastName?: string;
}

/** Subset of the student the convert endpoint returns — enough to navigate. */
export interface ConvertedStudent {
	id: number;
	studentCode: string;
}

export function useCreateLead() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateLeadInput) =>
			manageApi.post<LeadDetail>('/leads', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: leadsKeys.leads() });
		},
	});
}

export function useUpdateLead() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateLeadInput) =>
			manageApi.patch<LeadDetail>(`/leads/${id}`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: leadsKeys.detail(variables.id) });
			void qc.invalidateQueries({ queryKey: leadsKeys.leads() });
		},
	});
}

/** Drag-and-drop stage move / mark-as-lost (`PATCH /leads/:id/status`). */
export function useMoveLeadStatus() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: MoveLeadStatusInput) =>
			manageApi.patch<LeadDetail>(`/leads/${id}/status`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: leadsKeys.detail(variables.id) });
			void qc.invalidateQueries({ queryKey: leadsKeys.leads() });
		},
	});
}

export function useLogLeadActivity() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: LogLeadActivityInput) =>
			manageApi.post<LeadActivity>(`/leads/${id}/activities`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: leadsKeys.detail(variables.id) });
			// The card's `latestActivity` summary changes too.
			void qc.invalidateQueries({ queryKey: leadsKeys.leads() });
		},
	});
}

/** Convert a lead into an enrolled student (idempotent). Returns the student. */
export function useConvertLead() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: ConvertLeadInput) =>
			manageApi.post<ConvertedStudent>(`/leads/${id}/convert`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: leadsKeys.detail(variables.id) });
			void qc.invalidateQueries({ queryKey: leadsKeys.leads() });
		},
	});
}
