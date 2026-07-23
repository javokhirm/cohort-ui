/**
 * Branch as a form value.
 *
 * Some resources (courses, fee plans) have a nullable branch where `null` means
 * "shared across all branches". Those forms model the picker as a string and use
 * this sentinel to stand in for the shared choice, converting to `number | null`
 * at submit time via the helpers below. Required single-branch pickers
 * (students, staff, rooms, …) don't use the sentinel — they hold the branch id
 * directly. Shared here because both patterns span multiple features.
 */
export const SHARED_BRANCH_VALUE = 'shared';

/** Form branch string → payload `branchId` (`null` when shared). */
export function branchToPayload(branch: string): number | null {
	return branch === SHARED_BRANCH_VALUE ? null : Number(branch);
}

/** Payload `branchId` → form branch string. */
export function branchToForm(branchId: number | null): string {
	return branchId == null ? SHARED_BRANCH_VALUE : String(branchId);
}
