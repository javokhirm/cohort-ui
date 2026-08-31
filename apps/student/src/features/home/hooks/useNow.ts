import { useEffect, useState } from 'react';

/**
 * A `Date` that re-renders its caller on a fixed tick — Home's live clock.
 *
 * The hero card counts down to the next class and fills a progress bar while one
 * is running, both of which are only true at the instant they were computed.
 * Without a tick a student who opens the app at 08:35 keeps reading "starts in
 * 25 min" long after the class has begun.
 *
 * Thirty seconds is deliberately coarse: everything read off this clock is
 * rounded to whole minutes, so a faster tick would re-render for nothing.
 *
 * A backgrounded tab has its timers throttled to once a minute or worse, so the
 * clock is also resynced on `visibilitychange` — what the student sees when they
 * come back is current, not whenever the throttled interval last happened to
 * fire.
 */
export function useNow(intervalMs = 30_000): Date {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const tick = () => setNow(new Date());
		const id = window.setInterval(tick, intervalMs);
		document.addEventListener('visibilitychange', tick);
		return () => {
			window.clearInterval(id);
			document.removeEventListener('visibilitychange', tick);
		};
	}, [intervalMs]);

	return now;
}
