import { formatNumber } from '@repo/utils';
import type { PlanView } from '@/api/plans/types';

import { ALL_FEATURES, type FeatureKey } from './constants';

export function limitLabel(value: number | null, unit: string): string {
	if (value === null) return `Unlimited ${unit}`;
	return `${formatNumber(value)} ${unit}`;
}

export function planFeatures(plan: PlanView): FeatureKey[] {
	return ALL_FEATURES.filter((f) => Boolean(plan.features[f]));
}
