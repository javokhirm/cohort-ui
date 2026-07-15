import { useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

/** Grading-config scale type (mirrors the backend `GRADING_CONFIG_TYPES`). */
export type GradingType = 'POINTS' | 'PERCENTAGE' | 'LETTER';

/** Letter grades a LETTER scale accepts, best→worst (mirrors `LETTER_GRADES`). */
export const LETTER_GRADES = ['A', 'B', 'C', 'D', 'F'] as const;
export type LetterGrade = (typeof LETTER_GRADES)[number];

/**
 * The active grading config a marks sheet renders against (`MarkConfigView`).
 * `maxPoints` is the numeric max for POINTS/PERCENTAGE and `null` for LETTER;
 * `allowHalf` permits `.5` steps for POINTS only.
 */
export interface MarkConfig {
	id: number;
	type: GradingType;
	maxPoints: number | null;
	allowHalf: boolean;
}

/**
 * One student's daily mark (`GET /teach/sessions/:id/marks`, EduCore TEACH marks
 * §1.1). Hand-mirrored from `MarkResponseDto` — the teach controllers declare no
 * `@ApiOkResponse`, so there is no schema to generate. Exactly one of `rawScore`
 * (POINTS/PERCENTAGE) | `letter` (LETTER) is set.
 */
export interface SessionMark {
	id: number;
	sessionId: number;
	studentId: number;
	studentName: string | null;
	groupGradingConfigId: number;
	rawScore: number | null;
	letter: string | null;
	normalizedPct: number;
	note: string | null;
	markedByStaffId: number | null;
	markedAt: string | null;
}

/** A session's marks + its active grading config (`SessionMarksResponseDto`). */
export interface SessionMarks {
	config: MarkConfig;
	marks: SessionMark[];
}

/** One student on a session's roster (from `TeachSessionDetailDto.roster`). */
export interface SessionRosterEntry {
	studentId: number;
	studentName: string;
	enrollmentStatus: string;
}

/**
 * Session detail incl. the active roster (`GET /teach/sessions/:id`). A
 * self-contained mirror of the fields the marks screens need for their header
 * and roster — the marks feature owns this rather than reaching into another
 * feature's internals.
 */
export interface SessionDetail {
	id: number;
	groupId: number;
	groupName: string;
	courseName: string;
	sessionDate: string;
	topic: string | null;
	status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
	roster: SessionRosterEntry[];
}

export const marksKeys = {
	all: ['marks'] as const,
	detail: (sessionId: number) => [...marksKeys.all, 'detail', sessionId] as const,
	session: (sessionId: number) => [...marksKeys.all, 'session', sessionId] as const,
};

/** A session's detail + active roster — the header and student rows of the list view. */
export function useSessionDetail(sessionId: number) {
	return useQuery({
		queryKey: marksKeys.detail(sessionId),
		queryFn: () => teachApi.get<SessionDetail>(`/sessions/${sessionId}`),
	});
}

/** A session's marks + the active grading config the sheet renders against. */
export function useSessionMarks(sessionId: number) {
	return useQuery({
		queryKey: marksKeys.session(sessionId),
		queryFn: () => teachApi.get<SessionMarks>(`/sessions/${sessionId}/marks`),
	});
}
