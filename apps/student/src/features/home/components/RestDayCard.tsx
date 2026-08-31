import { CalendarDays, Coffee } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { Button, Card } from '@repo/ui';

import { useAppT } from '@/locales';

/**
 * Home's hero on a day with no classes at all.
 *
 * Without it the screen would open on a stats row, which reads as an error the
 * first time a student sees it. This states the day plainly and hands over the
 * one thing they actually came to find out: when they are next expected.
 *
 * It is the app's ordinary panel, with the brand's own soft indigo on the mark —
 * a rest day has no class to make the hero out of, so it borrows the brand
 * rather than inventing a colour for "nothing scheduled".
 *
 * Unlike the other two heroes this is not a whole-card target: there is no
 * session to open, so it carries one explicit action instead of a card-wide
 * `role="button"` that would announce itself without saying where it leads. The
 * action is a real `Button`, so it needs none of `clickableCardProps`.
 */
export function RestDayCard() {
	const t = useAppT('home');

	return (
		<Card className="gap-0 py-0">
			<div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
				<span className="flex size-12 items-center justify-center rounded-xl bg-tone-indigo-bg text-tone-indigo-fg">
					<Coffee className="size-6" />
				</span>
				<div>
					<p className="text-base font-bold tracking-tight text-foreground">
						{t('todayEmptyTitle')}
					</p>
					<p className="mx-auto mt-1 max-w-72 text-xs text-muted-foreground">
						{t('restDayDescription')}
					</p>
				</div>
				<Button asChild size="sm" variant="outline">
					<Link to="/schedule">
						<CalendarDays />
						{t('fullSchedule')}
					</Link>
				</Button>
			</div>
		</Card>
	);
}
