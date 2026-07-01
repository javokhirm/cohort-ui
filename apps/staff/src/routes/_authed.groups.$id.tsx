import { GroupDetailPage } from '@/features/groups';

interface GroupDetailRouteProps {
	id: string;
}

export function GroupDetailRoute({ id }: GroupDetailRouteProps) {
	const groupId = Number(id);
	return <GroupDetailPage groupId={groupId} />;
}
