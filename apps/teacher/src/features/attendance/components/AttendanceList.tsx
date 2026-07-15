import { Check } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	Label,
	StickyActionBar,
	Textarea,
} from '@repo/ui';

import type { AttendanceStatus, SessionDetail } from '../api/attendance.queries';
import { StatusToggle } from './StatusToggle';

interface AttendanceListProps {
	detail: SessionDetail;
	/** Draft status per studentId (the editable form state). */
	draft: Map<number, AttendanceStatus>;
	topic: string;
	isSaving: boolean;
	isDirty: boolean;
	onChangeStatus: (studentId: number, status: AttendanceStatus) => void;
	onTopicChange: (topic: string) => void;
	onSave: () => void;
}

/** "First Last" → "FL"; a single-word name → its first letter. */
function initials(name: string): string {
	const parts = name.trim().split(/\s+/);
	const two = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
	return two.toUpperCase() || '?';
}

/**
 * The current-day attendance sheet: a live present/absent summary with an
 * "All present" shortcut, a topic note, and one Present/Absent/Late/Excused
 * selector per rostered student. Fills its parent as a flex column — the roster
 * scrolls while a docked footer bar saves the whole class in a batch.
 */
export function AttendanceList({
	detail,
	draft,
	topic,
	isSaving,
	isDirty,
	onChangeStatus,
	onTopicChange,
	onSave,
}: AttendanceListProps) {
	const present = detail.roster.filter(
		(s) => draft.get(s.studentId) === 'PRESENT',
	).length;
	const absent = detail.roster.filter(
		(s) => draft.get(s.studentId) === 'ABSENT',
	).length;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="mt-4 shrink-0">
				<Label
					htmlFor="attendance-topic"
					className="mb-1.5 block text-muted-foreground"
				>
					Topic covered / session note
				</Label>
				<Textarea
					id="attendance-topic"
					value={topic}
					onChange={(e) => onTopicChange(e.target.value)}
					placeholder="What did you cover today?"
					rows={2}
				/>
			</div>

			<div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
				{detail.roster.map((s) => (
					<div
						key={s.studentId}
						className="rounded-2xl border border-border bg-card p-3"
					>
						<div className="mb-3 flex items-center gap-3">
							<Avatar className="size-9">
								<AvatarFallback>{initials(s.studentName)}</AvatarFallback>
							</Avatar>
							<div className="min-w-0 truncate font-medium">
								{s.studentName}
							</div>
						</div>
						<StatusToggle
							value={draft.get(s.studentId) ?? null}
							onChange={(status) => onChangeStatus(s.studentId, status)}
						/>
					</div>
				))}
			</div>

			<StickyActionBar
				className="-mx-4 shrink-0 rounded-t-2xl md:-mx-6"
				status={`${present} present · ${absent} absent`}
				hint={isDirty ? 'Unsaved changes' : 'Saved'}
				action={
					<Button onClick={onSave} disabled={!isDirty || isSaving}>
						<Check className="size-4" />
						Save attendance
					</Button>
				}
			/>
		</div>
	);
}
