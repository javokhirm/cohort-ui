import { useEffect, useState } from 'react';

/**
 * The value `input` settled on, `delay` ms after the last change.
 *
 * Used to keep a query off the wire while the operator is still typing — the
 * guardian phone lookup fires once per number, not once per keystroke. Pairs
 * with a TanStack Query key built from the debounced value, so a late response
 * to an older number can never overwrite the answer for a newer one.
 */
export function useDebouncedValue<T>(input: T, delay: number): T {
	const [settled, setSettled] = useState(input);

	useEffect(() => {
		const timer = setTimeout(() => setSettled(input), delay);
		return () => clearTimeout(timer);
	}, [input, delay]);

	return settled;
}
