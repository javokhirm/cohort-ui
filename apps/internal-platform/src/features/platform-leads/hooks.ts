import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { platformLeadsKeys } from '@/api/platformLeads/keys';
import { listPlatformLeads } from '@/api/platformLeads/platformLeads.queries';
import type { PlatformLeadListFilters } from '@/api/platformLeads/types';

export function usePlatformLeadList(filters: PlatformLeadListFilters) {
	return useQuery({
		queryKey: platformLeadsKeys.list(filters),
		queryFn: () => listPlatformLeads(filters),
		placeholderData: keepPreviousData,
	});
}
