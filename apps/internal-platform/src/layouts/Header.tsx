import {
	Bell,
	ChevronDown,
	LogOut,
	Search,
	Settings,
	ShieldCheck,
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
import { LanguageMenu } from './LanguageMenu';
import { useAppT } from '@/locales';

export function Header() {
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
			{/* Logo + context badges */}
			<div className="flex items-center gap-2.5">
				<div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
					E
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm font-bold text-(--console-fg)">
						{tApp('brand')}
					</span>
					<span className="flex items-center gap-1.5 rounded-md border border-tone-amber-fg/25 bg-tone-amber-bg px-2 py-0.5 text-[10px] font-bold tracking-wide text-tone-amber-fg">
						<ShieldCheck className="size-3" />
						{tApp('brandBadge')}
					</span>
					<span className="flex items-center gap-1 rounded-md border border-tone-green-fg/25 bg-tone-green-bg px-2 py-0.5 text-[10px] font-bold tracking-wide text-tone-green-fg">
						<span className="size-1.5 rounded-full bg-tone-green-fg" />
						{tApp('env')}
					</span>
				</div>
			</div>

			{/* Global search trigger */}
			<div className="ml-3 flex h-8.5 max-w-120 flex-1 cursor-text items-center gap-2 rounded-lg border border-(--console-line) bg-(--console-field) px-3 text-(--console-muted-fg) hover:bg-(--console-hover)">
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
				className="relative flex size-8.5 items-center justify-center rounded-lg text-(--console-muted-fg) hover:bg-(--console-hover) hover:text-(--console-fg)"
			>
				<Bell className="size-4" />
				<span className="absolute right-1.75 top-1.75 size-1.75 rounded-full border-[1.5px] border-(--console) bg-destructive" />
			</button>

			{/* Language picker */}
			<LanguageMenu />

			{/* Theme toggle */}
			<ThemeToggle className="size-8.5 rounded-lg text-(--console-muted-fg) hover:bg-(--console-hover) hover:text-(--console-fg)" />

			{/* Divider */}
			<div className="h-6 w-px bg-(--console-line)" />

			{/* Operator menu */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-(--console-hover)"
					>
						<div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
							{initials}
						</div>
						{fullName && (
							<div className="hidden leading-tight sm:block">
								<div className="text-[12.5px] font-semibold text-(--console-fg)">
									{fullName}
								</div>
								<div className="text-[10px] font-bold tracking-[0.04em] text-(--console-accent-fg)">
									{tApp('operatorBadge')}
								</div>
							</div>
						)}
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
