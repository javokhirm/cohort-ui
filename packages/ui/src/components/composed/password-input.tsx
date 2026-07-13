import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Input } from '../input';

export interface PasswordInputProps extends Omit<
	React.ComponentProps<typeof Input>,
	'type'
> {
	/** Accessible label for the reveal toggle. */
	toggleLabel?: string;
}

/**
 * Password entry with a reveal toggle. The toggle is a button — not a checkbox —
 * so it never lands in the form's submitted values, and it's excluded from the tab
 * order so keyboard users move password → submit without a detour.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
	function PasswordInput(
		{ className, disabled, toggleLabel = 'Show password', ...props },
		ref,
	) {
		const [visible, setVisible] = React.useState(false);
		const Icon = visible ? EyeOff : Eye;

		return (
			<div data-slot="password-input" className="relative">
				<Input
					{...props}
					ref={ref}
					type={visible ? 'text' : 'password'}
					disabled={disabled}
					className={cn('pr-9', className)}
				/>
				<button
					type="button"
					tabIndex={-1}
					disabled={disabled}
					aria-label={toggleLabel}
					aria-pressed={visible}
					onClick={() => setVisible((current) => !current)}
					className="absolute inset-y-0 right-0 flex items-center rounded-md px-2.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
				>
					<Icon className="size-4" aria-hidden />
				</button>
			</div>
		);
	},
);
