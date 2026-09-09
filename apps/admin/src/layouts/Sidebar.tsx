import { useRouterState } from '@tanstack/react-router';

import { cn } from '@repo/ui';
import { useT } from '@repo/i18n';
import { useSessionStore } from '@/store/sessionStore';
import { useAppT } from '@/locales';

import { tenantInitials, useVisibleNavGroups } from './nav';
import { NavButton } from './NavButton';

interface SidebarProps {
	collapsed: boolean;
}

/**
 * The desktop navigation rail, collapsible to icons. Rendered from `md` up only
 * — below that the same nav is an overlay drawer (`MobileNavSheet`), because an
 * in-flow 236px column leaves a phone barely 150px of content. Both read
 * `useVisibleNavGroups()`, so they hide exactly the same destinations.
 */
export function Sidebar({ collapsed }: SidebarProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const t = useT('nav');
	const tApp = useAppT('shell');
	const tenant = useSessionStore((s) => s.tenant);
	const visibleGroups = useVisibleNavGroups();

	// The build is shared across every education center, so the header carries
	// the signed-in user's own tenant rather than the product brand.
	const tenantName = tenant?.name ?? 'Cohort';
	const tenantInitial = tenantInitials(tenantName);

	return (
		<aside
			className={cn(
				// `hidden md:flex` — below `md` the nav is the drawer instead; an
				// in-flow rail there would squeeze the page into ~150px.
				'hidden shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar md:flex',
				'transition-[width] duration-220 ease-in-out',
				collapsed ? 'w-14.5' : 'w-59',
			)}
		>
			{/* Tenant header */}
			<div className="flex h-14.5 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
					{tenantInitial}
				</div>
				<div
					style={{ transitionDelay: collapsed ? '0ms' : '80ms' }}
					className={cn(
						'min-w-0 overflow-hidden whitespace-nowrap transition-opacity duration-120',
						collapsed ? 'opacity-0' : 'opacity-100',
					)}
				>
					<div className="truncate text-[13.5px] font-bold tracking-tight text-sidebar-foreground">
						{tenantName}
					</div>
					<div className="font-mono text-[10px] text-muted-foreground">
						{tApp('brandSurface')}
					</div>
				</div>
			</div>

			{/* Nav */}
			<nav className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-2.5 py-3">
				{visibleGroups.map((group) => (
					<div key={group.label} className="flex flex-col gap-0.5">
						{/* Group label — collapses via max-height + fades */}
						<div
							style={{ transitionDelay: collapsed ? '0ms' : '80ms' }}
							className={cn(
								'overflow-hidden whitespace-nowrap px-2',
								'transition-[max-height,opacity] duration-120',
								collapsed
									? 'max-h-0 opacity-0'
									: 'mb-0.5 max-h-6 opacity-100',
							)}
						>
							<span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
								{t(`group.${group.label}`)}
							</span>
						</div>
						{group.items.map((item) => (
							<NavButton
								key={item.id}
								item={item}
								active={pathname === item.href}
								collapsed={collapsed}
							/>
						))}
					</div>
				))}
			</nav>
		</aside>
	);
}
