import type { CreateGuardianInput, LinkGuardianInput } from '../api/students.mutations';
import { splitFullName } from '../schemas/student-form.schema';

/** The guardian fields every form that can connect a guardian collects. */
interface GuardianFormValues {
	guardianPhone?: string;
	guardianName?: string;
	guardianRelation?: 'mother' | 'father' | 'guardian';
}

/**
 * Build the `POST /students/:id/guardians` body — a BRAND-NEW guardian.
 *
 * Callers use this only when there is no confirmed existing match
 * (`connectedGuardianUserId` is unset): the phone/name the operator typed
 * describe a person this tenant does not know yet.
 */
export function buildCreateGuardianInput(
	studentId: number,
	values: GuardianFormValues,
	options: { isPrimary?: boolean; canPickup?: boolean } = {},
): CreateGuardianInput {
	const { firstName, lastName } = splitFullName(values.guardianName ?? '');

	return {
		studentId,
		phone: values.guardianPhone || undefined,
		firstName,
		lastName,
		relation: values.guardianRelation ?? 'guardian',
		isPrimary: options.isPrimary ?? false,
		canPickup: options.canPickup ?? true,
	};
}

/**
 * Build the `POST /students/:id/guardians/:guardianUserId` body — link an
 * ALREADY-CONFIRMED existing guardian.
 *
 * Carries only `relation`/`isPrimary`/`canPickup`: the id (not a name) is what
 * identifies the guardian, and there is nowhere on the wire to send a name even
 * if the operator had typed one.
 */
export function buildLinkGuardianInput(
	studentId: number,
	guardianUserId: number,
	values: Pick<GuardianFormValues, 'guardianRelation'>,
	options: { isPrimary?: boolean; canPickup?: boolean } = {},
): LinkGuardianInput {
	return {
		studentId,
		guardianUserId,
		relation: values.guardianRelation ?? 'guardian',
		isPrimary: options.isPrimary ?? false,
		canPickup: options.canPickup ?? true,
	};
}
