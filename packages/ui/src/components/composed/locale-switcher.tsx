import * as React from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

export type Locale = 'uz' | 'ru' | 'en';

const LOCALE_LABELS: Record<Locale, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };

interface LocaleSwitcherProps extends Omit<
	React.ComponentProps<'button'>,
	'onChange' | 'locale'
> {
	locale: Locale;
	onLocaleChange?: (locale: Locale) => void;
}

/**
 * Globe icon + current locale label; cycles through uz → ru → en on click.
 * Appears in the auth screen and app topbar of TEACH and PORTAL.
 */
function LocaleSwitcher({
	className,
	locale,
	onLocaleChange,
	...props
}: LocaleSwitcherProps) {
	function cycle() {
		const locales: Locale[] = ['uz', 'ru', 'en'];
		const idx = locales.indexOf(locale ?? 'uz');
		onLocaleChange?.(locales[(idx + 1) % locales.length]!);
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
