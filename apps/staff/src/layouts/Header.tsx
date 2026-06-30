import { Bell, ChevronDown, LogOut, User } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui';
import { useAuth } from '@/features/auth/hooks';
import { getTenantSlug } from '@/lib/tenant';

export function Header() {
	const { user, logout } = useAuth();
	const tenantSlug = getTenantSlug();

	const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
	const initials = user
		? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
		: '?';

	return (
		<header className="z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
			<div className="flex items-center gap-2.5">
				<div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
					{tenantSlug?.[0]?.toUpperCase() ?? 'E'}
				</div>
				<span className="text-sm font-bold text-foreground">
					{tenantSlug
						? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)
						: 'EduCore'}
				</span>
			</div>

			<div className="flex-1" />

			<button
				type="button"
				aria-label="Notifications"
				className="relative flex size-8.5 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
			>
				<Bell className="size-4" />
			</button>

			<div className="h-6 w-px bg-border" />

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted"
					>
						<div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
							{initials}
						</div>
						{fullName && (
							<div className="hidden leading-tight sm:block">
								<div className="text-[12.5px] font-semibold text-foreground">
									{fullName}
								</div>
							</div>
						)}
						<ChevronDown className="size-3.5 text-muted-foreground" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					{fullName && (
						<>
							<DropdownMenuLabel className="font-normal">
								<div className="font-semibold">{fullName}</div>
								{user?.roles.map((r) => (
									<span
										key={r}
										className="mr-1 mt-1 inline-flex rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary"
									>
										{r}
									</span>
								))}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
						</>
					)}
					<DropdownMenuItem>
						<User className="mr-2 size-4" />
						Profile
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
