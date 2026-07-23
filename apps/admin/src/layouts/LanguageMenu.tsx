import { Check, Globe } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@repo/ui';
import { useT, type Locale } from '@repo/i18n';

import { useLocalePreference } from '@/hooks/useLocalePreference';

/** Two-letter code shown on the trigger; the menu items use full endonyms. */
const CODE_LABEL: Record<Locale, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };

/**
 * Topbar language picker for the desktop console. Composes `@repo/ui`'s
 * `DropdownMenu` with `useLocalePreference`, which switches the UI immediately
 * and persists the choice to `PATCH /me/preferences` when signed in.
 */
export function LanguageMenu() {
	const t = useT('common');
	const { locale, locales, changeLocale } = useLocalePreference();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label={t('language.label')}
					className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-muted"
				>
					<Globe className="size-4 text-muted-foreground" />
					<span className="text-xs font-semibold text-foreground">
						{CODE_LABEL[locale]}
					</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-44">
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
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
