/** `2026-07` → `July 2026`. */
export function formatMonthLabel(month: string): string {
	const [year, monthPart] = month.split('-');
	if (!year || !monthPart) return month;
	const date = new Date(Number(year), Number(monthPart) - 1, 1);
	return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
