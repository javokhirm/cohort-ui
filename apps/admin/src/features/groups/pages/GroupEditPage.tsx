import { Link } from '@tanstack/react-router';

import { PageNav, Skeleton } from '@repo/ui';
import { useT } from '@repo/i18n';

import { useGoBack } from '@/hooks/useGoBack';
import { useAppT } from '@/locales';

import { useGroup } from '../api/groups.queries';
import { GroupFormPage } from './GroupFormPage';

interface GroupEditPageProps {
	groupId: number;
}

export function GroupEditPage({ groupId }: GroupEditPageProps) {
	const t = useAppT('groups');
	const tc = useT('common');
	const { data: group, isLoading, isError } = useGroup(groupId);
	// The group itself is what this form edits, so it is where a cold-opened
	// edit URL belongs — but only while there is a group to go to. The error
	// branch below aims at the list instead.
	const goBack = useGoBack({
		to: '/groups/$groupId',
		params: { groupId: String(groupId) },
	});
	const goBackToList = useGoBack({ to: '/groups' });

	// Two crumbs, not three: the group's name is not known yet, and a crumb that
	// appears a beat later would shift the header under the pointer.
	const pageNav = (onBack: () => void) => (
		<PageNav
			onBack={onBack}
			backLabel={tc('action.back')}
			crumbs={[
				{ label: t('title'), link: <Link to="/groups" /> },
				{ label: tc('action.edit') },
			]}
		/>
	);

	if (isLoading) {
		return (
			<div className="mx-auto flex max-w-6xl flex-col gap-5">
				{pageNav(goBack)}
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
				{pageNav(goBackToList)}
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					{t('detail.notFound')}
				</div>
			</div>
		);
	}

	return <GroupFormPage mode="edit" group={group} />;
}
