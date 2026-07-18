/**
 * Name helpers for the student screen, whose payloads carry `firstName`/
 * `lastName` separately. A twin of `features/groups/lib/student-name.ts` —
 * features here never import each other's internals, so the pair is duplicated
 * rather than shared. Flag for promotion to `@repo/utils` if a third feature
 * needs it.
 */

/** "Aziza Bekmurodova", or a fallback when both parts are null. */
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

/** `mother` → `Mother`, for display beside a guardian's name. */
export function relationLabel(relation: string): string {
	return relation.charAt(0).toUpperCase() + relation.slice(1);
}
