import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/test/server';
import { leadHandlers } from '@/test/handlers';

import {
	useLead,
	useLeadBoard,
	useLeadColumnPages,
	type LeadStatus,
} from './leads.queries';
import {
	useConvertLead,
	useCreateLead,
	useLogLeadActivity,
	useMoveLeadStatus,
} from './leads.mutations';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

function total(
	columns: { status: LeadStatus; total: number }[] | undefined,
	status: LeadStatus,
) {
	return columns?.find((c) => c.status === status)?.total;
}

describe('useLeadBoard', () => {
	it('returns five columns in pipeline order with true totals', async () => {
		const { result } = renderHook(() => useLeadBoard({}), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		const columns = result.current.data?.columns;
		expect(columns).toHaveLength(5);
		expect(columns?.map((c) => c.status)).toEqual([
			'NEW',
			'CONTACTED',
			'TRIAL_BOOKED',
			'ENROLLED',
			'LOST',
		]);
		expect(total(columns, 'NEW')).toBe(2);
		expect(total(columns, 'TRIAL_BOOKED')).toBe(2);
		expect(total(columns, 'ENROLLED')).toBe(1);
	});

	it('filters every column by source', async () => {
		const { result } = renderHook(() => useLeadBoard({ source: 'WEBSITE' }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		const columns = result.current.data?.columns;
		expect(total(columns, 'NEW')).toBe(1);
		expect(total(columns, 'CONTACTED')).toBe(1);
		expect(total(columns, 'TRIAL_BOOKED')).toBe(0);
	});

	it('renders an empty board', async () => {
		server.use(leadHandlers.empty);
		const { result } = renderHook(() => useLeadBoard({}), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.columns.every((c) => c.total === 0)).toBe(true);
	});

	it('surfaces an error when the board request fails', async () => {
		server.use(leadHandlers.serverError);
		const { result } = renderHook(() => useLeadBoard({}), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe('useLeadColumnPages', () => {
	it('loads more pages from page 2 onward', async () => {
		server.use(leadHandlers.columnPaged);
		const { result } = renderHook(() => useLeadColumnPages('NEW', {}, true), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		// Board already delivered page 1, so the infinite query starts at page 2.
		expect(result.current.data?.pages[0]?.page).toBe(2);
		expect(result.current.hasNextPage).toBe(true);

		await act(async () => {
			await result.current.fetchNextPage();
		});

		await waitFor(() => expect(result.current.data?.pages.length).toBe(2));
		expect(result.current.data?.pages[1]?.page).toBe(3);
	});

	it('does not fetch while disabled', () => {
		const { result } = renderHook(() => useLeadColumnPages('NEW', {}, false), {
			wrapper: wrapper(),
		});
		expect(result.current.fetchStatus).toBe('idle');
		expect(result.current.data).toBeUndefined();
	});
});

describe('useLead', () => {
	it('fetches a lead detail with its activity timeline', async () => {
		const { result } = renderHook(() => useLead(3), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.firstName).toBe('Zarina');
		expect(result.current.data?.email).toBe('zarina@example.com');
		expect(result.current.data?.activities).toHaveLength(2);
	});

	it('stays idle for a null id', () => {
		const { result } = renderHook(() => useLead(null), { wrapper: wrapper() });
		expect(result.current.fetchStatus).toBe('idle');
	});

	it('surfaces a not-found error', async () => {
		const { result } = renderHook(() => useLead(88888), { wrapper: wrapper() });
		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe('lead mutations', () => {
	it('captures a lead (defaults to NEW)', async () => {
		const { result } = renderHook(() => useCreateLead(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			firstName: 'Test',
			phoneNumber: '+998901112233',
			source: 'WEBSITE',
		});

		expect(created.firstName).toBe('Test');
		expect(created.status).toBe('NEW');
	});

	it('moves a lead to another stage', async () => {
		const { result } = renderHook(() => useMoveLeadStatus(), { wrapper: wrapper() });

		const moved = await result.current.mutateAsync({ id: 1, status: 'CONTACTED' });

		expect(moved.id).toBe(1);
		expect(moved.status).toBe('CONTACTED');
	});

	it('logs a touchpoint activity', async () => {
		const { result } = renderHook(() => useLogLeadActivity(), { wrapper: wrapper() });

		const activity = await result.current.mutateAsync({
			id: 3,
			type: 'CALL',
			notes: 'Spoke about the IELTS schedule',
		});

		expect(activity.type).toBe('CALL');
		expect(activity.notes).toBe('Spoke about the IELTS schedule');
	});

	it('converts a lead into a student', async () => {
		const { result } = renderHook(() => useConvertLead(), { wrapper: wrapper() });

		const student = await result.current.mutateAsync({ id: 3 });

		expect(student.id).toBe(100);
		expect(student.studentCode).toBe('STU-2026-0100');
	});

	it('rejects converting a lost lead', async () => {
		const { result } = renderHook(() => useConvertLead(), { wrapper: wrapper() });

		await expect(result.current.mutateAsync({ id: 7 })).rejects.toThrow();
	});
});
