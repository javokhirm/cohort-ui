import { useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
export type StudentGender = 'M' | 'F' | 'O';
export type GuardianRelation = 'mother' | 'father' | 'guardian';

/**
 * The **limited** student profile a teacher may see (`GET /teach/students/:id`,
 * api-reference §4.6): identity and contact only — no address, notes or
 * financial data.
 *
 * Hand-mirrored from the backend's `TeacherStudentProfileDto`: the teach
 * controllers declare no `@ApiOkResponse`, so the OpenAPI document carries no
 * response schema to generate from.
 */
export interface TeachStudentProfile {
	studentId: number;
	studentCode: string;
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	email: string | null;
	avatarUrl: string | null;
	dateOfBirth: string | null;
	gender: StudentGender | null;
	enrolledAt: string;
	status: StudentStatus;
}

/**
 * A student's guardians (`GET /teach/students/:id/guardians`) — narrower
 * than the manage surface's guardian: a name to call, a number, and the
 * relation. Primary first.
 */
export interface TeachStudentGuardian {
	guardianUserId: number;
	firstName: string;
	lastName: string;
	phone: string;
	relation: GuardianRelation;
	isPrimary: boolean;
}

export const studentsKeys = {
	all: ['students'] as const,
	detail: (studentId: number) => [...studentsKeys.all, 'detail', studentId] as const,
	guardians: (studentId: number) =>
		[...studentsKeys.all, 'guardians', studentId] as const,
};

/**
 * One student's profile.
 *
 * `enabled` guards the route param: it arrives as a string and `Number('')` is
 * `0`, which would fetch `/students/0`.
 */
export function useStudent(studentId: number) {
	return useQuery({
		queryKey: studentsKeys.detail(studentId),
		queryFn: () => teachApi.get<TeachStudentProfile>(`/students/${studentId}`),
		enabled: studentId > 0,
	});
}

/** A student's guardians — the emergency-contact block. */
export function useStudentGuardians(studentId: number) {
	return useQuery({
		queryKey: studentsKeys.guardians(studentId),
		queryFn: () =>
			teachApi.get<TeachStudentGuardian[]>(`/students/${studentId}/guardians`),
		enabled: studentId > 0,
	});
}
