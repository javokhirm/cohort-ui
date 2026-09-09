import {
	BookOpen,
	Briefcase,
	Building2,
	CalendarClock,
	CalendarDays,
	CreditCard,
	DoorOpen,
	FileText,
	Filter,
	GraduationCap,
	LayoutDashboard,
	Layers,
	MessageSquare,
	Receipt,
	SlidersHorizontal,
	Tag,
	Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { usePermissions } from '@/features/auth/hooks';
import type { PermissionRequirement } from '@/lib/auth/permissions';

/** Leaf keys under the `nav` namespace's `group.*` / `item.*` — resolved at
 * render, not module load, so language switches re-translate the sidebar. Typed
 * as unions (not `string`) so a typo or a removed catalog key fails check-types. */
export type NavGroupKey =
	| 'overview'
	| 'crm'
	| 'people'
	| 'academics'
	| 'finance'
	| 'engagement'
	| 'administration';
export type NavItemKey =
	| 'dashboard'
	| 'leads'
	| 'students'
	| 'staff'
	| 'courses'
	| 'rooms'
	| 'groups'
	| 'schedule'
	| 'invoices'
	| 'payments'
	| 'feePlans'
	| 'billingPolicy'
	| 'discounts'
	| 'expenses'
	| 'payroll'
	| 'notifications'
	| 'branches';

export type NavItemDef = {
	id: string;
	/** i18n key under `nav:item.*`. */
	label: NavItemKey;
	Icon: LucideIcon;
	href: string;
	badge?: string;
	/** Permission(s) that reveal this item — any-of. Mirrors the route guard. */
	permission: PermissionRequirement;
};

export type NavGroupDef = {
	/** i18n key under `nav:group.*`. */
	label: NavGroupKey;
	items: NavItemDef[];
};

/**
 * The console's whole navigation — seventeen destinations in seven groups,
 * driving the desktop sidebar rail and the phone drawer from one list so the
 * two chromes can never drift apart. Labels are catalog keys, translated at
 * render; each item carries the permission that reveals it.
 */
export const NAV_GROUPS: NavGroupDef[] = [
	{
		label: 'overview',
		items: [
			{
				id: 'dashboard',
				label: 'dashboard',
				Icon: LayoutDashboard,
				href: '/',
				permission: 'dashboard.read',
			},
		],
	},
	{
		label: 'crm',
		items: [
			{
				id: 'leads',
				label: 'leads',
				Icon: Filter,
				href: '/leads',
				permission: 'lead.read',
			},
		],
	},
	{
		label: 'people',
		items: [
			{
				id: 'students',
				label: 'students',
				Icon: GraduationCap,
				href: '/students',
				permission: 'student.read',
			},
			{
				id: 'staff',
				label: 'staff',
				Icon: Briefcase,
				href: '/staff',
				permission: 'staff.read',
			},
		],
	},
	{
		label: 'academics',
		items: [
			{
				id: 'courses',
				label: 'courses',
				Icon: BookOpen,
				href: '/courses',
				permission: 'course.read',
			},
			{
				id: 'rooms',
				label: 'rooms',
				Icon: DoorOpen,
				href: '/rooms',
				permission: 'room.read',
			},
			{
				id: 'groups',
				label: 'groups',
				Icon: CalendarDays,
				href: '/groups',
				permission: 'group.read',
			},
			{
				id: 'schedule',
				label: 'schedule',
				Icon: CalendarClock,
				href: '/schedule',
				permission: 'session.read',
			},
			// {
			// 	id: 'attendance',
			// 	label: 'attendance',
			// 	Icon: CheckSquare,
			// 	href: '/attendance',
			// 	permission: 'attendance.read',
			// },
			// {
			// 	id: 'assessments',
			// 	label: 'assessments',
			// 	Icon: ClipboardList,
			// 	href: '/assessments',
			// 	permission: 'assessment.read',
			// },
			// {
			// 	id: 'report-cards',
			// 	label: 'reportCards',
			// 	Icon: ScrollText,
			// 	href: '/report-cards',
			// 	permission: ['report-card.generate', 'report-card.publish'],
			// },
		],
	},
	{
		label: 'finance',
		items: [
			{
				id: 'invoices',
				label: 'invoices',
				Icon: FileText,
				href: '/invoices',
				permission: 'invoice.read',
			},
			{
				id: 'payments',
				label: 'payments',
				Icon: CreditCard,
				href: '/payments',
				permission: 'payment.read',
			},
			{
				id: 'fee-plans',
				label: 'feePlans',
				Icon: Layers,
				href: '/fee-plans',
				permission: 'fee-plan.manage',
			},
			{
				id: 'billing-policy',
				label: 'billingPolicy',
				Icon: SlidersHorizontal,
				href: '/billing-policy',
				permission: 'billing-policy.view',
			},
			{
				id: 'discounts',
				label: 'discounts',
				Icon: Tag,
				href: '/discounts',
				permission: 'discount.manage',
			},
			{
				id: 'expenses',
				label: 'expenses',
				Icon: Receipt,
				href: '/expenses',
				permission: [
					'expense.read',
					'expense.create',
					'expense.update',
					'expense.delete',
				],
			},
			{
				id: 'payroll',
				label: 'payroll',
				Icon: Wallet,
				href: '/payroll',
				badge: 'OWNER',
				permission: 'payroll.read',
			},
		],
	},
	{
		label: 'engagement',
		items: [
			{
				id: 'notifications',
				label: 'notifications',
				Icon: MessageSquare,
				href: '/notifications',
				// Any-of, mirroring the route guard: the page is a tab shell and each
				// tab gates itself, so an ADMIN without the OWNER-only settings
				// permission still belongs here.
				permission: [
					'notification-rule.manage',
					'notification-template.manage',
					'notification.send',
					'notification-settings.manage',
				],
			},
			// {
			// 	id: 'materials',
			// 	label: 'materials',
			// 	Icon: FolderOpen,
			// 	href: '/materials',
			// 	permission: 'material.read',
			// },
		],
	},
	{
		label: 'administration',
		items: [
			{
				id: 'branches',
				label: 'branches',
				Icon: Building2,
				href: '/branches',
				permission: 'branch.read',
			},
			// {
			// 	id: 'roles',
			// 	label: 'roles',
			// 	Icon: Shield,
			// 	href: '/roles',
			// 	permission: 'role.read',
			// },
			// {
			// 	id: 'audit-log',
			// 	label: 'auditLog',
			// 	Icon: History,
			// 	href: '/audit-log',
			// 	permission: 'audit.read',
			// },
		],
	},
];

/**
 * The nav groups this user may see, with empty groups dropped.
 *
 * Cosmetic filtering — the backend enforces access. Until `/manage/me` resolves,
 * this fails OPEN (returns everything) to match the route guards: otherwise a
 * transient profile-load failure would leave an empty sidebar over a still-
 * navigable console.
 *
 * Shared by the desktop rail and the phone drawer so both hide exactly the same
 * destinations.
 */
export function useVisibleNavGroups(): NavGroupDef[] {
	const { can, permissionsLoaded } = usePermissions();

	if (!permissionsLoaded) return NAV_GROUPS;

	return NAV_GROUPS.map((group) => ({
		...group,
		items: group.items.filter((item) => can(item.permission)),
	})).filter((group) => group.items.length > 0);
}

/** First letter of the first word, plus the second word's if there is one — capped at 2. */
export function tenantInitials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase() || '?';
}
