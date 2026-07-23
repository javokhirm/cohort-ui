import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { Skeleton } from '@repo/ui';

import { useGroup } from '../api/groups.queries';
import { GroupFormPage } from './GroupFormPage';
import { useAppT } from '@/locales';

interface GroupEditPageProps {
	groupId: number;
}

export function GroupEditPage({ groupId }: GroupEditPageProps) {
	const t = useAppT('groups');
	const { data: group, isLoading, isError } = useGroup(groupId);

	if (isLoading) {
		return (
			<div className="mx-auto flex max-w-6xl flex-col gap-5">
				<Link
					to="/groups"
					className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					{t('back')}
				</Link>
				<div className="flex flex-col gap-2">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	if (isError || !group) {
		return (
			<div className="mx-auto flex max-w-6xl flex-col gap-5">
				<Link
					to="/groups"
					className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" />
					{t('back')}
				</Link>
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					Group not found.
				</div>
			</div>
		);
	}

	return <GroupFormPage mode="edit" group={group} />;
}
