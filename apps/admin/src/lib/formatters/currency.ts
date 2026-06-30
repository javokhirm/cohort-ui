const UZS_FORMATTER = new Intl.NumberFormat('ru-RU');

/**
 * Full UZS amount with thousands separator: "1 234 567".
 * Use when "UZS" appears in the surrounding UI (column header, label, adjacent span).
 */
export function formatUzs(amount: number): string {
	return UZS_FORMATTER.format(amount);
}

/**
 * Compact KPI display with UZS suffix: "1.2B UZS", "1.2M UZS", "234K UZS".
 * Use in stat cards and summary totals.
 */
export function formatUzsCompact(amount: number): string {
	if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B UZS`;
	if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M UZS`;
	if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K UZS`;
	return `${amount} UZS`;
}

/**
 * Compact value without currency suffix, for chart axis ticks.
 * e.g. "1.2M", "234K"
 */
export function formatUzsAxis(amount: number): string {
	if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
	if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
	if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
	return `${amount}`;
}
