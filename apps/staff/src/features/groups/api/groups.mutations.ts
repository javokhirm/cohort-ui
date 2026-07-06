import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { invoicesKeys } from '@/features/billing/api/keys';

import { groupsKeys } from './keys';
import type {
	Enrollment,
	EnrollmentStatus,
	GroupDetail,
	GroupStatus,
	ScheduleRule,
} from './groups.queries';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateGroupInput {
	branchId: number;
	courseId: number;
	name: string;
	defaultTeacherId?: number | null;
	roomId?: number | null;
	capacity?: number | null;
	startDate?: string | null;
	endDate?: string | null;
	scheduleRule?: ScheduleRule | null;
}

export interface UpdateGroupInput {
	id: number;
	name?: string;
	defaultTeacherId?: number | null;
	roomId?: number | null;
	capacity?: number | null;
	startDate?: string | null;
	endDate?: string | null;
	scheduleRule?: ScheduleRule | null;
	status?: GroupStatus;
	/** Regenerate future SCHEDULED sessions from the updated schedule rule. */
	regenerateSessions?: boolean;
}

export interface EnrollStudentsInput {
	groupId: number;
	studentIds: number[];
	feePlanId?: number | null;
}

export interface UpdateEnrollmentInput {
	id: number;
	groupId: number;
	status: EnrollmentStatus;
	dropReason?: string | null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateGroup() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateGroupInput) =>
			manageApi.post<GroupDetail>('/groups', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: groupsKeys.groups() });
		},
	});
}

export function useUpdateGroup() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateGroupInput) =>
			manageApi.patch<GroupDetail>(`/groups/${id}`, body),
		onSuccess: (group) => {
			void qc.invalidateQueries({ queryKey: groupsKeys.groups() });
			void qc.invalidateQueries({ queryKey: groupsKeys.groupSessions(group.id) });
			void qc.invalidateQueries({ queryKey: groupsKeys.sessions() });
		},
	});
}

/** Batch-enroll students into a group (`POST /manage/groups/:id/enrollments`). */
export function useEnrollStudents() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ groupId, studentIds, feePlanId }: EnrollStudentsInput) =>
			manageApi.post<Enrollment[]>(`/groups/${groupId}/enrollments`, {
				studentIds,
				feePlanId: feePlanId ?? null,
			}),
		onSuccess: (_data, { groupId }) => {
			void qc.invalidateQueries({ queryKey: groupsKeys.groupEnrollments(groupId) });
			void qc.invalidateQueries({ queryKey: groupsKeys.groupDetail(groupId) });
			// A PREPAID tenant with charge-on-enrollment issues a prorated invoice
			// as a server-side side effect, so refresh the invoice list + summary.
			void qc.invalidateQueries({ queryKey: invoicesKeys.invoices() });
		},
	});
}

/** Transition an enrollment (drop / complete / transfer) (`PATCH /manage/enrollments/:id`). */
export function useUpdateEnrollment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, status, dropReason }: UpdateEnrollmentInput) =>
			manageApi.patch<Enrollment>(`/enrollments/${id}`, {
				status,
				dropReason: dropReason ?? null,
			}),
		onSuccess: (_data, { groupId }) => {
			void qc.invalidateQueries({ queryKey: groupsKeys.groupEnrollments(groupId) });
			void qc.invalidateQueries({ queryKey: groupsKeys.groupDetail(groupId) });
		},
	});
}
