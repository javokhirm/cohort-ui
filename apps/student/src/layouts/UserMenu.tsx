import { useNavigate } from '@tanstack/react-router';
import { Check, ChevronDown, Globe, LogOut, User } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui';
import { useT } from '@repo/i18n';

import { useAuth } from '@/features/auth/hooks';
import { useLocalePreference } from '@/hooks/useLocalePreference';
import { useAppT } from '@/locales';

/**
 * Topbar identity control — the app bar's trailing account entry point. Replaces the
 * former sidebar footer card (desktop) and the mobile avatar button, so identity and the
 * account actions live in one place on every screen.
 *
 * The trigger stays compact: avatar only below `md`, avatar + name + role from `md` up (the
 * breakpoint where the sidebar appears), so the phone bar isn't crowded. The menu opens with
 * the full name and role, so the collapsed avatar-only trigger never hides who is signed in.
 * It carries the profile link plus what the sidebar dots menu used to hold — the language
 * switch and sign-out — which on a phone were otherwise only reachable via the Profile screen.
 */
export function UserMenu() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const t = useT('nav');
	const tCommon = useT('common');
	const tAuth = useT('auth');
	const tShell = useAppT('shell');
	const { locale, locales, changeLocale } = useLocalePreference();

	// The shell renders only behind the authed guard, but the session is cleared before the
	// redirect lands — render nothing rather than a `?` avatar.
	if (!user) return null;

	const fullName = `${user.firstName} ${user.lastName}`.trim();
	const initials =
		`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
	const role = user.roles[0] ?? 'STUDENT';

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={tShell('accountMenu')}
					className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl pr-1 pl-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:bg-muted md:pr-1.5"
				>
					<span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-tone-indigo-bg text-[13.5px] font-bold text-tone-indigo-fg">
						{initials}
					</span>

					<span className="hidden max-w-36 min-w-0 flex-col items-start md:flex">
						<span className="w-full truncate text-[12.5px] leading-tight font-semibold text-foreground">
							{fullName}
						</span>
						<span className="mt-0.5 inline-block rounded-md bg-tone-indigo-bg px-1.5 py-px text-[9.5px] font-semibold tracking-wide text-tone-indigo-fg uppercase">
							{role}
						</span>
					</span>

					<ChevronDown
						aria-hidden
						className="hidden size-3.5 shrink-0 text-muted-foreground md:block"
					/>
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" sideOffset={8} className="w-56">
				<DropdownMenuLabel className="flex flex-col items-start gap-1">
					<span className="truncate text-[12.5px] font-semibold text-foreground">
						{fullName}
					</span>
					<span className="inline-block rounded-md bg-tone-indigo-bg px-1.5 py-px text-[9.5px] font-semibold tracking-wide text-tone-indigo-fg uppercase">
						{role}
					</span>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				<DropdownMenuItem onClick={() => void navigate({ to: '/profile' })}>
					<User className="mr-2 size-4" />
					{t('item.profile')}
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
					<Globe className="size-3.5" />
					{tCommon('language.label')}
				</DropdownMenuLabel>
				{locales.map((code) => (
					<DropdownMenuItem
						key={code}
						className="justify-between"
						onClick={() => changeLocale(code)}
					>
						{tCommon(`language.${code}`)}
						{code === locale && <Check className="size-3.5 text-primary" />}
					</DropdownMenuItem>
				))}

				<DropdownMenuSeparator />

				<DropdownMenuItem variant="destructive" onClick={logout}>
					<LogOut className="mr-2 size-4" />
					{tAuth('signOut')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
