import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import type { useAppT } from '@/locales';

/**
 * Branch is nullable on courses (`null` = shared across all branches), so the
 * form models the branch picker as a string and this sentinel stands in for
 * "shared". Converted to `number | null` at submit time.
 */
export const SHARED_BRANCH_VALUE = 'shared';

type CourseT = ReturnType<typeof useAppT<'courses'>>;

/**
 * Schema factories — the messages are user-facing, so they resolve at render
 * rather than at module load (conventions.md §7). Callers memoise on the
 * translator.
 */
export function createCourseSchema(t: Translator<'validation'>, tc: CourseT) {
	return z.object({
		name: z.string().min(1, t('required')),
		branch: z.string(),
		// Required: every group of this course bills on the plan. Modelled as a
		// string because it comes from a `FormSelect`; `Number()`ed at submit time.
		feePlan: z.string().min(1, t('required')),
		level: z.string().optional(),
		defaultDurationWeeks: z
			.number({ error: t('integerInvalid') })
			.int(t('integerInvalid'))
			.min(1, tc('validation.durationMin'))
			.optional(),
		description: z.string().optional(),
	});
}

export function editCourseSchema(t: Translator<'validation'>, tc: CourseT) {
	return createCourseSchema(t, tc).extend({
		status: z.enum(['active', 'inactive']),
	});
}

export type CreateCourseFormValues = z.infer<ReturnType<typeof createCourseSchema>>;
export type EditCourseFormValues = z.infer<ReturnType<typeof editCourseSchema>>;

/** Form branch string → payload `branchId` (`null` when shared). */
export function branchToPayload(branch: string): number | null {
	return branch === SHARED_BRANCH_VALUE ? null : Number(branch);
}

/** Payload `branchId` → form branch string. */
export function branchToForm(branchId: number | null): string {
	return branchId == null ? SHARED_BRANCH_VALUE : String(branchId);
}

/**
 * Only a shared plan (`branchId: null`) or one in the course's own branch may
 * back the course — the server enforces the same rule with
 * `FEE_PLAN_BRANCH_MISMATCH`. A shared course therefore accepts only a shared
 * plan, which falls out of comparing against `branchToPayload`'s `null`.
 */
export function isPlanBranchCompatible(
	planBranchId: number | null,
	courseBranch: string,
): boolean {
	return planBranchId == null || planBranchId === branchToPayload(courseBranch);
}
