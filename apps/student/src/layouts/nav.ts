import { CalendarDays, CreditCard, Home, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Leaf keys under the `nav:item.*` catalog — resolved with `t()` at render. */
type NavKey =
	| 'home'
	| 'schedule'
	| 'progress'
	| 'leaderboard'
	| 'billing'
	| 'notifications'
	| 'profile';

/** Leaf keys under this app's `shell.*` catalog — the app-bar subtitles. */
type SubtitleKey = 'scheduleSubtitle' | 'progressSubtitle' | 'billingSubtitle';

/**
 * Every destination the shell can reach — the four tabs, the bell, the avatar,
 * and `/leaderboard`, which only Home's card links to.
 */
export type StudentRoute =
	'/' | '/schedule' | '/progress' | '/leaderboard' | '/billing' | '/inbox' | '/profile';

export interface StudentNavItem {
	id: string;
	/** i18n key for the sidebar / bottom-tab label. */
	label: NavKey;
	href: StudentRoute;
	Icon: LucideIcon;
}

/**
 * The four tabbed destinations, driving the desktop sidebar and the mobile bottom tabs
 * from one list so they can never drift apart. Labels are catalog keys, translated at
 * render. `/inbox` and `/profile` are deliberately absent — the bell and the avatar reach
 * them, and neither chrome should grow a fifth tab.
 */
export const NAV_ITEMS: StudentNavItem[] = [
	{
		id: 'home',
		label: 'home',
		href: '/',
		Icon: Home,
	},
	{
		id: 'schedule',
		label: 'schedule',
		href: '/schedule',
		Icon: CalendarDays,
	},
	{
		id: 'progress',
		label: 'progress',
		href: '/progress',
		Icon: Target,
	},
	{
		id: 'billing',
		label: 'billing',
		href: '/billing',
		Icon: CreditCard,
	},
];

/**
 * What the app bar says on each destination. Home is absent because it composes its own
 * pair at render — the time-of-day greeting over today's date — rather than a fixed key.
 *
 * `/leaderboard` appears here but not in {@link NAV_ITEMS}: like `/inbox` and
 * `/profile` it is reached from within a screen (Home's card), not from a tab.
 */
export const BAR_COPY: Partial<
	Record<StudentRoute, { title: NavKey; subtitle?: SubtitleKey }>
> = {
	'/schedule': { title: 'schedule', subtitle: 'scheduleSubtitle' },
	'/progress': { title: 'progress', subtitle: 'progressSubtitle' },
	'/leaderboard': { title: 'leaderboard' },
	'/billing': { title: 'billing', subtitle: 'billingSubtitle' },
	'/inbox': { title: 'notifications' },
	'/profile': { title: 'profile' },
};

/**
 * The `BAR_COPY` section a pathname belongs to — detail routes (`/schedule/12`,
 * `/billing/3`, `/inbox/7`) keep their section's app-bar copy rather than falling back
 * to Home's greeting. `/` (Home) resolves to `undefined`, as it has no `BAR_COPY` entry.
 */
export function barRouteFor(pathname: string): StudentRoute | undefined {
	const sections = Object.keys(BAR_COPY) as StudentRoute[];
	return sections.find(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);
}
