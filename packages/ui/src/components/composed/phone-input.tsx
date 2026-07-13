import * as React from 'react';

import { cn } from '../../lib/utils';
import { Input } from '../input';

/** Cohort operates in Uzbekistan only — the country code is fixed, not chosen. */
const COUNTRY_CODE = '+998';
const COUNTRY_DIGITS = COUNTRY_CODE.slice(1);

/** Display mask for the national number: "90 123 45 67". */
const NATIONAL_GROUPS = [2, 3, 2, 2];
const NATIONAL_LENGTH = NATIONAL_GROUPS.reduce((total, size) => total + size, 0);

/**
 * The national digits behind any shape a value can arrive in: the E.164 string
 * this component emits ("+998901234567"), the masked text the user is midway
 * through typing ("90 123 4"), or a number pasted in one of the other forms the
 * backend normalizes ("998…", "00998…", "+998 90 123 45 67").
 */
function toNationalDigits(raw: string | undefined): string {
	if (!raw) return '';
	return stripCountryCode(raw).slice(0, NATIONAL_LENGTH);
}

function stripCountryCode(raw: string): string {
	const digits = raw.replace(/\D/g, '');
	// A literal "+998" can only be the country code — this is the shape we emit,
	// so it's the case that runs on every keystroke.
	if (raw.trimStart().startsWith(COUNTRY_CODE)) {
		return digits.slice(COUNTRY_DIGITS.length);
	}
	if (digits.startsWith(`00${COUNTRY_DIGITS}`)) {
		return digits.slice(2 + COUNTRY_DIGITS.length);
	}
	// A bare "998…" run is only the country code once it's too long to be a
	// national number by itself — a national number can start "99" + "8" too.
	if (digits.length > NATIONAL_LENGTH && digits.startsWith(COUNTRY_DIGITS)) {
		return digits.slice(COUNTRY_DIGITS.length);
	}
	return digits;
}

/** "901234567" → "90 123 45 67". */
function formatNational(national: string): string {
	const groups: string[] = [];
	let index = 0;
	for (const size of NATIONAL_GROUPS) {
		if (index >= national.length) break;
		groups.push(national.slice(index, index + size));
		index += size;
	}
	return groups.join(' ');
}

/** "901234567" → "+998901234567". Empty stays empty, so a cleared field is falsy. */
function toE164(national: string): string {
	return national ? `${COUNTRY_CODE}${national}` : '';
}

export interface PhoneInputProps extends Omit<
	React.ComponentProps<typeof Input>,
	'value' | 'onChange' | 'type' | 'inputMode'
> {
	value: string | undefined;
	onChange: (value: string) => void;
}

/**
 * Uzbekistan phone entry: a fixed `+998` prefix, then the 9-digit national
 * number masked as it's typed ("90 123 45 67"). The value stays the plain E.164
 * string ("+998901234567") — or `''` when cleared — never the masked text.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
	function PhoneInput(
		{
			value,
			onChange,
			className,
			placeholder = '90 123 45 67',
			autoComplete = 'tel',
			disabled,
			...props
		},
		ref,
	) {
		return (
			<div data-slot="phone-input" className="relative">
				{/* Click-through, so the prefix behaves like part of the field: clicking
				    it lands on the input's padding and focuses it. */}
				<div
					className={cn(
						'pointer-events-none absolute inset-y-0 left-0 flex items-center gap-2 pl-3',
						disabled && 'opacity-50',
					)}
				>
					<span className="text-sm text-muted-foreground">{COUNTRY_CODE}</span>
					<span aria-hidden className="h-4 w-px bg-border" />
				</div>
				<Input
					{...props}
					ref={ref}
					type="tel"
					inputMode="numeric"
					autoComplete={autoComplete}
					disabled={disabled}
					placeholder={placeholder}
					value={formatNational(toNationalDigits(value))}
					onChange={(event) =>
						onChange(toE164(toNationalDigits(event.target.value)))
					}
					className={cn('pl-16 tabular-nums', className)}
				/>
			</div>
		);
	},
);
