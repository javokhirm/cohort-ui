import { StudentDetailScreen } from '@/features/people';

interface StudentDetailRouteProps {
	id: string;
}

export function StudentDetailRoute({ id }: StudentDetailRouteProps) {
	const studentId = Number(id);
	return <StudentDetailScreen studentId={studentId} />;
}
