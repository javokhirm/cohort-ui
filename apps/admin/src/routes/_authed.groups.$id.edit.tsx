import { GroupEditPage } from '@/features/groups';

interface GroupEditRouteProps {
	id: string;
}

export function GroupEditRoute({ id }: GroupEditRouteProps) {
	const groupId = Number(id);
	return <GroupEditPage groupId={groupId} />;
}
