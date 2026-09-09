import { Globe } from 'lucide-react';

import {
	Card,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui';
import { useT } from '@repo/i18n';

import { useLocalePreference } from '@/hooks/useLocalePreference';
import { useAppT } from '@/locales';

/**
 * Account preferences — currently just the interface language.
 *
 * This is where the language control belongs rather than the topbar: the choice
 * is written to the operator's record (`PATCH /super-admin/me/preferences`) and
 * follows them across devices, which makes it an account setting, not a
 * per-session toggle. The theme switch stays in the chrome because it is the
 * opposite — device-local and flipped situationally.
 *
 * Follows the profile page's own idiom: a section heading over a card of
 * icon + label + trailing-control rows, like Security above it.
 */
export function PreferencesSection() {
	const tp = useAppT('profile');
	const tc = useT('common');
	const { locale, locales, changeLocale, isSaving } = useLocalePreference();

	return (
		<div className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold">{tp('preferences')}</h2>

			<Card className="gap-0 py-0">
				<div className="flex items-center gap-4 px-5 py-4">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
						<Globe className="size-4.5 text-muted-foreground" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium">{tc('language.label')}</p>
						<p className="text-xs text-muted-foreground">
							{/* The switch is applied optimistically, so the saving
							    note only confirms it landed — it never gates the UI. */}
							{isSaving ? tc('state.saving') : tp('languageHint')}
						</p>
					</div>
					<Select
						className="w-auto shrink-0"
						value={locale}
						onValueChange={changeLocale}
					>
						<SelectTrigger size="sm" className="w-36">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{locales.map((code) => (
								<SelectItem key={code} value={code}>
									{tc(`language.${code}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</Card>
		</div>
	);
}
