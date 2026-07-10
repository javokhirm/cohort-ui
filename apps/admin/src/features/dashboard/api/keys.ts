/**
 * Query keys for the staff dashboard. Each panel is its own key so it caches and
 * refetches independently; the active branch selection is folded into every key
 * (like every other list query) so switching branches refetches the dashboard.
 */

export interface DashboardScope {
	branchIds?: number[];
}

export const dashboardKeys = {
	all: ['dashboard'] as const,

	stats: (scope: DashboardScope) => [...dashboardKeys.all, 'stats', scope] as const,
	revenueTrend: (scope: DashboardScope, months: number) =>
		[...dashboardKeys.all, 'revenue-trend', months, scope] as const,
	enrollmentTrend: (scope: DashboardScope, months: number) =>
		[...dashboardKeys.all, 'enrollment-trend', months, scope] as const,
	attendanceTrend: (scope: DashboardScope, days: number) =>
		[...dashboardKeys.all, 'attendance-trend', days, scope] as const,
	leadFunnel: (scope: DashboardScope) =>
		[...dashboardKeys.all, 'lead-funnel', scope] as const,
};
