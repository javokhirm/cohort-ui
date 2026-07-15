import { Home, LayoutGrid, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TeacherNavItem {
	id: string;
	label: string;
	href: '/' | '/groups' | '/profile';
	Icon: LucideIcon;
	/** Topbar title for this destination. */
	title: string;
	subtitle?: string;
}

/**
 * The teacher console's whole navigation: three destinations, driving the
 * desktop sidebar and the mobile bottom tabs from one list so they can never
 * drift apart.
 */
export const NAV_ITEMS: TeacherNavItem[] = [
	{
		id: 'today',
		label: 'Today',
		href: '/',
		Icon: Home,
		title: '',
	},
	{
		id: 'groups',
		label: 'Groups',
		href: '/groups',
		Icon: LayoutGrid,
		title: 'My Groups',
	},
	{
		id: 'profile',
		label: 'Profile',
		href: '/profile',
		Icon: User,
		title: 'Profile',
	},
];
