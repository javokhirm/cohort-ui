interface TodayGreetingProps {
	/** e.g. "Good morning". */
	greeting: string;
	/** The teacher's first name, if the session summary is loaded. */
	firstName?: string;
	/** The center's today, already formatted (e.g. "Monday, 15 July"). */
	longDate: string;
}

/**
 * The Today screen's header: a time-of-day greeting and the center's current
 * date. Purely presentational — the greeting and date are resolved by the route
 * in the center's timezone.
 */
export function TodayGreeting({ greeting, firstName, longDate }: TodayGreetingProps) {
	return (
		<div className="mb-3.5">
			<h1 className="text-xl font-bold tracking-tight text-foreground">
				{greeting}
				{firstName ? `, ${firstName}` : ''}
			</h1>
			<p className="mt-0.5 text-[13px] text-muted-foreground">{longDate}</p>
		</div>
	);
}
