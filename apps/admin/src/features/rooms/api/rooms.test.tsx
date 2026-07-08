import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/test/server';
import { roomHandlers } from '@/test/handlers';

import { useRoomList } from './rooms.queries';
import { useCreateRoom, useUpdateRoom } from './rooms.mutations';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useRoomList', () => {
	it('fetches the room directory', async () => {
		const { result } = renderHook(() => useRoomList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(3);
		expect(result.current.data?.rows[0]?.name).toBe('Room 204');
	});

	it('filters by active state', async () => {
		const { result } = renderHook(
			() => useRoomList({ page: 1, limit: 20, isActive: false }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(1);
		expect(result.current.data?.rows[0]?.isActive).toBe(false);
	});

	it('renders an empty directory', async () => {
		server.use(roomHandlers.empty);
		const { result } = renderHook(() => useRoomList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(0);
		expect(result.current.data?.rows).toHaveLength(0);
	});

	it('surfaces an error when the request fails', async () => {
		server.use(roomHandlers.serverError);
		const { result } = renderHook(() => useRoomList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe('useCreateRoom', () => {
	it('creates a room', async () => {
		const { result } = renderHook(() => useCreateRoom(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			branchId: 1,
			name: 'Room 301',
			capacity: 18,
			type: 'classroom',
		});

		expect(created.id).toBe(99);
		expect(created.name).toBe('Room 301');
		expect(created.type).toBe('classroom');
		expect(created.isActive).toBe(true);
	});
});

describe('useUpdateRoom', () => {
	it('retires a room via isActive', async () => {
		const { result } = renderHook(() => useUpdateRoom(), { wrapper: wrapper() });

		const updated = await result.current.mutateAsync({ id: 1, isActive: false });

		expect(updated.id).toBe(1);
		expect(updated.isActive).toBe(false);
	});
});
