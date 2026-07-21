import { PayrollDetailPage } from '@/features/payroll';
import { currentMonth } from '@/features/payroll/lib/month';

interface PayrollDetailRouteProps {
	staffId: string;
	/** `YYYY-MM` from the URL; defaults to the current Tashkent month. */
	month?: string;
}

export function PayrollDetailRoute({ staffId, month }: PayrollDetailRouteProps) {
	return (
		<PayrollDetailPage staffId={Number(staffId)} month={month ?? currentMonth()} />
	);
}
