import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { useTheme } from '@repo/ui/lib/theme';

type ThemeToggleProps = React.ComponentProps<'button'>;

/**
 * Icon button that flips the app between the light and dark palettes. Both
 * icons are always mounted and cross-faded by the `dark` variant, so the swap
 * is pure CSS and the button never changes size mid-click.
 *
 * Styled for the standard topbar; pass `className` to match a different chrome
 * (the internal console overrides the colors with its `--console-*` tokens).
 */
function ThemeToggle({ className, ...props }: ThemeToggleProps) {
	const { isDark, toggleTheme } = useTheme();
	const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

	return (
		<button
			type="button"
			data-slot="theme-toggle"
			onClick={toggleTheme}
			aria-label={label}
			title={label}
			className={cn(
				'relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
				className,
			)}
			{...props}
		>
			<Sun
				aria-hidden
				className="size-[18px] rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100"
			/>
			<Moon
				aria-hidden
				className="absolute size-[18px] scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0"
			/>
		</button>
	);
}

export { ThemeToggle };
export type { ThemeToggleProps };
