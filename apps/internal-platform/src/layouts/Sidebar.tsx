import { useRouterState } from '@tanstack/react-router';

import { cn, Separator } from '@repo/ui';

import { useAppT } from '@/locales';

import { FOOTER_NAV_GROUP, NAV_GROUPS } from './nav';
import { NavGroup } from './NavGroup';

interface SidebarProps {
	collapsed: boolean;
}

/**
 * The desktop navigation rail, collapsible to icons. Rendered from `md` up
 * only — below that the same nav is an overlay drawer (`MobileNavSheet`),
 * because an in-flow 240px column leaves a phone almost no content width.
 *
 * The collapse/expand control used to live here, as its own row at the
 * bottom of the rail. It now lives in the `Header`, next to the mobile
 * drawer's hamburger — one control, in one place, for both viewports —
 * so the rail owns nothing but navigation.
 */
export function Sidebar({ collapsed }: SidebarProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const tApp = useAppT('shell');

	return (
		<aside
			className={cn(
				'hidden shrink-0 flex-col border-r border-(--console-line) bg-(--console) transition-[width] duration-200 md:flex',
				collapsed ? 'w-14' : 'w-60',
			)}
		>
			{/* Brand header — the rail had none; only the topbar carried the mark.
			    Collapses the same way a nav row does: drop the padding, center the
			    tile, instead of a separate fade transition this app's rail doesn't
			    otherwise use. */}
			<div
				className={cn(
					'flex h-13.5 shrink-0 items-center gap-2.5 border-b border-(--console-line)',
					collapsed ? 'justify-center' : 'px-4',
				)}
			>
				<div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
					C
				</div>
				{!collapsed && (
					<div className="min-w-0">
						<div className="truncate text-sm font-bold text-(--console-fg)">
							{tApp('brand')}
						</div>
						<div className="text-[10px] font-bold tracking-wide text-(--console-muted-fg) uppercase">
							{tApp('brandSurface')}
						</div>
					</div>
				)}
			</div>

			<nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
				{NAV_GROUPS.map((group) => (
					<NavGroup
						key={group.label}
						group={group}
						collapsed={collapsed}
						pathname={pathname}
					/>
				))}
				<div className="mt-auto flex flex-col gap-4">
					<Separator className="bg-(--console-line)" />
					<NavGroup
						group={FOOTER_NAV_GROUP}
						collapsed={collapsed}
						pathname={pathname}
					/>
				</div>
			</nav>
		</aside>
	);
}
