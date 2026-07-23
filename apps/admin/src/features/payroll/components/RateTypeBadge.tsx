import { StatusBadge } from '@repo/ui';
import { useStatusLabel } from '@repo/i18n';

import type { RateType } from '../api/keys';

interface RateTypeBadgeProps {
	rateType: RateType;
	/** Shown inside the pill for PERCENT teachers, e.g. `50%`. */
	percent?: number | null;
}

/** Pay-model pill (Fixed / Hourly / Percent) from the `payroll_rate` map. */
export function RateTypeBadge({ rateType, percent }: RateTypeBadgeProps) {
	const statusLabel = useStatusLabel();
	if (rateType === 'PERCENT' && percent != null) {
		return (
			<StatusBadge kind="payroll_rate" status={rateType}>
				{percent}%
			</StatusBadge>
		);
	}
	return (
		<StatusBadge kind="payroll_rate" status={rateType}>
			{statusLabel('payroll_rate', rateType)}
		</StatusBadge>
	);
}
