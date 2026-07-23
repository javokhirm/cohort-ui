import type { useAppT } from '@/locales';

export type FeatureKey =
	'billing' | 'payroll' | 'assessments' | 'telegram_bot' | 'api_access';

export const ALL_FEATURES: FeatureKey[] = [
	'billing',
	'payroll',
	'assessments',
	'telegram_bot',
	'api_access',
];

type PlansT = ReturnType<typeof useAppT<'plans'>>;

/** Localized feature name — keeps the key mapping type-safe. */
export function featureLabel(t: PlansT, key: FeatureKey): string {
	switch (key) {
		case 'billing':
			return t('feature.billing');
		case 'payroll':
			return t('feature.payroll');
		case 'assessments':
			return t('feature.assessments');
		case 'telegram_bot':
			return t('feature.telegram_bot');
		case 'api_access':
			return t('feature.api_access');
	}
}

/** Localized feature description. */
export function featureDescription(t: PlansT, key: FeatureKey): string {
	switch (key) {
		case 'billing':
			return t('feature.billingDesc');
		case 'payroll':
			return t('feature.payrollDesc');
		case 'assessments':
			return t('feature.assessmentsDesc');
		case 'telegram_bot':
			return t('feature.telegram_botDesc');
		case 'api_access':
			return t('feature.api_accessDesc');
	}
}
