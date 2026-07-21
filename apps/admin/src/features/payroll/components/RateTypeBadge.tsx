import { StatusBadge } from '@repo/ui';

import type { RateType } from '../api/keys';

interface RateTypeBadgeProps {
	rateType: RateType;
	/** Shown inside the pill for PERCENT teachers, e.g. `50%`. */
	percent?: number | null;
}

/** Pay-model pill (Fixed / Hourly / Percent) from the `payroll_rate` map. */
export function RateTypeBadge({ rateType, percent }: RateTypeBadgeProps) {
	if (rateType === 'PERCENT' && percent != null) {
		return (
			<StatusBadge kind="payroll_rate" status={rateType}>
				{percent}%
			</StatusBadge>
		);
	}
	return <StatusBadge kind="payroll_rate" status={rateType} />;
}
