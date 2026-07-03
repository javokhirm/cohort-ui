/**
 * The staff-app mirror of the backend permission catalog
 * (`educore-be/src/infra/database/seeders/permissions.seeder.ts`). Codes are the
 * single source of truth the backend's `RbacGuard` enforces; here they only gate
 * the UI cosmetically (`<Can>`, `usePermissions().can`, `requirePermission`).
 *
 * The resolved set for the current session comes from `GET /manage/me`
 * (see `@/api/me`) — this list is the closed vocabulary those codes are typed
 * against, so a typo in a gate is a compile error rather than a silent
 * always-hidden button. Keep it in sync with the backend catalog; when the
 * backend adds a code, add it here too.
 */
export const PERMISSION_CODES = [
	// student
	'student.create',
	'student.read',
	'student.update',
	'student.delete',
	'student.guardian.manage',
	// staff
	'staff.create',
	'staff.read',
	'staff.update',
	'staff.delete',
	// role
	'role.read',
	'role.create',
	'role.update',
	'role.permissions.manage',
	'role.assign',
	// course
	'course.read',
	'course.create',
	'course.update',
	// room
	'room.read',
	'room.create',
	'room.update',
	// group
	'group.read',
	'group.create',
	'group.update',
	// session
	'session.read',
	'session.update',
	// enrollment
	'enrollment.read',
	'enrollment.create',
	'enrollment.update',
	// attendance
	'attendance.read',
	'attendance.mark',
	// grading scale
	'grading-scale.manage',
	// assessment
	'assessment.read',
	'assessment.create',
	'assessment.update',
	'assessment.publish',
	// report card
	'report-card.generate',
	'report-card.publish',
	// fee plan
	'fee-plan.manage',
	// invoice
	'invoice.read',
	'invoice.create',
	'invoice.update',
	'invoice.void',
	'invoice.discount.apply',
	// payment
	'payment.read',
	'payment.record',
	// discount
	'discount.manage',
	// expense
	'expense.create',
	'expense.update',
	'expense.delete',
	// payroll
	'payroll.read',
	'payroll.create',
	'payroll.approve',
	'payroll.pay',
	// lead
	'lead.read',
	'lead.create',
	'lead.update',
	'lead.convert',
	'lead.activity.create',
	// material
	'material.create',
	'material.read',
	'material.delete',
	// notification
	'notification-template.manage',
	'notification.send',
	// reminder
	'reminder-rule.manage',
	// audit
	'audit.read',
	// dashboard
	'dashboard.read',
	// settings & branches
	'settings.manage',
	'branch.read',
	'branch.create',
	'branch.update',
] as const;

/** A single permission code from the catalog (e.g. `'invoice.void'`). */
export type PermissionCode = (typeof PERMISSION_CODES)[number];

/** One code, or a list to be matched with **any-of** semantics. */
export type PermissionRequirement = PermissionCode | PermissionCode[];

/**
 * True when `granted` satisfies `required` — any-of: a single code must be
 * present; a list passes if the user holds at least one of the codes (used for
 * nav entries that map to several actions, e.g. Expenses). An empty list never
 * passes.
 */
export function permitted(
	granted: ReadonlySet<string> | readonly string[],
	required: PermissionRequirement,
): boolean {
	const has =
		granted instanceof Set
			? (code: string) => granted.has(code)
			: (code: string) => (granted as readonly string[]).includes(code);
	return Array.isArray(required) ? required.some(has) : has(required);
}
