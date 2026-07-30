import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { useT, type Locale } from '@repo/i18n';

import { useLocalePreference } from '@/hooks/useLocalePreference';

/**
 * The Preferred-language select. Writes through `useLocalePreference`, the app's single
 * owner of the language switch — it flips the UI immediately and persists the choice to
 * `PATCH /student/me`, the same call the sidebar's overflow menu makes.
 */
export function LanguageSelect() {
	const t = useT('common');
	const { locale, locales, changeLocale, isSaving } = useLocalePreference();

	return (
		<Select
			value={locale}
			onValueChange={(next) => changeLocale(next as Locale)}
			disabled={isSaving}
		>
			{/* `data-[size=default]` beats a bare `h-*` on the trigger's own base styles. */}
			<SelectTrigger className="rounded-xl px-3 text-[13.5px] font-semibold data-[size=default]:h-11.5">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{locales.map((code) => (
					<SelectItem key={code} value={code}>
						{t(`language.${code}`)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
