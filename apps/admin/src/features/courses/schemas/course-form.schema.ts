import { z } from 'zod';

/**
 * Branch is nullable on courses (`null` = shared across all branches), so the
 * form models the branch picker as a string and this sentinel stands in for
 * "shared". Converted to `number | null` at submit time.
 */
export const SHARED_BRANCH_VALUE = 'shared';

const durationWeeks = z
	.number({ error: 'Enter a whole number of weeks' })
	.int('Enter a whole number of weeks')
	.min(1, 'Duration must be at least 1 week')
	.optional();

export const createCourseSchema = z.object({
	name: z.string().min(1, 'Course name is required'),
	branch: z.string(),
	// Required: every group of this course bills on the plan. Modelled as a
	// string because it comes from a `FormSelect`; `Number()`ed at submit time.
	feePlan: z.string().min(1, 'Fee plan is required'),
	level: z.string().optional(),
	defaultDurationWeeks: durationWeeks,
	description: z.string().optional(),
});

export const editCourseSchema = createCourseSchema.extend({
	status: z.enum(['active', 'inactive']),
});

export type CreateCourseFormValues = z.infer<typeof createCourseSchema>;
export type EditCourseFormValues = z.infer<typeof editCourseSchema>;

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
