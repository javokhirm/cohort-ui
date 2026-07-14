import { CalendarDays } from 'lucide-react';

import { EmptyState } from '@repo/ui';

import { useSessionStore } from '@/store/sessionStore';

/**
 * Placeholder. The schedule lands here once this screen is wired to
 * `GET /teach/sessions` (requires `from` + `to`, max a 90-day window).
 */
export function TodayRoute() {
	const user = useSessionStore((s) => s.user);

	return (
		<div className="mx-auto w-full max-w-5xl">
			<h1 className="text-[22px] font-bold tracking-tight text-foreground">
				Good morning{user ? `, ${user.firstName}` : ''}
			</h1>

			<div className="mt-5 rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<CalendarDays />}
					title="No classes loaded yet"
					description="Today's sessions will appear here once this screen is wired to the teach schedule endpoint."
				/>
			</div>
		</div>
	);
}
