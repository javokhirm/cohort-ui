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
	/** Distinct from `roomList` — that key stores a flat `PaginatedResult` page (dropdowns), this stores `useInfiniteQuery`'s `{ pages }` shape (the card grid). */
	roomInfiniteList: (filters: Omit<RoomListFilters, 'page'>) =>
		[...roomsKeys.rooms(), 'infinite-list', filters] as const,
};
