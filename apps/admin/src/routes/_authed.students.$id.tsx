import { StudentDetailPage } from '@/features/people';

interface StudentDetailRouteProps {
	id: string;
}

export function StudentDetailRoute({ id }: StudentDetailRouteProps) {
	const studentId = Number(id);
	return <StudentDetailPage studentId={studentId} />;
}
