import {
	Building2,
	Contact2,
	CreditCard,
	FileText,
	LayoutDashboard,
	Receipt,
	ScrollText,
	Settings,
	Shield,
	Users,
	Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Leaf key under `nav:item.*` — resolved with `t()` at render (typed, not `string`). */
export type NavItemKey =
	| 'platformDashboard'
	| 'tenants'
	| 'userDirectory'
	| 'platformLeads'
	| 'subscriptionPlans'
	| 'subscriptions'
	| 'payments'
	| 'invoices'
	| 'roleTemplates'
	| 'auditLog'
	| 'settings';
/** Leaf key under `nav:group.*`. */
export type NavGroupKey = 'overview' | 'customers' | 'revenue' | 'platform';

export type NavItemDef = {
	id: string;
	label: NavItemKey;
	Icon: LucideIcon;
	href: string;
	match: string;
};

export type NavGroupDef = {
	label: NavGroupKey;
	items: NavItemDef[];
};

/**
 * The console's navigation — one SUPER_ADMIN role, so (unlike `admin`'s nav)
 * nothing here needs a permission filter. Shared by the desktop rail
 * (`Sidebar`) and the phone drawer (`MobileNavSheet`) so the two can't drift.
 *
 * `platform` (roles/audit/settings) is exported separately: the rail visually
 * pins it to the bottom, below a divider, which the flat list above doesn't
 * need to reproduce.
 */
export const NAV_GROUPS: NavGroupDef[] = [
	{
		label: 'overview',
		items: [
			{
				id: 'dashboard',
				label: 'platformDashboard',
				Icon: LayoutDashboard,
				href: '/',
				match: '/',
			},
		],
	},
	{
		label: 'customers',
		items: [
			{
				id: 'tenants',
				label: 'tenants',
				Icon: Building2,
				href: '/tenants',
				match: '/tenants',
			},
			{
				id: 'users',
				label: 'userDirectory',
				Icon: Users,
				href: '/users',
				match: '/users',
			},
			{
				id: 'leads',
				label: 'platformLeads',
				Icon: Contact2,
				href: '/leads',
				match: '/leads',
			},
		],
	},
	{
		label: 'revenue',
		items: [
			{
				id: 'subscription-plans',
				label: 'subscriptionPlans',
				Icon: CreditCard,
				href: '/subscription-plans',
				match: '/subscription-plans',
			},
			{
				id: 'subscriptions',
				label: 'subscriptions',
				Icon: Receipt,
				href: '/subscriptions',
				match: '/subscriptions',
			},
			{
				id: 'subscription-payments',
				label: 'payments',
				Icon: Wallet,
				href: '/subscription-payments',
				match: '/subscription-payments',
			},
			{
				id: 'subscription-invoices',
				label: 'invoices',
				Icon: FileText,
				href: '/subscription-invoices',
				match: '/subscription-invoices',
			},
		],
	},
];

export const FOOTER_NAV_GROUP: NavGroupDef = {
	label: 'platform',
	items: [
		{
			id: 'roles',
			label: 'roleTemplates',
			Icon: Shield,
			href: '/roles',
			match: '/roles',
		},
		{
			id: 'audit-log',
			label: 'auditLog',
			Icon: ScrollText,
			href: '/audit-log',
			match: '/audit-log',
		},
		{
			id: 'settings',
			label: 'settings',
			Icon: Settings,
			href: '/settings',
			match: '/settings',
		},
	],
};
