import { ChevronsLeft, ChevronsRight, Menu } from 'lucide-react';

import { NotificationBell, Separator, ThemeToggle } from '@repo/ui';
import { useT } from '@repo/i18n';

import { useAppT } from '@/locales';

import { BranchSelector } from './BranchSelector';
import { UserMenu } from './UserMenu';

interface HeaderProps {
	/** Desktop rail state — meaningless below `md`, where there is no rail. */
	sidebarCollapsed: boolean;
	onSidebarToggle: () => void;
	/** Opens the phone nav drawer. */
	onMenuOpen: () => void;
}

/**
 * The console topbar.
 *
 * The leading control changes meaning with the viewport: below `md` it's a
 * hamburger that opens the nav drawer, from `md` up it's the rail's
 * collapse/expand toggle. The trailing cluster thins out on a phone — language
 * moved to the profile page (it's an account setting, not a per-session
 * toggle) — but theme stays here on every viewport for now rather than
 * dropping into the drawer, and the branch selector stays too, because it
 * scopes every list query and hiding it would leave an admin unsure which
 * branches they're even looking at.
 */
export function Header({ sidebarCollapsed, onSidebarToggle, onMenuOpen }: HeaderProps) {
	const t = useT('nav');
	const tApp = useAppT('shell');

	return (
		<header className="z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
			{/* Phone: open the nav drawer. 40px target, per touch guidance. */}
			<button
				type="button"
				onClick={onMenuOpen}
				aria-label={tApp('openMenu')}
				className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground md:hidden"
			>
				<Menu className="size-4.5" />
			</button>

			{/* Desktop: collapse/expand the rail. */}
			<button
				type="button"
				onClick={onSidebarToggle}
				aria-label={
					sidebarCollapsed
						? t('shell.expandSidebar')
						: t('shell.collapseSidebar')
				}
				className="hidden size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground md:flex"
			>
				{sidebarCollapsed ? (
					<ChevronsRight className="size-4" />
				) : (
					<ChevronsLeft className="size-4" />
				)}
			</button>

			{/* Global branch selector (multi-select; hidden for single-branch users).
			    Stays on every viewport — it decides what data the page is showing. */}
			<BranchSelector />

			<div className="flex-1" />

			{/* Trailing cluster — tools first, identity last. Language is not here:
			    it is an account setting, and lives on the profile page. */}
			<div className="flex items-center gap-1">
				<NotificationBell unreadCount={0} />

				<ThemeToggle className="size-8 rounded-lg" />

				<Separator orientation="vertical" className="mx-1 hidden h-5 md:block" />

				<UserMenu />
			</div>
		</header>
	);
}
