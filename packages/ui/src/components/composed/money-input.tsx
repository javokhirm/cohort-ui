import * as React from 'react';
import { formatPrice } from '@repo/utils';

import { cn } from '../../lib/utils';
import { Input } from '../input';

function formatGrouped(value: number | undefined): string {
	if (value === undefined || value === null || Number.isNaN(value)) return '';
	return formatPrice(value);
}

/** Strip every non-digit; an empty result means the field was cleared. */
function parseDigits(raw: string): number | undefined {
	const digits = raw.replace(/\D/g, '');
	return digits === '' ? undefined : Number(digits);
}

export interface MoneyInputProps extends Omit<
	React.ComponentProps<typeof Input>,
	'value' | 'onChange' | 'type' | 'inputMode'
> {
	value: number | undefined;
	onChange: (value: number | undefined) => void;
	/** Currency label rendered inside the field. Defaults to `UZS`. Pass `null` to hide. */
	suffix?: string | null;
}

/**
 * Integer currency input that formats with thousands separators as the user
 * types ("1 500 000") while emitting a plain `number`. For whole-unit
 * currencies like UZS — no decimals. Never store the formatted string; the form
 * value stays numeric.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
	function MoneyInput({ value, onChange, suffix = 'UZS', className, ...props }, ref) {
		return (
			<div className="relative">
				<Input
					{...props}
					ref={ref}
					type="text"
					inputMode="numeric"
					value={formatGrouped(value)}
					onChange={(e) => onChange(parseDigits(e.target.value))}
					className={cn(
						'text-right tabular-nums',
						suffix && 'pr-12',
						className,
					)}
				/>
				{suffix && (
					<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
						{suffix}
					</span>
				)}
			</div>
		);
	},
);
