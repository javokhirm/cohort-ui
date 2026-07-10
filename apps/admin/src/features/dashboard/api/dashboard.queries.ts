import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';

import { dashboardKeys, type DashboardScope } from './keys';
import type {
	AttendanceTrendResponse,
	DashboardStats,
	EnrollmentTrendResponse,
	LeadFunnelResponse,
	RevenueTrendResponse,
} from './types';

// Every hook folds the global branch selection into its params (and thus its
// query key), so switching the branch selector refetches the whole dashboard.
// The backend auto-narrows to the caller's scope when `branchIds` is omitted.

export function useDashboardStats() {
	const branchIds = useActiveBranchIds();
	const scope: DashboardScope = { branchIds };
	return useQuery({
		queryKey: dashboardKeys.stats(scope),
		queryFn: () =>
			manageApi.get<DashboardStats>('/dashboard/stats', { params: scope }),
		placeholderData: keepPreviousData,
	});
}

export function useRevenueTrend(months = 12) {
	const branchIds = useActiveBranchIds();
	const scope: DashboardScope = { branchIds };
	return useQuery({
		queryKey: dashboardKeys.revenueTrend(scope, months),
		queryFn: () =>
			manageApi.get<RevenueTrendResponse>('/dashboard/revenue-trend', {
				params: { ...scope, months },
			}),
		placeholderData: keepPreviousData,
	});
}

export function useEnrollmentTrend(months = 12) {
	const branchIds = useActiveBranchIds();
	const scope: DashboardScope = { branchIds };
	return useQuery({
		queryKey: dashboardKeys.enrollmentTrend(scope, months),
		queryFn: () =>
			manageApi.get<EnrollmentTrendResponse>('/dashboard/enrollment-trend', {
				params: { ...scope, months },
			}),
		placeholderData: keepPreviousData,
	});
}

export function useAttendanceTrend(days = 14) {
	const branchIds = useActiveBranchIds();
	const scope: DashboardScope = { branchIds };
	return useQuery({
		queryKey: dashboardKeys.attendanceTrend(scope, days),
		queryFn: () =>
			manageApi.get<AttendanceTrendResponse>('/dashboard/attendance-trend', {
				params: { ...scope, days },
			}),
		placeholderData: keepPreviousData,
	});
}

export function useLeadFunnel() {
	const branchIds = useActiveBranchIds();
	const scope: DashboardScope = { branchIds };
	return useQuery({
		queryKey: dashboardKeys.leadFunnel(scope),
		queryFn: () =>
			manageApi.get<LeadFunnelResponse>('/dashboard/lead-funnel', {
				params: scope,
			}),
		placeholderData: keepPreviousData,
	});
}
