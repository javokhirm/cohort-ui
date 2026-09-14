import type { AddGuardianInput } from '../api/students.mutations';
import { splitFullName } from '../schemas/student-form.schema';

/** The guardian fields every form that can connect a guardian collects. */
interface GuardianFormValues {
	guardianPhone?: string;
	guardianName?: string;
	guardianRelation?: 'mother' | 'father' | 'guardian';
	connectedGuardianUserId?: number;
}

/**
 * Build the `POST /students/:id/guardians` body from the guardian form block.
 *
 * A confirmed existing guardian is sent as **phone + relation only**: the
 * backend resolves that number to the person this tenant already knows and
 * ignores any name, so sending one would just imply an edit that never happens.
 * A new guardian carries the name the operator typed.
 */
export function buildAddGuardianInput(
	studentId: number,
	values: GuardianFormValues,
	options: { isPrimary?: boolean; canPickup?: boolean } = {},
): AddGuardianInput {
	const base = {
		studentId,
		phone: values.guardianPhone || undefined,
		relation: values.guardianRelation ?? 'guardian',
		isPrimary: options.isPrimary ?? false,
		canPickup: options.canPickup ?? true,
	};

	if (values.connectedGuardianUserId != null) return base;

	const { firstName, lastName } = splitFullName(values.guardianName ?? '');
	return { ...base, firstName, lastName };
}
