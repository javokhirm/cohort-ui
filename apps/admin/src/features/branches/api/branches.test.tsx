import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { useBranches } from '@/api/branches';
import { server } from '@/test/server';
import { branchHandlers } from '@/test/handlers';

import { useCreateBranch, useUpdateBranch } from './branches.mutations';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useBranches', () => {
	it('fetches the tenant branches with their contact details', async () => {
		const { result } = renderHook(() => useBranches(), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toHaveLength(2);
		const main = result.current.data?.find((b) => b.isMain);
		expect(main?.name).toBe('Main Campus');
		expect(main?.address).toBe('Yunusobod 4-kvartal, Tashkent');
		expect(main?.timezone).toBe('Asia/Tashkent');
	});

	it('renders an empty directory', async () => {
		server.use(branchHandlers.empty);
		const { result } = renderHook(() => useBranches(), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toHaveLength(0);
	});

	it('surfaces an error when the request fails', async () => {
		server.use(branchHandlers.serverError);
		const { result } = renderHook(() => useBranches(), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe('useCreateBranch', () => {
	it('creates a branch', async () => {
		const { result } = renderHook(() => useCreateBranch(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			name: 'Sergeli',
			code: 'BR-003',
			address: 'Sergeli 3, Tashkent',
			phone: '+998 71 200 30 30',
			timezone: 'Asia/Tashkent',
			isMain: false,
		});

		expect(created.id).toBe(99);
		expect(created.name).toBe('Sergeli');
		expect(created.code).toBe('BR-003');
		expect(created.isActive).toBe(true);
	});

	it('surfaces a duplicate short-code conflict', async () => {
		server.use(branchHandlers.createConflict);
		const { result } = renderHook(() => useCreateBranch(), { wrapper: wrapper() });

		await expect(
			result.current.mutateAsync({ name: 'Dup', code: 'BR-001' }),
		).rejects.toThrow();
	});
});

describe('useUpdateBranch', () => {
	it('deactivates a branch via isActive', async () => {
		const { result } = renderHook(() => useUpdateBranch(), { wrapper: wrapper() });

		const updated = await result.current.mutateAsync({ id: 2, isActive: false });

		expect(updated.id).toBe(2);
		expect(updated.isActive).toBe(false);
	});

	it('promotes a branch to main', async () => {
		const { result } = renderHook(() => useUpdateBranch(), { wrapper: wrapper() });

		const updated = await result.current.mutateAsync({ id: 2, isMain: true });

		expect(updated.isMain).toBe(true);
	});
});
