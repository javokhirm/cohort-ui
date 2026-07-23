import { formatNumber } from '@repo/utils';
import type { PlanView } from '@/api/plans/types';
import type { useAppT } from '@/locales';

import { ALL_FEATURES, type FeatureKey } from './constants';

export function limitLabel(
	t: ReturnType<typeof useAppT<'tenants'>>,
	value: number | null,
	kind: 'branches' | 'students',
): string {
	if (kind === 'branches') {
		return value === null
			? t('limits.branchesUnlimited')
			: t('limits.branches', { count: formatNumber(value) });
	}
	return value === null
		? t('limits.studentsUnlimited')
		: t('limits.students', { count: formatNumber(value) });
}

export function planFeatures(plan: PlanView): FeatureKey[] {
	return ALL_FEATURES.filter((f) => Boolean(plan.features[f]));
}
