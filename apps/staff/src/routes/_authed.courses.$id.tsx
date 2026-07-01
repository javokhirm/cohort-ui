import { CourseDetailPage } from '@/features/courses';

interface CourseDetailRouteProps {
	id: string;
}

export function CourseDetailRoute({ id }: CourseDetailRouteProps) {
	const courseId = Number(id);
	return <CourseDetailPage courseId={courseId} />;
}
