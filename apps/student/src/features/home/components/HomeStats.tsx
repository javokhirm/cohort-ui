import { CalendarCheck, Flame } from 'lucide-react';

import { StatCard } from '@repo/ui';

import type { StudentHome } from '../api/home.queries';
import { useAppT } from '@/locales';

interface HomeStatsProps {
	attendance: StudentHome['attendance'];
}

/** The Home screen's momentum row: current streak and the term attendance rate. */
export function HomeStats({ attendance }: HomeStatsProps) {
	const t = useAppT('home');

	return (
		<div className="grid grid-cols-3 gap-3">
			<StatCard
				label={t('streak')}
				value={attendance.streak}
				icon={<Flame />}
				hint={t('streakHint')}
			/>
			<StatCard
				label={t('attendanceRate')}
				value={attendance.rate === null ? '—' : `${attendance.rate}%`}
				icon={<CalendarCheck />}
			/>
		</div>
	);
}
