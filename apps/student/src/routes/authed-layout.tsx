import { useEffect } from 'react';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';

import { AppSidebar, AppTopbar, BottomTabBar } from '@repo/ui';
import { useT } from '@repo/i18n';
import { currentHour, formatFullDate, todayIsoDate } from '@repo/utils';

import { useSessionStore } from '@/store/sessionStore';
import { BAR_COPY, NAV_ITEMS } from '@/layouts/nav';
import type { StudentRoute } from '@/layouts/nav';
import { AvatarButton } from '@/layouts/AvatarButton';
import { OverflowMenu } from '@/layouts/OverflowMenu';
import { useAppT } from '@/locales';

/** Gradient brand mark shown in the sidebar header. */
function BrandLogo() {
	return (
		<div className="flex size-8 items-center justify-center rounded-[9px] bg-linear-to-br from-primary to-primary/70 text-[15px] font-bold text-primary-foreground">
			C
		</div>
	);
}

/** Catalog key for the time-of-day greeting at the center's current hour. */
function greetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
	const hour = currentHour();
	if (hour < 12) return 'greetingMorning';
	if (hour < 18) return 'greetingAfternoon';
	return 'greetingEvening';
}

/**
 * The authenticated student shell. One nav list drives both chromes: a fixed sidebar from
 * `md` up, and bottom tabs below it — the phone-first layout this app targets. The bell and
 * the avatar reach the two untabbed destinations; the sidebar footer's dots menu holds the
 * account actions on desktop.
 *
 * `beforeLoad` guards initial entry; the effect here handles the session being lost *after*
 * entry (a 401 whose silent refresh failed).
 */
export function AuthedLayout() {
	const status = useSessionStore((s) => s.status);
	const user = useSessionStore((s) => s.user);
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const t = useT('nav');
	const tShell = useAppT('shell');
	const tHome = useAppT('home');

	useEffect(() => {
		if (status !== 'authenticated') {
			void navigate({ to: '/login' });
		}
	}, [status, navigate]);

	if (status !== 'authenticated') return null;

	const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
	const initials = user
		? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
		: '?';

	const navItems = NAV_ITEMS.map(({ id, label, href, Icon }) => ({
		id,
		label: t(`item.${label}`),
		icon: <Icon />,
		active: href === pathname,
		onClick: () => void navigate({ to: href }),
	}));

	// Every screen but Home reads its app-bar pair from the catalog; Home composes its
	// own — the time-of-day greeting over today's date.
	const bar = BAR_COPY[pathname as StudentRoute];
	const title = bar
		? t(`item.${bar.title}`)
		: tHome(greetingKey(), { name: user?.firstName ?? '' });
	const subtitle = bar
		? bar.subtitle && tShell(bar.subtitle)
		: formatFullDate(todayIsoDate());

	return (
		<div className="flex h-svh overflow-hidden bg-background text-foreground">
			<AppSidebar
				className="hidden md:flex"
				logo={<BrandLogo />}
				centerName="Cohort"
				navItems={navItems}
				user={{ name: fullName, initials, role: 'STUDENT' }}
				onUserClick={() => void navigate({ to: '/profile' })}
				userActions={<OverflowMenu />}
			/>

			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<AppTopbar
					title={title}
					subtitle={subtitle}
					onNotificationsClick={() => void navigate({ to: '/inbox' })}
					trailing={
						<AvatarButton
							className="md:hidden"
							initials={initials}
							label={tShell('openProfile')}
							onClick={() => void navigate({ to: '/profile' })}
						/>
					}
				/>

				<main className="flex-1 overflow-y-auto bg-muted px-4 pt-3.5 md:px-6 md:pt-5">
					<Outlet />
				</main>

				<BottomTabBar
					className="md:hidden"
					items={navItems}
					showActiveIndicator
				/>
			</div>
		</div>
	);
}
