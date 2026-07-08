import { StaffEditPage } from '@/features/hr';

interface StaffEditRouteProps {
	id: string;
}

export function StaffEditRoute({ id }: StaffEditRouteProps) {
	const staffId = Number(id);
	return <StaffEditPage staffId={staffId} />;
}
