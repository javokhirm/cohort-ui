/**
 * Course dropdown/filter options.
 *
 * Values and keys only — never display text. A label captured at module load
 * would freeze in whatever language was active when the module first evaluated
 * (conventions.md §7); screens resolve `labelKey` against `common:state.*` at
 * render, so a language switch re-translates the chips.
 */

/** Status dropdown options for the edit form (`isActive` retire/restore). */
export const COURSE_STATUS_OPTIONS: {
	value: 'active' | 'inactive';
	/** Leaf key under the shared `common:state.*`. */
	labelKey: 'active' | 'inactive';
}[] = [
	{ value: 'active', labelKey: 'active' },
	{ value: 'inactive', labelKey: 'inactive' },
];

/** Active-state filter chips for the list toolbar (maps to `?isActive=`). */
export const COURSE_STATUS_FILTERS: {
	value: 'active' | 'inactive' | undefined;
	/** Leaf key under the shared `common:state.*`. */
	labelKey: 'all' | 'active' | 'inactive';
}[] = [
	{ value: undefined, labelKey: 'all' },
	{ value: 'active', labelKey: 'active' },
	{ value: 'inactive', labelKey: 'inactive' },
];
