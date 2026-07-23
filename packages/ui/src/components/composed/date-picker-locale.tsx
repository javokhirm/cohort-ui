import * as React from 'react';
import type { DateFnsLocale } from '@repo/utils';

/**
 * App-provided defaults for `@repo/ui`'s date pickers, set once per app:
 *
 * ```tsx
 * <DatePickerLocaleProvider
 *   locale={useDateFnsLocale()}
 *   selectDatePlaceholder={t('field.selectDate')}
 * >
 *   <App />
 * </DatePickerLocaleProvider>
 * ```
 *
 * so every `DatePicker`/`FormDatePicker` picks up the active locale and a
 * localized empty-state placeholder without threading props through each call
 * site. `@repo/ui` never reads the active locale or catalog itself — the app
 * pushes them in, keeping this package free of an i18n dependency. Without a
 * provider both are `undefined`: react-day-picker falls back to English and the
 * trigger shows no placeholder, so unwrapped trees keep working.
 */
interface DatePickerConfig {
	locale: DateFnsLocale | undefined;
	selectDatePlaceholder: string | undefined;
}

const DatePickerLocaleContext = React.createContext<DatePickerConfig>({
	locale: undefined,
	selectDatePlaceholder: undefined,
});

export function DatePickerLocaleProvider({
	locale,
	selectDatePlaceholder,
	children,
}: {
	locale: DateFnsLocale | undefined;
	selectDatePlaceholder?: string;
	children: React.ReactNode;
}) {
	const value = React.useMemo(
		() => ({ locale, selectDatePlaceholder }),
		[locale, selectDatePlaceholder],
	);
	return (
		<DatePickerLocaleContext.Provider value={value}>
			{children}
		</DatePickerLocaleContext.Provider>
	);
}

/** The app-provided date-fns locale, or `undefined` when no provider is mounted. */
export function useDatePickerLocale(): DateFnsLocale | undefined {
	return React.useContext(DatePickerLocaleContext).locale;
}

/** The app-provided default "select date" placeholder, or `undefined`. */
export function useDatePickerPlaceholder(): string | undefined {
	return React.useContext(DatePickerLocaleContext).selectDatePlaceholder;
}
