import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { plansKeys } from '@/api/plans/keys';
import { listPlans } from '@/api/plans/plans.queries';
import { createPlan, updatePlan } from '@/api/plans/plans.mutations';

export function usePlans() {
	return useQuery({
		queryKey: plansKeys.list(),
		queryFn: () => listPlans({ limit: 100 }),
	});
}

export function useCreatePlan(options?: { onSuccess?: () => void }) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createPlan,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: plansKeys.all });
			options?.onSuccess?.();
		},
	});
}

export function useUpdatePlan(options?: { onSuccess?: () => void }) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: number;
			input: Parameters<typeof updatePlan>[1];
		}) => updatePlan(id, input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: plansKeys.all });
			options?.onSuccess?.();
		},
	});
}
