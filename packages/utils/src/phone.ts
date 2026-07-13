/** Uzbekistan E.164 phone number: `+998` followed by 9 digits, e.g. `+998901234567`. */
export const UZ_PHONE_REGEX = /^\+998\d{9}$/;

/** True when `value` is a complete Uzbekistan E.164 phone number. */
export function isValidUzPhone(value: string): boolean {
	return UZ_PHONE_REGEX.test(value);
}
