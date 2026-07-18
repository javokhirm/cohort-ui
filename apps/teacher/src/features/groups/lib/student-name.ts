/**
 * Name helpers for roster rows, which carry `firstName`/`lastName` separately
 * and either may be null.
 *
 * The app already has two copies of a `initials(fullName)` helper
 * (`features/attendance/components/AttendanceList.tsx`,
 * `features/marks/components/MarksList.tsx`) that split a pre-joined string.
 * These take the split fields instead, so there is nothing to reuse. Flag for
 * promotion to `@repo/utils` if a third feature needs the same pair.
 */

/** "Aziza Bekmurodova", or the student code's fallback when both parts are null. */
export function fullName(
	firstName: string | null,
	lastName: string | null,
	fallback = 'Unnamed student',
): string {
	const joined = [firstName, lastName].filter(Boolean).join(' ').trim();
	return joined || fallback;
}

/** "AB" — first letters of both names, or "?" when there is nothing to take. */
export function initials(firstName: string | null, lastName: string | null): string {
	const two = (firstName?.[0] ?? '') + (lastName?.[0] ?? '');
	return two.toUpperCase() || '?';
}
