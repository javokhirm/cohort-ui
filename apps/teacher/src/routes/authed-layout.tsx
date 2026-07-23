import { useEffect } from 'react';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';

import { AppSidebar, AppTopbar, BottomTabBar, ThemeToggle } from '@repo/ui';
import { useT } from '@repo/i18n';

import { useSessionStore } from '@/store/sessionStore';
import { BranchSelector } from '@/layouts/BranchSelector';
import { NAV_ITEMS } from '@/layouts/nav';
import { OverflowMenu } from '@/layouts/OverflowMenu';

/** Gradient brand mark shown in the sidebar header. */
function BrandLogo() {
	return (
		<div className="flex size-8 items-center justify-center rounded-[9px] bg-linear-to-br from-primary to-primary/70 text-[15px] font-bold text-primary-foreground">
			C
		</div>
	);
}

/**
 * The authenticated teacher shell. One nav list drives both chromes: a fixed
 * sidebar from `md` up, and bottom tabs below it — the phone layout the design
 * calls for. `beforeLoad` guards initial entry; the effect here handles the
 * session being lost *after* entry (a 401 whose silent refresh failed).
 */
export function AuthedLayout() {
	const status = useSessionStore((s) => s.status);
	const user = useSessionStore((s) => s.user);
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const t = useT('nav');

	useEffect(() => {
		if (status !== 'authenticated') {
			void navigate({ to: '/login' });
		}
	}, [status, navigate]);

	if (status !== 'authenticated') return null;

	const active = NAV_ITEMS.find((item) => item.href === pathname) ?? NAV_ITEMS[0]!;

	const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
	const initials = user
		? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
		: '?';

	const navItems = NAV_ITEMS.map(({ id, label, href, Icon }) => ({
		id,
		label: t(`item.${label}`),
		icon: <Icon />,
		active: href === active.href,
		onClick: () => void navigate({ to: href }),
	}));

	return (
		<div className="flex h-svh overflow-hidden bg-background text-foreground">
			<AppSidebar
				className="hidden md:flex"
				logo={<BrandLogo />}
				centerName="Cohort"
				surface="TEACH"
				navItems={navItems}
				user={{ name: fullName, initials, role: 'TEACHER' }}
				onUserClick={() => void navigate({ to: '/profile' })}
			/>

			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<AppTopbar
					title={active.title ? t(`item.${active.title}`) : ''}
					subtitle={active.subtitle}
					branch={<BranchSelector />}
					actions={
						<>
							<ThemeToggle />
							<OverflowMenu />
						</>
					}
				/>

				<main className="flex-1 overflow-y-auto bg-muted px-4 pt-5 md:px-6 md:pt-7">
					<Outlet />
				</main>

				<BottomTabBar className="md:hidden" items={navItems} />
			</div>
		</div>
	);
}
