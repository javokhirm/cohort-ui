import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import {
	Button,
	Card,
	PageHeader,
	Pagination,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SearchFilterBar,
} from '@repo/ui';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { Can } from '@/components/Can';
import { useCourseList } from '@/features/courses/api/courses.queries';

import { useGroupList } from '../api/groups.queries';
import type { GroupListFilters } from '../api/keys';
import { GROUP_STATUS_FILTERS } from '../lib/group-options';
import { GroupTable } from '../components/GroupTable';

const PAGE_SIZE = 20;
const ALL = 'all';

export function GroupListPage() {
	const t = useAppT('groups');
	const tc = useT('common');
	const navigate = useNavigate({ from: '/groups' });
	const { page = 1, courseId, status } = useSearch({ from: '/_authed/groups' });

	const { data: courseData } = useCourseList({ limit: 100, isActive: true });
	const courses = courseData?.rows ?? [];

	const filters: GroupListFilters = {
		page,
		limit: PAGE_SIZE,
		courseId,
		status,
	};

	const { data, isLoading, isError } = useGroupList(filters);
	const groups = data?.rows ?? [];
	const total = data?.total ?? 0;

	function setSearch(patch: Partial<GroupListFilters>) {
		void navigate({
			search: (prev) => ({ ...prev, ...patch, page: undefined }),
		});
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title={t('title')}
				description={t('description')}
				actions={
					<Can permission="group.create">
						<Button onClick={() => void navigate({ to: '/groups/new' })}>
							<Plus className="mr-1.5 size-4" />
							{t('create')}
						</Button>
					</Can>
				}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={GROUP_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.value ? t(`status.${f.value}`) : tc('state.all'),
						active: status === f.value,
						onClick: () => setSearch({ status: f.value }),
					}))}
					actions={
						<div className="flex items-center gap-2">
							<Select
								value={courseId ? String(courseId) : ALL}
								onValueChange={(v) =>
									setSearch({
										courseId: v === ALL ? undefined : Number(v),
									})
								}
							>
								<SelectTrigger className="h-9 w-44" size="sm">
									<SelectValue placeholder={t('allCourses')} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL}>{t('allCourses')}</SelectItem>
									{courses.map((c) => (
										<SelectItem key={c.id} value={String(c.id)}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load groups. Please refresh.
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<GroupTable groups={groups} isLoading={isLoading} />
					<div className="border-t border-border px-4 py-3">
						<Pagination
							page={page}
							pageSize={PAGE_SIZE}
							total={total}
							onPageChange={handlePage}
						/>
					</div>
				</Card>
			</div>
		</div>
	);
}
