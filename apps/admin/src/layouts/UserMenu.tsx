import { useNavigate } from '@tanstack/react-router';
import { ChevronDown, LogOut, User } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui';
import { useT } from '@repo/i18n';

import { useAuth } from '@/features/auth/hooks';
import { useAppT } from '@/locales';

/**
 * Topbar identity control — the console's account entry point, in the header's
 * trailing cluster where users expect it.
 *
 * The trigger stays compact: avatar only on narrow viewports, avatar + name +
 * role from `lg` up, so the identity is legible without crowding the search
 * field. The menu repeats name and role so the collapsed trigger never hides
 * *who is signed in* — which account you are acting as matters before a
 * money-touching action.
 */
export function UserMenu() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const t = useT('nav');
	const tAuth = useT('auth');
	const tApp = useAppT('shell');

	// The shell renders only behind the authed guard, but the session is cleared
	// before the redirect lands — render nothing rather than a `?` avatar.
	if (!user) return null;

	const name = user.firstName.trim();
	const initials =
		`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
	const primaryRole = user.roles[0] ?? '';

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={tApp('accountMenu')}
					className="flex h-8 cursor-pointer items-center gap-2 rounded-lg pl-0.5 pr-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:bg-muted lg:pr-1.5"
				>
					<Avatar className="size-7">
						<AvatarFallback className="bg-primary text-[11px] font-bold text-primary-foreground">
							{initials}
						</AvatarFallback>
					</Avatar>

					<span className="hidden max-w-36 min-w-0 flex-col items-start lg:flex">
						<span className="w-full truncate text-[12.5px] leading-tight font-semibold text-foreground">
							{name}
						</span>
						{primaryRole && (
							<span className="mt-1 inline-block rounded-md bg-tone-indigo-bg px-1.5 py-px text-[8px] font-semibold tracking-wide text-tone-indigo-fg uppercase">
								{primaryRole}
							</span>
						)}
					</span>

					<ChevronDown
						aria-hidden
						className="hidden size-3.5 shrink-0 text-muted-foreground lg:block"
					/>
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" sideOffset={8} className="w-56">
				<DropdownMenuItem onClick={() => void navigate({ to: '/account' })}>
					<User className="mr-2 size-4" />
					{t('item.profile')}
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem variant="destructive" onClick={logout}>
					<LogOut className="mr-2 size-4" />
					{tAuth('signOut')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
