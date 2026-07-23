import * as React from 'react';
import { Globe } from 'lucide-react';
import type { Locale } from '@repo/utils';
import { cn } from '@repo/ui/lib/utils';

/** Re-exported so `@repo/ui` consumers keep importing `Locale` from the barrel. */
export type { Locale };

const LOCALE_LABELS: Record<Locale, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };

const LOCALE_ORDER: Locale[] = ['uz', 'ru', 'en'];

interface LocaleSwitcherProps extends Omit<
	React.ComponentProps<'button'>,
	'onChange' | 'locale'
> {
	locale: Locale;
	onLocaleChange?: (locale: Locale) => void;
}

/**
 * Globe icon + current locale label; cycles through uz → ru → en on click.
 * Purely presentational — the caller owns the locale and persists the choice
 * (localStorage + `PATCH /me/preferences`). Used on the auth screens and the
 * teacher shell; the desktop consoles use a dropdown in their Header instead.
 */
function LocaleSwitcher({
	className,
	locale,
	onLocaleChange,
	...props
}: LocaleSwitcherProps) {
	function cycle() {
		const idx = LOCALE_ORDER.indexOf(locale ?? 'uz');
		onLocaleChange?.(LOCALE_ORDER[(idx + 1) % LOCALE_ORDER.length]!);
	}

	return (
		<button
			type="button"
			data-slot="locale-switcher"
			onClick={cycle}
			className={cn(
				'flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted',
				className,
			)}
			{...props}
		>
			<Globe className="size-3.5" />
			{LOCALE_LABELS[locale]}
		</button>
	);
}

export { LocaleSwitcher };
export type { LocaleSwitcherProps };
