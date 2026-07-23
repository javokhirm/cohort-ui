import type { PlanView } from '@/api/plans/types';
import { formatNumber } from '@repo/utils';
import type { useAppT } from '@/locales';

export type OnboardStep = 1 | 2 | 3 | 4 | 5;

export type OnboardFormData = {
	centerName: string;
	city: string;
	ownerFirstName: string;
	ownerLastName: string;
	ownerPhone: string;
	ownerEmail: string;
	ownerPassword: string;
	planId: number | null;
	branchName: string;
	branchCode: string;
};

/** Step labels are user-facing, so they resolve from the translator at render. */
export function stepLabels(t: ReturnType<typeof useAppT<'tenants'>>): string[] {
	return [
		t('onboarding.businessTitle'),
		t('onboarding.owner'),
		t('onboarding.plan'),
		t('onboarding.initialBranch'),
		t('onboarding.reviewTitle'),
	];
}

export const EMPTY_FORM: OnboardFormData = {
	centerName: '',
	city: 'Tashkent',
	ownerFirstName: '',
	ownerLastName: '',
	ownerPhone: '',
	ownerEmail: '',
	ownerPassword: '',
	planId: null,
	branchName: '',
	branchCode: '',
};

export function planLimits(
	t: ReturnType<typeof useAppT<'tenants'>>,
	plan: PlanView,
): string {
	const branches =
		plan.maxBranches === null
			? t('limits.branchesUnlimited')
			: t('limits.branches', { count: plan.maxBranches });
	const students =
		plan.maxStudents === null
			? t('limits.studentsUnlimited')
			: t('limits.students', { count: formatNumber(plan.maxStudents) });
	return `${branches} · ${students}`;
}
