import { Check, Globe, LogOut, MoreHorizontal } from 'lucide-react';

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

/** Topbar overflow menu. Appearance lives in the topbar's `ThemeToggle` icon. */
export function OverflowMenu() {
	const { logout } = useAuth();
	const t = useT('common');
	const tAuth = useT('auth');
	const tNav = useT('nav');
	const { locale, locales, changeLocale } = useLocalePreference();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={tNav('shell.moreOptions')}
					className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
				>
					<MoreHorizontal className="size-[19px]" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
					<Globe className="size-3.5" />
					{t('language.label')}
				</DropdownMenuLabel>
				{locales.map((code) => (
					<DropdownMenuItem
						key={code}
						className="justify-between"
						onClick={() => changeLocale(code)}
					>
						{t(`language.${code}`)}
						{code === locale && <Check className="size-3.5 text-primary" />}
					</DropdownMenuItem>
				))}
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
	);
}
