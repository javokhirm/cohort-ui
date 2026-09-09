import {
	Bell,
	ChevronDown,
	ChevronsLeft,
	ChevronsRight,
	LogOut,
	Menu,
	Search,
	Settings,
	User,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	ThemeToggle,
} from '@repo/ui';
import { useT } from '@repo/i18n';
import { useAuth, useOperator } from '@/features/auth/hooks';
import { useAppT } from '@/locales';

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
 * collapse/expand toggle — the toggle used to be its own row at the bottom
 * of the sidebar; it now lives here, next to the drawer's hamburger, so
 * there is one control for the job on every viewport instead of two.
 *
 * The rest of the row thins out below `md`: the env badge and the search
 * trigger drop out (there is no room for either at 360px, and neither has a
 * phone-sized equivalent yet). Theme stays here on every viewport for now
 * rather than dropping into the drawer footer.
 */
export function Header({ sidebarCollapsed, onSidebarToggle, onMenuOpen }: HeaderProps) {
	const { user, logout } = useAuth();
	const { data: profile } = useOperator();
	const t = useT('nav');
	const tAuth = useT('auth');
	const tApp = useAppT('shell');

	const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
	const initials = user
		? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
		: 'SA';
	const email = profile?.email ?? null;

	return (
		<header className="z-40 flex h-13.5 shrink-0 items-center gap-3 border-b border-(--console-line) bg-(--console) px-4">
			{/* Phone: open the nav drawer. */}
			<button
				type="button"
				onClick={onMenuOpen}
				aria-label={tApp('openMenu')}
				className="flex size-10 shrink-0 items-center justify-center rounded-lg text-(--console-muted-fg) hover:bg-(--console-hover) hover:text-(--console-fg) md:hidden"
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
				className="hidden size-8.5 shrink-0 items-center justify-center rounded-lg text-(--console-muted-fg) hover:bg-(--console-hover) hover:text-(--console-fg) md:flex"
			>
				{sidebarCollapsed ? (
					<ChevronsRight className="size-4" />
				) : (
					<ChevronsLeft className="size-4" />
				)}
			</button>

			{/* Brand name + env badge. The logo tile and the "INTERNAL · PLATFORM
			    CONSOLE" badge are gone — the sidebar's own brand header now carries
			    the icon, right beside this row, and repeating it here was
			    redundant. */}
			<div className="flex min-w-0 items-center gap-2">
				<span className="truncate text-sm font-bold text-(--console-fg)">
					{tApp('brand')}
				</span>
				<span className="hidden items-center gap-1 rounded-md border border-tone-green-fg/25 bg-tone-green-bg px-2 py-0.5 text-[10px] font-bold tracking-wide text-tone-green-fg md:flex">
					<span className="size-1.5 rounded-full bg-tone-green-fg" />
					{tApp('env')}
				</span>
			</div>

			{/* Global search trigger — no room for it below `md`. */}
			<div className="ml-3 hidden h-8.5 max-w-120 flex-1 cursor-text items-center gap-2 rounded-lg border border-(--console-line) bg-(--console-field) px-3 text-(--console-muted-fg) hover:bg-(--console-hover) md:flex">
				<Search className="size-3.5 shrink-0" />
				<span className="flex-1 truncate text-[13px]">
					{t('shell.searchPlatform')}
				</span>
				<kbd className="rounded border border-(--console-line) bg-(--console-field) px-1.5 py-0.5 text-[11px] font-semibold">
					⌘K
				</kbd>
			</div>

			<div className="flex-1" />

			{/* Notification bell */}
			<button
				type="button"
				aria-label={t('shell.notifications')}
				className="relative flex size-8.5 shrink-0 items-center justify-center rounded-lg text-(--console-muted-fg) hover:bg-(--console-hover) hover:text-(--console-fg)"
			>
				<Bell className="size-4" />
				<span className="absolute right-1.75 top-1.75 size-1.75 rounded-full border-[1.5px] border-(--console) bg-destructive" />
			</button>

			{/* Theme toggle — in the drawer footer below `md`, same as admin. */}
			<ThemeToggle className="size-8.5 rounded-lg text-(--console-muted-fg) hover:bg-(--console-hover) hover:text-(--console-fg)" />

			{/* Divider */}
			<div className="hidden h-6 w-px bg-(--console-line) md:block" />

			{/* Operator menu — trigger is avatar + chevron only; name and role are
			    on the panel's own label below, not repeated on the trigger. */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-(--console-hover) md:h-auto"
					>
						<div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
							{initials}
						</div>
						<ChevronDown className="size-3.5 text-(--console-muted-fg)" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					{fullName && (
						<>
							<DropdownMenuLabel className="font-normal">
								<div className="font-semibold">{fullName}</div>
								{email && (
									<div className="text-xs text-muted-foreground">
										{email}
									</div>
								)}
								<span className="mt-1.5 inline-flex rounded-sm bg-tone-indigo-bg px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-tone-indigo-fg">
									{tApp('operatorBadge')}
								</span>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
						</>
					)}
					<DropdownMenuItem asChild>
						<Link to="/profile">
							<User className="mr-2 size-4" />
							{t('item.profileSecurity')}
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link to="/">
							<Settings className="mr-2 size-4" />
							{t('item.consoleSettings')}
						</Link>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="text-destructive focus:text-destructive"
						onClick={logout}
					>
						<LogOut className="mr-2 size-4" />
						{tAuth('signOut')}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</header>
	);
}
