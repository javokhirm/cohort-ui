import { Check, Globe } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@repo/ui';
import { useT, type Locale } from '@repo/i18n';

import { useLocalePreference } from '@/hooks/useLocalePreference';

/** Two-letter code on the trigger; the menu items use full endonyms. */
const CODE_LABEL: Record<Locale, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };

/**
 * Console topbar language picker. Composes `@repo/ui`'s `DropdownMenu` with
 * `useLocalePreference`, styled with the app's `--console-*` chrome tokens to
 * sit alongside the theme toggle and notification bell.
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
					className="flex h-8.5 items-center gap-1.5 rounded-lg px-2 text-(--console-muted-fg) hover:bg-(--console-hover) hover:text-(--console-fg)"
				>
					<Globe className="size-4" />
					<span className="text-xs font-semibold">{CODE_LABEL[locale]}</span>
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
