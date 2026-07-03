import { Link, useNavigate } from '@tanstack/react-router';
import {
	ArrowLeft,
	CalendarClock,
	CalendarDays,
	DoorOpen,
	Edit,
	GraduationCap,
	Users,
	UserCog,
} from 'lucide-react';

import {
	Button,
	Card,
	DetailRows,
	Separator,
	Skeleton,
	StatCard,
	StatusBadge,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@repo/ui';
import { formatDate } from '@repo/utils';

import { Can } from '@/components/Can';
import { useGroup, type GroupDetail } from '../api/groups.queries';
import { formatScheduleRule, GROUP_STATUS_META } from '../lib/group-options';
import { RosterSection } from '../components/RosterSection';
import { GroupSessionsSection } from '../components/GroupSessionsSection';

// ─── Header ──────────────────────────────────────────────────────────────────

function GroupHeader({ group, onEdit }: { group: GroupDetail; onEdit: () => void }) {
	const meta = GROUP_STATUS_META[group.status];
	const schedule = formatScheduleRule(group.scheduleRule);

	return (
		<div className="rounded-xl border bg-card p-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<CalendarDays className="size-5" />
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-lg font-bold">{group.name}</h1>
							<StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
						</div>
						<div className="mt-0.5 text-sm text-muted-foreground">
							{group.courseName}
							{schedule ? ` · ${schedule}` : ''}
						</div>
					</div>
				</div>

				<Can permission="group.update">
					<Button variant="outline" size="sm" onClick={onEdit}>
						<Edit className="mr-1.5 size-3.5" />
						Edit group
					</Button>
				</Can>
			</div>

			<Separator className="my-4" />

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCard
					label="Teacher"
					value={group.defaultTeacherName ?? 'Unassigned'}
					icon={<UserCog />}
					className="border"
				/>
				<StatCard
					label="Room"
					value={group.roomName ?? '—'}
					icon={<DoorOpen />}
					className="border"
				/>
				<StatCard
					label="Enrolled"
					value={
						group.capacity != null
							? `${group.activeEnrollmentsCount}/${group.capacity}`
							: group.activeEnrollmentsCount
					}
					icon={<Users />}
					className="border"
				/>
				<StatCard
					label="Sessions"
					value={group.sessionCount}
					icon={<CalendarClock />}
					className="border"
				/>
			</div>
		</div>
	);
}

// ─── Overview tab ────────────────────────────────────────────────────────────

function OverviewTab({ group }: { group: GroupDetail }) {
	const schedule = formatScheduleRule(group.scheduleRule);
	return (
		<Card className="p-5">
			<DetailRows
				rows={[
					{
						label: 'Course',
						value: group.courseName,
						icon: <GraduationCap />,
					},
					{
						label: 'Weekly schedule',
						value: schedule ?? 'Not set',
						icon: <CalendarClock />,
					},
					{
						label: 'Date range',
						value:
							group.startDate && group.endDate
								? `${formatDate(group.startDate)} → ${formatDate(group.endDate)}`
								: 'Not set',
						icon: <CalendarDays />,
					},
					{
						label: 'Capacity',
						value: group.capacity != null ? `${group.capacity} seats` : '—',
						icon: <Users />,
					},
				]}
			/>
		</Card>
	);
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface GroupDetailPageProps {
	groupId: number;
}

export function GroupDetailPage({ groupId }: GroupDetailPageProps) {
	const navigate = useNavigate();
	const { data: group, isLoading, isError } = useGroup(groupId);

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-5">
			<Link
				to="/groups"
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				Back to groups
			</Link>

			{isLoading ? (
				<div className="rounded-xl border bg-card p-5">
					<div className="flex items-center gap-4">
						<Skeleton className="size-12 rounded-xl" />
						<div className="flex flex-col gap-2">
							<Skeleton className="h-5 w-48" />
							<Skeleton className="h-4 w-64" />
						</div>
					</div>
				</div>
			) : isError || !group ? (
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					Group not found.
				</div>
			) : (
				<>
					<GroupHeader
						group={group}
						onEdit={() =>
							void navigate({
								to: '/groups/$groupId/edit',
								params: { groupId: String(group.id) },
							})
						}
					/>

					<Tabs defaultValue="roster" className="gap-4">
						<TabsList>
							<TabsTrigger value="roster">Roster</TabsTrigger>
							<TabsTrigger value="sessions">Sessions</TabsTrigger>
							<TabsTrigger value="overview">Overview</TabsTrigger>
						</TabsList>

						<TabsContent value="roster">
							<RosterSection groupId={group.id} capacity={group.capacity} />
						</TabsContent>
						<TabsContent value="sessions">
							<GroupSessionsSection groupId={group.id} />
						</TabsContent>
						<TabsContent value="overview">
							<OverviewTab group={group} />
						</TabsContent>
					</Tabs>
				</>
			)}
		</div>
	);
}
