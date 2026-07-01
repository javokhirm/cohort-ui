import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { roomsKeys } from './keys';
import type { RoomResponse, RoomType } from './rooms.queries';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateRoomInput {
	branchId: number;
	name: string;
	capacity: number;
	type?: RoomType | null;
}

export interface UpdateRoomInput {
	id: number;
	branchId?: number;
	name?: string;
	capacity?: number;
	type?: RoomType | null;
	isActive?: boolean;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateRoom() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateRoomInput) =>
			manageApi.post<RoomResponse>('/rooms', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: roomsKeys.rooms() });
		},
	});
}

export function useUpdateRoom() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateRoomInput) =>
			manageApi.patch<RoomResponse>(`/rooms/${id}`, body),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: roomsKeys.rooms() });
		},
	});
}
