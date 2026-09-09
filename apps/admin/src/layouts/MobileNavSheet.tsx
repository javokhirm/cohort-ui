import { useRouterState } from '@tanstack/react-router';

import { Sheet, SheetContent, SheetTitle } from '@repo/ui';
import { useT } from '@repo/i18n';

import { useSessionStore } from '@/store/sessionStore';
import { useAppT } from '@/locales';

import { tenantInitials, useVisibleNavGroups } from './nav';
import { NavButton } from './NavButton';

interface MobileNavSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * The phone navigation drawer — the whole grouped nav as a left overlay.
 *
 * Below `md` the console can't afford an in-flow rail: the expanded sidebar is
 * 236px, which leaves a 390px phone about 150px of content and forces the page
 * to scroll sideways. An overlay costs nothing until it's opened, and unlike
 * bottom tabs it reaches all seventeen destinations without a "More" bucket.
 *
 * Rows are 44px here rather than the rail's 36px, and picking one closes the
 * drawer. Neither language nor theme lives here: language is an account
 * setting on the profile page, and theme stays in the header on every
 * viewport for now rather than dropping into this drawer.
 */
export function MobileNavSheet({ open, onOpenChange }: MobileNavSheetProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const t = useT('nav');
	const tApp = useAppT('shell');
	const tenant = useSessionStore((s) => s.tenant);
	const visibleGroups = useVisibleNavGroups();

	const tenantName = tenant?.name ?? 'Cohort';

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="left"
				// The primitive's default is `w-3/4 sm:max-w-md`; a nav drawer wants a
				// fixed comfortable width instead, so it reads the same on a 320px
				// phone as on a 430px one.
				// `pl-safe-l`: the drawer is a fixed portal, so it sits outside the
				// shell's inset padding and must clear a landscape notch itself.
				className="w-71 gap-0 p-0 pl-safe-l sm:max-w-71"
				aria-describedby={undefined}
			>
				{/* Tenant header — mirrors the desktop rail's, and carries the
				    drawer's accessible name. */}
				<div className="flex h-14.5 shrink-0 items-center gap-2.5 border-b border-sidebar-border bg-sidebar px-4">
					<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
						{tenantInitials(tenantName)}
					</div>
					<div className="min-w-0">
						<SheetTitle className="truncate text-[13.5px] font-bold tracking-tight text-sidebar-foreground">
							{tenantName}
						</SheetTitle>
						<div className="font-mono text-[10px] text-muted-foreground">
							{tApp('brandSurface')}
						</div>
					</div>
				</div>

				{/* `pb-safe-b` keeps the last row clear of the iPhone home indicator
				    now that nothing else sits below the nav to absorb that inset. */}
				<nav className="flex flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain bg-sidebar p-2.5 py-3 pb-safe-b">
					{visibleGroups.map((group) => (
						<div key={group.label} className="flex flex-col gap-0.5">
							<div className="mb-0.5 px-2">
								<span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
									{t(`group.${group.label}`)}
								</span>
							</div>
							{group.items.map((item) => (
								<NavButton
									key={item.id}
									item={item}
									active={pathname === item.href}
									size="touch"
									onNavigate={() => onOpenChange(false)}
								/>
							))}
						</div>
					))}
				</nav>
			</SheetContent>
		</Sheet>
	);
}
