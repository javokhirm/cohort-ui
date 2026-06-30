const NUMBER_FORMATTER = new Intl.NumberFormat('ru-RU');

/** Plain integer with thousands separator: "1 234 567". Use for counts (students, branches). */
export function formatNumber(n: number): string {
	return NUMBER_FORMATTER.format(n);
}
