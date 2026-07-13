import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';

import { studentImportsKeys } from '@/api/student-imports/keys';
import {
	commitStudentImport,
	uploadStudentImport,
} from '@/api/student-imports/student-imports.mutations';
import {
	getStudentImport,
	listStudentImports,
	listStudentImportRows,
} from '@/api/student-imports/student-imports.queries';
import type {
	CommitStudentImportInput,
	StudentImportRowFilters,
	StudentImportSessionView,
} from '@/api/student-imports/types';
import { IN_FLIGHT_STATUSES } from '@/api/student-imports/types';

/** How often to re-poll a session while the worker is applying it. */
const POLL_INTERVAL_MS = 2000;

/** Rows per page in the report table. */
export const IMPORT_ROWS_PAGE_SIZE = 20;

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function useStudentImports(tenantId: number, enabled: boolean) {
	return useQuery({
		queryKey: studentImportsKeys.list(tenantId),
		queryFn: () => listStudentImports(tenantId),
		enabled,
	});
}

/**
 * One session, polled while the background worker is running.
 *
 * The import is applied out-of-band (a BullMQ job), so the only way the UI learns
 * that a row landed is to ask again. Polling stops the moment the session reaches
 * a terminal status — an idle import session must not sit there re-fetching
 * forever.
 */
export function useStudentImport(tenantId: number, sessionId: string, enabled: boolean) {
	return useQuery({
		queryKey: studentImportsKeys.detail(tenantId, sessionId),
		queryFn: () => getStudentImport(tenantId, sessionId),
		enabled,
		refetchInterval: (query) => {
			const session = query.state.data as StudentImportSessionView | undefined;
			return session && IN_FLIGHT_STATUSES.includes(session.status)
				? POLL_INTERVAL_MS
				: false;
		},
	});
}

export function useStudentImportRows(
	tenantId: number,
	sessionId: string,
	filters: StudentImportRowFilters,
	enabled: boolean,
) {
	return useQuery({
		queryKey: studentImportsKeys.rows(tenantId, sessionId, filters),
		queryFn: () => listStudentImportRows(tenantId, sessionId, filters),
		enabled,
		placeholderData: keepPreviousData,
	});
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUploadStudentImport(
	tenantId: number,
	options?: { onSuccess?: (session: StudentImportSessionView) => void },
) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (file: File) => uploadStudentImport(tenantId, file),
		onSuccess: (session) => {
			// Seed the detail cache from the response so navigating straight to the
			// report does not re-fetch what we already hold.
			queryClient.setQueryData(
				studentImportsKeys.detail(tenantId, session.sessionId),
				session,
			);
			void queryClient.invalidateQueries({
				queryKey: studentImportsKeys.list(tenantId),
			});
			options?.onSuccess?.(session);
		},
	});
}

export function useCommitStudentImport(
	tenantId: number,
	sessionId: string,
	options?: { onSuccess?: () => void },
) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: CommitStudentImportInput) =>
			commitStudentImport(tenantId, sessionId, input),
		onSuccess: (session) => {
			// The session is now QUEUED; seeding it starts the poll immediately rather
			// than after the next interval.
			queryClient.setQueryData(
				studentImportsKeys.detail(tenantId, sessionId),
				session,
			);
			void queryClient.invalidateQueries({
				queryKey: studentImportsKeys.list(tenantId),
			});
			options?.onSuccess?.();
		},
	});
}
