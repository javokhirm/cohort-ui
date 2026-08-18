import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { platformSmsKeys } from '@/api/platformSms/keys';
import {
	syncPlatformTemplateModeration,
	testPlatformSms,
} from '@/api/platformSms/platformSms.mutations';
import {
	getPlatformSmsBalance,
	getPlatformSmsStatus,
	listPlatformDefaultTemplates,
	listPlatformTemplateModeration,
} from '@/api/platformSms/platformSms.queries';

export function usePlatformSmsStatus() {
	return useQuery({
		queryKey: platformSmsKeys.status(),
		queryFn: getPlatformSmsStatus,
	});
}

/** `retry: false` — a 400 here means "not configured yet", not a transient failure. */
export function usePlatformSmsBalance(enabled: boolean) {
	return useQuery({
		queryKey: platformSmsKeys.balance(),
		queryFn: getPlatformSmsBalance,
		enabled,
		retry: false,
		staleTime: 5 * 60 * 1000,
	});
}

/** Long `staleTime` — the catalog only changes on a backend deploy. */
export function usePlatformDefaultTemplates() {
	return useQuery({
		queryKey: platformSmsKeys.defaults(),
		queryFn: listPlatformDefaultTemplates,
		staleTime: 30 * 60 * 1000,
	});
}

export function usePlatformTemplateModeration() {
	return useQuery({
		queryKey: platformSmsKeys.moderation(),
		queryFn: listPlatformTemplateModeration,
		staleTime: 60 * 1000,
	});
}

export function useTestPlatformSms() {
	return useMutation({ mutationFn: testPlatformSms });
}

export function useSyncPlatformTemplateModeration() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: syncPlatformTemplateModeration,
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: platformSmsKeys.moderation(),
			});
		},
	});
}
