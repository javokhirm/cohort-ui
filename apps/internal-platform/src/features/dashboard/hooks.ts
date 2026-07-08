import { useQuery } from '@tanstack/react-query';

import { dashboardKeys } from '@/api/dashboard/keys';
import { getDashboard } from '@/api/dashboard/dashboard.queries';

export function useDashboard() {
	return useQuery({
		queryKey: dashboardKeys.overview(),
		queryFn: getDashboard,
	});
}
