import type { RoomType } from '../api/rooms.queries';

/** Type dropdown options for the room form. */
export const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
	{ value: 'classroom', label: 'Classroom' },
	{ value: 'lab', label: 'Lab' },
	{ value: 'online', label: 'Online' },
];

/** Status dropdown options for the edit form (`isActive` retire/restore). */
export const ROOM_STATUS_OPTIONS = [
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
];

/** Active-state filter chips for the list toolbar (maps to `?isActive=`). */
export const ROOM_STATUS_FILTERS: {
	value: 'active' | 'inactive' | undefined;
	label: string;
}[] = [
	{ value: undefined, label: 'All' },
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
];
