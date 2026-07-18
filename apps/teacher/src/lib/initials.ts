/**
 * "First Last" → "FL"; a single-word name → its first letter; nothing usable → "?".
 *
 * The session roster screens carry a pre-joined `studentName`, so they can't use
 * the group/student features' `initials(firstName, lastName)`
 * (`features/groups/lib/student-name.ts`). This is the joined-string shape, in
 * one place rather than copied into each list. Promotion candidate for
 * `@repo/utils` if a second app needs either shape.
 */
export function initialsFromName(name: string): string {
	const parts = name.trim().split(/\s+/);
	const two = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
	return two.toUpperCase() || '?';
}
