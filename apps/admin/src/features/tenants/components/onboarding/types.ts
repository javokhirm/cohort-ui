import type { PlanView } from '@/api/plans/types';

export type OnboardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type OnboardFormData = {
	centerName: string;
	city: string;
	subdomain: string;
	ownerFirstName: string;
	ownerLastName: string;
	ownerPhone: string;
	ownerEmail: string;
	ownerPassword: string;
	planId: number | null;
	branchName: string;
	branchCode: string;
};

export const STEP_LABELS = ['Business', 'Subdomain', 'Owner', 'Plan', 'Branch', 'Review'];

export const EMPTY_FORM: OnboardFormData = {
	centerName: '',
	city: 'Tashkent',
	subdomain: '',
	ownerFirstName: '',
	ownerLastName: '',
	ownerPhone: '',
	ownerEmail: '',
	ownerPassword: '',
	planId: null,
	branchName: '',
	branchCode: '',
};

export function planLimits(plan: PlanView): string {
	const branches =
		plan.maxBranches === null
			? 'Unlimited branches'
			: `${plan.maxBranches} branch${plan.maxBranches === 1 ? '' : 'es'}`;
	const students =
		plan.maxStudents === null
			? 'Unlimited students'
			: `${plan.maxStudents.toLocaleString('ru-RU')} students`;
	return `${branches} · ${students}`;
}
