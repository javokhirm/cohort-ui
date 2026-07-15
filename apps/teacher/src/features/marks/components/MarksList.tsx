import { Check } from 'lucide-react';

import { Avatar, AvatarFallback, Button, StickyActionBar } from '@repo/ui';

import type { MarkConfig, SessionRosterEntry } from '../api/marks.queries';
import { scaleLabel } from '../lib/scale';
import { MarkInput } from './MarkInput';

interface MarksListProps {
	roster: SessionRosterEntry[];
	config: MarkConfig;
	/** Draft value per studentId (numeric score / letter / "" as a string). */
	draft: Map<number, string>;
	markedCount: number;
	isSaving: boolean;
	isDirty: boolean;
	onChange: (studentId: number, value: string) => void;
	onSave: () => void;
}

/** "First Last" → "FL"; a single-word name → its first letter. */
function initials(name: string): string {
	const parts = name.trim().split(/\s+/);
	const two = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
	return two.toUpperCase() || '?';
}

/**
 * The current-day marks sheet: one score/letter editor per rostered student,
 * shaped by the group's active grading scale. Fills its parent as a flex column
 * — the roster scrolls while a docked footer bar saves the whole class in a
 * batch (create-only + update-only, split by the caller).
 */
export function MarksList({
	roster,
	config,
	draft,
	markedCount,
	isSaving,
	isDirty,
	onChange,
	onSave,
}: MarksListProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="mt-4 shrink-0 text-sm text-muted-foreground">
				{scaleLabel(config)}
			</div>

			<div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
				{roster.map((s) => (
					<div
						key={s.studentId}
						className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
					>
						<Avatar className="size-9">
							<AvatarFallback>{initials(s.studentName)}</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1 truncate font-medium">
							{s.studentName}
						</div>
						<MarkInput
							config={config}
							value={draft.get(s.studentId) ?? ''}
							onChange={(value) => onChange(s.studentId, value)}
						/>
					</div>
				))}
			</div>

			<StickyActionBar
				className="-mx-4 shrink-0 rounded-t-2xl md:-mx-6"
				status={`${markedCount} of ${roster.length} marked`}
				hint={isDirty ? 'Unsaved changes' : 'Saved'}
				action={
					<Button onClick={onSave} disabled={!isDirty || isSaving}>
						<Check className="size-4" />
						Save marks
					</Button>
				}
			/>
		</div>
	);
}
