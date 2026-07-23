import type { RoomType } from '../api/rooms.queries';

/**
 * Room dropdown/filter options.
 *
 * These arrays hold **values and keys, never display text** — a label captured
 * at module load would freeze in whatever language was active when the module
 * first evaluated (conventions.md §7). Screens resolve them at render:
 * room *types* through `useStatusLabel('room', …)`, which reads the same
 * `enums.domain.room.*` catalog that colors the `StatusBadge`; active/inactive
 * through `common:state.*`.
 */

/** Type dropdown options for the room form. */
export const ROOM_TYPE_OPTIONS: { value: RoomType }[] = [
	{ value: 'classroom' },
	{ value: 'lab' },
	{ value: 'online' },
];

/** Status dropdown options for the edit form (`isActive` retire/restore). */
export const ROOM_STATUS_OPTIONS: {
	value: 'active' | 'inactive';
	/** Leaf key under the shared `common:state.*`. */
	labelKey: 'active' | 'inactive';
}[] = [
	{ value: 'active', labelKey: 'active' },
	{ value: 'inactive', labelKey: 'inactive' },
];

/** Active-state filter chips for the list toolbar (maps to `?isActive=`). */
export const ROOM_STATUS_FILTERS: {
	value: 'active' | 'inactive' | undefined;
	/** Leaf key under the shared `common:state.*`. */
	labelKey: 'all' | 'active' | 'inactive';
}[] = [
	{ value: undefined, labelKey: 'all' },
	{ value: 'active', labelKey: 'active' },
	{ value: 'inactive', labelKey: 'inactive' },
];
