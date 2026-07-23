import { useNavigate } from '@tanstack/react-router';
import { FilePlus2, Plus, UsersRound } from 'lucide-react';

import { Button } from '@repo/ui';
import { currentHour, formatFullDate, todayIsoDate } from '@repo/utils';

import { useSessionStore } from '@/store/sessionStore';
import { useAppT } from '@/locales';

/**
 * Dashboard greeting + quick actions. The name comes from the logged-in staff
 * profile; the date/greeting are computed in the tenant timezone via the shared
 * `@repo/utils` helpers, so the date localizes with the active language.
 */
export function DashboardHeader() {
	const t = useAppT('dashboard');
	const navigate = useNavigate();
	const user = useSessionStore((s) => s.user);

	const hour = currentHour();
	const dateLabel = formatFullDate(todayIsoDate(), { year: true });

	// User-facing text must not be hardcoded (conventions §7); the key is
	// picked here and resolved with `t` so a language switch re-translates.
	const greetingKey =
		hour < 12
			? 'greeting.morning'
			: hour < 18
				? 'greeting.afternoon'
				: 'greeting.evening';
	const greetingText = t(greetingKey);

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					{user
						? t('greeting.withName', {
								greeting: greetingText,
								name: user.firstName,
							})
						: greetingText}
				</h1>
				<p className="text-sm text-muted-foreground">{dateLabel}</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => void navigate({ to: '/students' })}
				>
					<UsersRound className="size-4" />
					{t('addStudent')}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => void navigate({ to: '/groups/new' })}
				>
					<Plus className="size-4" />
					{t('newGroup')}
				</Button>
				<Button size="sm" onClick={() => void navigate({ to: '/invoices' })}>
					<FilePlus2 className="size-4" />
					{t('createInvoice')}
				</Button>
			</div>
		</div>
	);
}
