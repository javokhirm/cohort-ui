import {
	Bell,
	ChevronDown,
	LogOut,
	Moon,
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
} from '@repo/ui';
import { useAuth, useOperator } from '@/features/auth/hooks';

export function Header() {
	const { user, logout } = useAuth();
	const { data: profile } = useOperator();

	const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
	const initials = user
		? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
		: 'SA';
	const email = profile?.email ?? null;

	return (
		<header className="z-40 flex h-13.5 shrink-0 items-center gap-3 border-b border-(--console-line) bg-(--console) px-4">
			{/* Logo + context badges */}
			<div className="flex items-center gap-2.5">
				<div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-white">
					E
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm font-bold text-white">Cohort</span>
					<span className="flex items-center gap-1.5 rounded-md border border-amber-900 bg-amber-950 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-400">
						<ShieldCheck className="size-3" />
						INTERNAL · PLATFORM CONSOLE
					</span>
					<span className="flex items-center gap-1 rounded-md border border-green-900 bg-green-950 px-2 py-0.5 text-[10px] font-bold tracking-wide text-green-400">
						<span className="size-1.5 rounded-full bg-green-400" />
						PROD
					</span>
				</div>
			</div>

			{/* Global search trigger */}
			<div className="ml-3 flex h-8.5 max-w-120 flex-1 cursor-text items-center gap-2 rounded-lg border border-(--console-line) bg-white/4 px-3 text-(--console-muted-fg) hover:bg-white/8">
				<Search className="size-3.5 shrink-0" />
				<span className="flex-1 truncate text-[13px]">
					Search tenants, users, subscriptions…
				</span>
				<kbd className="rounded border border-(--console-line) bg-white/[0.07] px-1.5 py-0.5 text-[11px] font-semibold">
					⌘K
				</kbd>
			</div>

			<div className="flex-1" />

			{/* Notification bell */}
			<button
				type="button"
				aria-label="Notifications"
				className="relative flex size-8.5 items-center justify-center rounded-lg text-slate-300 hover:bg-white/8"
			>
				<Bell className="size-4" />
				<span className="absolute right-1.75 top-1.75 size-1.75 rounded-full border-[1.5px] border-(--console) bg-red-400" />
			</button>

			{/* Theme toggle (static for now) */}
			<button
				type="button"
				aria-label="Toggle theme"
				className="flex size-8.5 items-center justify-center rounded-lg text-slate-300 hover:bg-white/8"
			>
				<Moon className="size-4" />
			</button>

			{/* Divider */}
			<div className="h-6 w-px bg-(--console-line)" />

			{/* Operator menu */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/8"
					>
						<div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
							{initials}
						</div>
						{fullName && (
							<div className="hidden leading-tight sm:block">
								<div className="text-[12.5px] font-semibold text-white">
									{fullName}
								</div>
								<div className="text-[10px] font-bold tracking-[0.04em] text-(--console-accent-fg)">
									PLATFORM OPERATOR
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
									PLATFORM OPERATOR
								</span>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
						</>
					)}
					<DropdownMenuItem asChild>
						<Link to="/profile">
							<User className="mr-2 size-4" />
							Profile &amp; security
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link to="/">
							<Settings className="mr-2 size-4" />
							Console settings
						</Link>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="text-destructive focus:text-destructive"
						onClick={logout}
					>
						<LogOut className="mr-2 size-4" />
						Sign out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</header>
	);
}
