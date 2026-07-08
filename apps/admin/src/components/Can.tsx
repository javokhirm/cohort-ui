import type { ReactNode } from 'react';

import { usePermissions } from '@/features/auth/hooks';
import { useSessionStore } from '@/store/sessionStore';
import type { PermissionRequirement } from '@/lib/auth/permissions';

interface CanProps {
	/** Permission code(s) required — any-of. */
	permission?: PermissionRequirement;
	/** Role name(s) required — any-of. Combined with `permission` as AND. */
	role?: string[];
	/** Rendered when the check fails (default: nothing). */
	fallback?: ReactNode;
	children: ReactNode;
}

/**
 * Cosmetic authorization gate (docs/auth-and-rbac.md §5). Renders `children`
 * only when the session satisfies the requirement; the backend still enforces
 * every rule, so this only hides what the user can't do. Reactive — it updates
 * when `/manage/me` resolves the permission set.
 *
 * ```tsx
 * <Can permission="invoice.void"><VoidButton /></Can>
 * <Can permission={['expense.create', 'expense.update']}><ExpensesNav /></Can>
 * ```
 */
export function Can({ permission, role, fallback = null, children }: CanProps) {
	const { can } = usePermissions();
	const roles = useSessionStore((s) => s.user?.roles);

	const permissionOk = permission ? can(permission) : true;
	const roleOk = role ? !!roles && role.some((r) => roles.includes(r)) : true;

	return <>{permissionOk && roleOk ? children : fallback}</>;
}
