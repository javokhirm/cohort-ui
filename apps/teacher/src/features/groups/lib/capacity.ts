/**
 * The "filled / capacity" figure turns amber as the group approaches full and
 * red once it is full — the teacher reads pressure off the color, not the math.
 */
export function capacityToneClass(filled: number, capacity: number | null): string {
	if (capacity === null || capacity <= 0) return 'text-primary';
	if (filled >= capacity) return 'text-tone-red-fg';
	return filled / capacity > 0.85 ? 'text-tone-amber-fg' : 'text-primary';
}

/** Attendance bands from the design: ≥90 healthy, ≥80 watch, below that a problem. */
export function attendanceToneClass(rate: number): string {
	if (rate >= 90) return 'text-tone-green-fg';
	return rate >= 80 ? 'text-tone-amber-fg' : 'text-tone-red-fg';
}

/** `12/15`, or just the headcount when the group has no capacity set. */
export function capacityLabel(filled: number, capacity: number | null): string {
	return capacity === null ? String(filled) : `${filled}/${capacity}`;
}
