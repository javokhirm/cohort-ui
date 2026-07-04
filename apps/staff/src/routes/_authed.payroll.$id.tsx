import { PayrollDetailPage } from '@/features/payroll';

interface PayrollDetailRouteProps {
	id: string;
}

export function PayrollDetailRoute({ id }: PayrollDetailRouteProps) {
	const payrollId = Number(id);
	return <PayrollDetailPage payrollId={payrollId} />;
}
