import { useRouterState } from '@tanstack/react-router';

import { Separator, Sheet, SheetContent, SheetTitle } from '@repo/ui';

import { useAppT } from '@/locales';

import { FOOTER_NAV_GROUP, NAV_GROUPS } from './nav';
import { NavGroup } from './NavGroup';

interface MobileNavSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * The phone navigation drawer — the whole nav as a left overlay, styled with
 * the same `--console-*` chrome tokens as the rail it replaces below `md`.
 *
 * Rows are 44px here rather than the rail's 36px, and picking one closes the
 * drawer. The theme toggle isn't here — it stays in the header on every
 * viewport for now rather than dropping into this footer.
 */
export function MobileNavSheet({ open, onOpenChange }: MobileNavSheetProps) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const tApp = useAppT('shell');

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="left"
				// The primitive's default is `w-3/4 sm:max-w-md` and the standard
				// theme; a nav drawer wants a fixed width and the console's own
				// chrome tokens instead, to read as the rail it replaces.
				className="w-71 gap-0 border-(--console-line) bg-(--console) p-0 pl-safe-l sm:max-w-71"
				aria-describedby={undefined}
			>
				{/* Brand header — mirrors the topbar's, and carries the drawer's
				    accessible name. */}
				<div className="flex h-13.5 shrink-0 items-center gap-2.5 border-b border-(--console-line) px-4">
					<div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
						C
					</div>
					<div className="min-w-0">
						<SheetTitle className="truncate text-sm font-bold text-(--console-fg)">
							{tApp('brand')}
						</SheetTitle>
						<div className="text-[10px] font-bold tracking-wide text-(--console-muted-fg) uppercase">
							{tApp('brandSurface')}
						</div>
					</div>
				</div>

				{/* `pb-safe-b` keeps the last row clear of the iPhone home indicator
				    now that nothing else sits below the nav to absorb that inset. */}
				<nav className="flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-3 pb-safe-b">
					{NAV_GROUPS.map((group) => (
						<NavGroup
							key={group.label}
							group={group}
							collapsed={false}
							pathname={pathname}
							size="touch"
							onNavigate={() => onOpenChange(false)}
						/>
					))}
					<Separator className="bg-(--console-line)" />
					<NavGroup
						group={FOOTER_NAV_GROUP}
						collapsed={false}
						pathname={pathname}
						size="touch"
						onNavigate={() => onOpenChange(false)}
					/>
				</nav>
			</SheetContent>
		</Sheet>
	);
}
