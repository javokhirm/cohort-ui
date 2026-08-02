import { Home, LayoutGrid, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Leaf keys under the `nav:item.*` catalog — resolved with `t()` at render. */
type NavKey = 'today' | 'groups' | 'pay' | 'profile' | 'myGroups' | 'myPay';

export interface TeacherNavItem {
	id: string;
	/** i18n key for the sidebar / bottom-tab label. */
	label: NavKey;
	href: '/' | '/groups' | '/profile';
	Icon: LucideIcon;
	/** i18n key for the topbar title; omitted where the screen shows none. */
	title?: NavKey;
	subtitle?: string;
}

/**
 * The teacher console's whole navigation: four destinations, driving the
 * desktop sidebar and the mobile bottom tabs from one list so they can never
 * drift apart. Labels/titles are catalog keys, translated at render.
 */
export const NAV_ITEMS: TeacherNavItem[] = [
	{
		id: 'today',
		label: 'today',
		href: '/',
		Icon: Home,
	},
	{
		id: 'groups',
		label: 'groups',
		href: '/groups',
		Icon: LayoutGrid,
		title: 'myGroups',
	},
	// {
	// 	id: 'payroll',
	// 	label: 'pay',
	// 	href: '/payroll',
	// 	Icon: Wallet,
	// 	title: 'myPay',
	// },
	{
		id: 'profile',
		label: 'profile',
		href: '/profile',
		Icon: User,
		title: 'profile',
	},
];
