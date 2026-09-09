import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui';
import { useT, type Locale } from '@repo/i18n';

import { useLocalePreference } from '@/hooks/useLocalePreference';
import { useAppT } from '@/locales';

/** Regional-indicator flag emoji per catalog locale — no icon set has a
 * language glyph, and a flag reads faster than the endonym alone in a list of
 * three. `en` uses 🇬🇧 rather than 🇺🇸: the catalog locale is generic English,
 * not a US variant. */
const LOCALE_FLAG: Record<Locale, string> = {
	uz: '🇺🇿',
	ru: '🇷🇺',
	en: '🇬🇧',
};

/**
 * Account preferences — currently just the interface language.
 *
 * This is where the language control belongs rather than the topbar: the choice
 * is written to the user's record (`PATCH /me/preferences`) and follows them to
 * their other devices and the other consoles, which makes it an account
 * setting, not a per-session toggle. The theme switch stays in the chrome
 * because it is the opposite — device-local and flipped situationally.
 *
 * Nobody can be stranded in a language they can't read: the login screen has
 * its own switcher, and a returning user's stored locale is applied at boot.
 */
export function PreferencesCard() {
	const t = useAppT('profile');
	const tc = useT('common');
	const { locale, locales, changeLocale, isSaving } = useLocalePreference();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('preferencesCardTitle')}</CardTitle>
				<CardDescription>{t('preferencesHint')}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-1.5 sm:max-w-xs">
					<div className="flex items-center gap-2">
						<Label htmlFor="language" className="text-muted-foreground">
							{tc('language.label')}
						</Label>
						{/* The switch is applied optimistically, so this only
						    confirms the save landing — it never gates the UI. */}
						{isSaving && (
							<span className="text-xs text-muted-foreground">
								{tc('state.saving')}
							</span>
						)}
					</div>
					<Select value={locale} onValueChange={changeLocale}>
						<SelectTrigger id="language">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{locales.map((code) => (
								<SelectItem key={code} value={code}>
									{/* `SelectItem` wraps its children in Radix's
									    `ItemText`, which isn't a flex container — an
									    emoji and a text node as separate children
									    would stack instead of sitting side by side.
									    Laying them out in one flex span here (rather
									    than relying on the trigger's own forced
									    `data-[slot=select-value]:flex`, which only
									    reaches the closed trigger) keeps the open
									    list matching it. */}
									<span className="flex items-center gap-2">
										<span
											aria-hidden
											className="text-base leading-none"
										>
											{LOCALE_FLAG[code]}
										</span>
										{tc(`language.${code}`)}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	);
}
