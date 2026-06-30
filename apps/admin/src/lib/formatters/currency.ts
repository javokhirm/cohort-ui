const NUMBER_FORMATTER = new Intl.NumberFormat('ru-RU');

/**
 * Full UZS amount with thousands separator: "1 234 567".
 * Use when "UZS" appears in the surrounding UI (column header, label, adjacent span).
 */
export function formatPrice(amount: number): string {
	return NUMBER_FORMATTER.format(amount);
}

/** Percentage with one decimal place: "14.3%". Use for churn rate, growth, ratios. */
export function formatPercent(n: number, decimals = 1): string {
	return `${n.toFixed(decimals)}%`;
}

/**
 * Compact KPI display with UZS suffix: "1.2B UZS", "1.2M UZS", "234K UZS".
 * Use in stat cards and summary totals.
 */
export function formatPriceCompact(amount: number, currency: string = 'UZS'): string {
	if (amount >= 1_000_000_000)
		return `${(amount / 1_000_000_000).toFixed(1)}B ${currency}`;
	if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ${currency}`;
	if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K ${currency}`;
	return `${amount} ${currency}`;
}

/**
 * Compact value without currency suffix, for chart axis ticks.
 * e.g. "1.2M", "234K"
 */
export function formatPriceAxis(amount: number): string {
	if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
	if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
	if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
	return `${amount}`;
}
