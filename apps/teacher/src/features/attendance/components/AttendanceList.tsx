import { Check, CheckCheck } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	cn,
	resolveStatus,
	StickyActionBar,
	TONE_ACCENT_CLASSES,
	TONE_CLASSES,
} from '@repo/ui';

import { initialsFromName } from '@/lib/initials';

import {
	ATTENDANCE_STATUSES,
	type AttendanceStatus,
	type SessionDetail,
} from '../api/attendance.queries';
import { StatusToggle } from './StatusToggle';
import { useAppT } from '@/locales';

interface AttendanceListProps {
	detail: SessionDetail;
	/** Draft status per studentId (the editable form state). */
	draft: Map<number, AttendanceStatus>;
	isSaving: boolean;
	isDirty: boolean;
	onChangeStatus: (studentId: number, status: AttendanceStatus) => void;
	onMarkAllPresent: () => void;
	onSave: () => void;
}

/**
 * The current-day attendance sheet: a live per-status tally with an "All
 * present" shortcut, a topic note, and one Present/Absent/Late/Excused selector
 * per rostered student. Fills its parent as a flex column — the roster scrolls
 * while a docked footer bar saves the whole class in a batch.
 *
 * Each row carries its current status as a tone stripe down its left edge, so a
 * teacher can find the two absentees in a class of thirty by scanning the margin
 * instead of reading every selector.
 */
export function AttendanceList({
	detail,
	draft,
	isSaving,
	isDirty,
	onChangeStatus,
	onMarkAllPresent,
	onSave,
}: AttendanceListProps) {
	const t = useAppT('attendance');
	const tally = ATTENDANCE_STATUSES.map((status) => ({
		status,
		...resolveStatus('attendance', status),
		count: detail.roster.filter((s) => draft.get(s.studentId) === status).length,
	}));
	const present = tally.find((t) => t.status === 'PRESENT')?.count ?? 0;
	const absent = tally.find((t) => t.status === 'ABSENT')?.count ?? 0;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
				<ul className="flex flex-wrap items-center gap-1.5">
					{tally.map((t) => (
						<li
							key={t.status}
							className={cn(
								'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold',
								t.count > 0
									? TONE_CLASSES[t.tone]
									: 'bg-muted text-muted-foreground',
							)}
						>
							{t.label}
							<span className="tabular-nums">{t.count}</span>
						</li>
					))}
				</ul>
				<Button
					variant="outline"
					size="sm"
					onClick={onMarkAllPresent}
					disabled={present === detail.roster.length}
				>
					<CheckCheck className="size-4" />
					{t('allPresent')}
				</Button>
			</div>

			<ul className="mt-4 min-h-0 flex-1 space-y-2.5 overflow-y-auto pb-2">
				{detail.roster.map((s, i) => {
					const status = draft.get(s.studentId) ?? null;
					const tone = status
						? resolveStatus('attendance', status).tone
						: 'slate';
					return (
						<li
							key={s.studentId}
							className={cn(
								'rounded-2xl border border-l-4 border-border bg-card p-3',
								TONE_ACCENT_CLASSES[tone].borderLeft,
							)}
						>
							<div className="mb-2.5 flex items-center gap-3">
								<span className="w-4 shrink-0 text-right text-[11px] font-semibold tabular-nums text-muted-foreground">
									{i + 1}
								</span>
								<Avatar className="size-9">
									<AvatarFallback>
										{initialsFromName(s.studentName)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0 flex-1 truncate font-medium">
									{s.studentName}
								</div>
							</div>
							<StatusToggle
								value={status}
								onChange={(next) => onChangeStatus(s.studentId, next)}
							/>
						</li>
					);
				})}
			</ul>

			<StickyActionBar
				className="-mx-4 shrink-0 rounded-t-2xl md:-mx-6"
				status={`${present} present · ${absent} absent`}
				hint={isDirty ? 'Unsaved changes' : 'Saved'}
				action={
					<Button onClick={onSave} disabled={!isDirty || isSaving}>
						<Check className="size-4" />
						{t('save')}
					</Button>
				}
			/>
		</div>
	);
}
