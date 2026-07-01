import { StaffDetailPage } from '@/features/hr';

interface StaffDetailRouteProps {
	id: string;
}

export function StaffDetailRoute({ id }: StaffDetailRouteProps) {
	const staffId = Number(id);
	return <StaffDetailPage staffId={staffId} />;
}
