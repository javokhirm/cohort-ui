import { CalendarCheck, Flame } from 'lucide-react';

import type { StudentHome } from '../api/home.queries';
import { attendanceCheer, streakCheer } from '../lib/cheer';
import { MomentumTile } from './MomentumTile';
import { useAppT } from '@/locales';

interface HomeStatsProps {
	attendance: StudentHome['attendance'];
}

/**
 * The Home screen's momentum row: current streak and the term attendance rate,
 * the two figures a student can move themselves.
 *
 * Both are read straight off `GET /student/home`. The rate is nullable — nothing
 * has been marked yet — and that case gets an em dash and no bar rather than a
 * zero, which would read as a perfect attendance record missed.
 */
export function HomeStats({ attendance }: HomeStatsProps) {
	const t = useAppT('home');
	const { rate, streak } = attendance;

	return (
		<div className="grid grid-cols-2 gap-3">
			<MomentumTile
				tone="amber"
				icon={<Flame />}
				label={t('streak')}
				value={streak}
				unit={t('streakUnit')}
				cheer={t(streakCheer(streak))}
			/>
			<MomentumTile
				tone="green"
				icon={<CalendarCheck />}
				label={t('attendanceRate')}
				value={rate === null ? '—' : `${rate}%`}
				progress={rate ?? undefined}
				cheer={rate === null ? t('attendanceEmpty') : t(attendanceCheer(rate))}
			/>
		</div>
	);
}
