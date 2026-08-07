import { Tabs, TabsList, TabsTrigger } from '@repo/ui';

import type { LeaderboardPeriod } from '../lib/period';
import { useAppT } from '@/locales';

interface PeriodToggleProps {
	value: LeaderboardPeriod;
	onChange: (period: LeaderboardPeriod) => void;
}

/**
 * The window switch: this month or all time. Two fixed options rather than a
 * month picker — a student comparing themselves against an arbitrary past month
 * is not a thing the screen is for, and it keeps the empty states finite.
 */
export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
	const t = useAppT('leaderboard');

	return (
		<Tabs
			value={value}
			onValueChange={(next) => onChange(next as LeaderboardPeriod)}
			className="w-full sm:w-64 sm:shrink-0"
		>
			<TabsList className="w-full">
				<TabsTrigger value="month" className="flex-1">
					{t('periodMonth')}
				</TabsTrigger>
				<TabsTrigger value="all" className="flex-1">
					{t('periodAll')}
				</TabsTrigger>
			</TabsList>
		</Tabs>
	);
}
