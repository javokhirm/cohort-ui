import { useNavigate } from '@tanstack/react-router';
import { FilePlus2, Plus, UsersRound } from 'lucide-react';

import { Button } from '@repo/ui';
import { TASHKENT_TZ } from '@repo/utils';

import { useSessionStore } from '@/store/sessionStore';
import { useAppT } from '@/locales';

/** Time-of-day greeting for the given hour (0–23) in the tenant timezone. */
function greeting(hour: number): string {
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

/**
 * Dashboard greeting + quick actions. The name comes from the logged-in staff
 * profile; the date/greeting are computed in the tenant timezone (`Intl`, no
 * extra date dependency in the app).
 */
export function DashboardHeader() {
	const t = useAppT('dashboard');
	const navigate = useNavigate();
	const user = useSessionStore((s) => s.user);

	const now = new Date();
	const hour = Number(
		new Intl.DateTimeFormat('en-US', {
			timeZone: TASHKENT_TZ,
			hour: 'numeric',
			hour12: false,
		}).format(now),
	);
	const dateLabel = new Intl.DateTimeFormat('en-US', {
		timeZone: TASHKENT_TZ,
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(now);

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					{greeting(hour)}
					{user ? `, ${user.firstName}` : ''}
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
