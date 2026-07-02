export interface RoomListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	isActive?: boolean;
}

export const roomsKeys = {
	all: ['rooms'] as const,

	rooms: () => [...roomsKeys.all, 'room'] as const,
	roomList: (filters: RoomListFilters) =>
		[...roomsKeys.rooms(), 'list', filters] as const,
};
