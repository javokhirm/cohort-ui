import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, BookOpen, CalendarDays, Edit } from 'lucide-react';

import { Button, Card, Separator, Skeleton, StatusBadge } from '@repo/ui';
import { useT } from '@repo/i18n';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';
import { useCourse, useCourseGroups, type CourseGroup } from '../api/courses.queries';
import type { CourseResponse } from '../api/courses.queries';
import { CourseForm } from '../components/CourseForm';

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="font-semibold">{value}</span>
		</div>
	);
}

// ─── Header + stats ─────────────────────────────────────────────────────────

function CourseHeader({
	course,
	activeGroups,
	onEdit,
}: {
	course: CourseResponse;
	activeGroups: number;
	onEdit: () => void;
}) {
	const t = useAppT('courses');
	const tc = useT('common');

	const subtitle = [
		course.level,
		course.defaultDurationWeeks != null
			? t('weeks', { count: course.defaultDurationWeeks })
			: null,
	]
		.filter(Boolean)
		.join(' · ');

	return (
		<div className="rounded-xl border bg-card p-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<BookOpen className="size-5" />
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-lg font-bold">{course.name}</h1>
							{course.isActive ? (
								<StatusBadge tone="green">
									{tc('state.active')}
								</StatusBadge>
							) : (
								<StatusBadge tone="slate">
									{tc('state.inactive')}
								</StatusBadge>
							)}
						</div>
						{subtitle && (
							<div className="mt-0.5 text-sm text-muted-foreground">
								{subtitle}
							</div>
						)}
					</div>
				</div>

				<Can permission="course.update">
					<Button variant="outline" size="sm" onClick={onEdit}>
						<Edit className="mr-1.5 size-3.5" />
						{t('edit')}
					</Button>
				</Can>
			</div>

			<Separator className="my-4" />

			<div className="grid grid-cols-3 gap-4">
				<Stat label={t('detail.statLevel')} value={course.level ?? '—'} />
				<Stat
					label={t('detail.statDuration')}
					value={
						course.defaultDurationWeeks != null
							? t('weeks', { count: course.defaultDurationWeeks })
							: '—'
					}
				/>
				<Stat label={t('detail.statActiveGroups')} value={String(activeGroups)} />
			</div>
		</div>
	);
}

// ─── Groups running this course ─────────────────────────────────────────────

function GroupRow({ group }: { group: CourseGroup }) {
	const t = useAppT('courses');

	return (
		<div className="flex items-center justify-between gap-4 px-4 py-3.5">
			<div className="flex items-center gap-3">
				<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<CalendarDays className="size-4" />
				</span>
				<div className="flex flex-col">
					<span className="text-sm font-semibold">{group.name}</span>
					<span className="text-xs text-muted-foreground">
						{group.roomName ?? t('detail.noRoom')}
					</span>
				</div>
			</div>
			<div className="flex flex-col items-end">
				<span className="text-sm font-medium">
					{group.defaultTeacherName ?? t('detail.unassigned')}
				</span>
				{group.capacity != null && (
					<span className="text-xs text-muted-foreground tabular-nums">
						{t('seats', { count: group.capacity })}
					</span>
				)}
			</div>
		</div>
	);
}

function GroupsSection({ courseId }: { courseId: number }) {
	const t = useAppT('courses');
	const { data, isLoading } = useCourseGroups(courseId);
	const groups = data?.rows ?? [];

	return (
		<div className="flex flex-col gap-3">
			<h2 className="text-sm font-semibold">{t('detail.groupsTitle')}</h2>
			{isLoading ? (
				<Card className="gap-0 divide-y divide-border py-0">
					{[1, 2].map((i) => (
						<div key={i} className="px-4 py-3.5">
							<Skeleton className="h-9 w-full" />
						</div>
					))}
				</Card>
			) : groups.length === 0 ? (
				<Card className="py-0">
					<div className="py-12 text-center text-sm text-muted-foreground">
						{t('detail.groupsEmpty')}
					</div>
				</Card>
			) : (
				<Card className="gap-0 divide-y divide-border py-0">
					{groups.map((group) => (
						<GroupRow key={group.id} group={group} />
					))}
				</Card>
			)}
		</div>
	);
}

// ─── Page ───────────────────────────────────────────────────────────────────

interface CourseDetailPageProps {
	courseId: number;
}

export function CourseDetailPage({ courseId }: CourseDetailPageProps) {
	const t = useAppT('courses');
	const [editOpen, setEditOpen] = useState(false);
	const { data: course, isLoading, isError } = useCourse(courseId);
	const { data: groupsData } = useCourseGroups(courseId);
	const activeGroups = groupsData?.total ?? 0;

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-5">
			<Link
				to="/courses"
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				{t('detail.back')}
			</Link>

			{isLoading ? (
				<div className="rounded-xl border bg-card p-5">
					<div className="flex items-center gap-4">
						<Skeleton className="size-12 rounded-xl" />
						<div className="flex flex-col gap-2">
							<Skeleton className="h-5 w-40" />
							<Skeleton className="h-4 w-56" />
						</div>
					</div>
				</div>
			) : isError || !course ? (
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					{t('detail.notFound')}
				</div>
			) : (
				<>
					<CourseHeader
						course={course}
						activeGroups={activeGroups}
						onEdit={() => setEditOpen(true)}
					/>
					<GroupsSection courseId={courseId} />
					<CourseForm
						mode="edit"
						course={course}
						open={editOpen}
						onOpenChange={setEditOpen}
					/>
				</>
			)}
		</div>
	);
}
