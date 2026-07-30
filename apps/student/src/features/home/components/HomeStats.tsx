import { BellDot, CalendarCheck, Flame } from 'lucide-react';

import { StatCard } from '@repo/ui';

import type { StudentHome } from '../api/home.queries';
import { useAppT } from '@/locales';

interface HomeStatsProps {
	attendance: StudentHome['attendance'];
	unreadCount: number;
}

/** The Home screen's momentum row: attendance rate, current streak, unread messages. */
export function HomeStats({ attendance, unreadCount }: HomeStatsProps) {
	const t = useAppT('home');

	return (
		<div className="grid grid-cols-3 gap-3">
			<StatCard
				label={t('attendanceRate')}
				value={attendance.rate === null ? '—' : `${attendance.rate}%`}
				icon={<CalendarCheck />}
			/>
			<StatCard
				label={t('streak')}
				value={attendance.streak}
				icon={<Flame />}
				hint={t('streakHint')}
			/>
			<StatCard label={t('unread')} value={unreadCount} icon={<BellDot />} />
		</div>
	);
}
