import { Check, SlidersHorizontal } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	cn,
	ProgressBar,
	StickyActionBar,
	TONE_ACCENT_CLASSES,
} from '@repo/ui';

import { initialsFromName } from '@/lib/initials';

import type { MarkConfig, SessionRosterEntry } from '../api/marks.queries';
import {
	isLetterScale,
	normalizedPctFor,
	parseScoreInput,
	scoreTone,
} from '../lib/scale';
import { MarkInput } from './MarkInput';
import { useAppT } from '@/locales';

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

/**
 * The current-day marks sheet: one score/letter editor per rostered student,
 * shaped by the group's active grading scale. Fills its parent as a flex column
 * — the roster scrolls while a docked footer bar saves the whole class in a
 * batch (create-only + update-only, split by the caller).
 *
 * The scale is stated up front with a progress bar for how much of the class is
 * done, and each row's left edge takes the tone of the mark entered, so the
 * weak results stand out without re-reading every field. A LETTER scale needs
 * the full row width for its five options, so its editor drops below the name
 * rather than being squeezed beside it at 375px.
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
	const t = useAppT('marks');
	const tShell = useAppT('shell');
	const isLetter = isLetterScale(config);
	const progress = roster.length > 0 ? (markedCount / roster.length) * 100 : 0;

	const scaleText = isLetter
		? t('scaleLetter')
		: config.type === 'PERCENTAGE'
			? t('scalePercentage', { max: config.maxPoints ?? 100 })
			: t('scalePoints', { max: config.maxPoints ?? '—' });

	/** The band a draft value lands in, for the row's edge tone. */
	const draftPct = (value: string): number | null => {
		if (value.trim() === '') return null;
		return isLetter
			? normalizedPctFor(config, { letter: value })
			: normalizedPctFor(config, { rawScore: parseScoreInput(value) });
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="mt-4 shrink-0 rounded-2xl border border-border bg-card p-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
						<SlidersHorizontal className="size-3.5 text-muted-foreground" />
						{scaleText}
					</span>
					<span className="text-xs font-semibold tabular-nums text-muted-foreground">
						{t('markedProgress', {
							marked: markedCount,
							total: roster.length,
						})}
					</span>
				</div>
				<ProgressBar
					className="mt-2.5"
					value={progress}
					tone={markedCount === roster.length ? 'green' : 'indigo'}
				/>
			</div>

			<ul className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pb-2">
				{roster.map((s, i) => {
					const value = draft.get(s.studentId) ?? '';
					const tone = scoreTone(draftPct(value));
					const editor = (
						<MarkInput
							config={config}
							value={value}
							label={t('markFor', { name: s.studentName })}
							onChange={(next) => onChange(s.studentId, next)}
						/>
					);
					return (
						<li
							key={s.studentId}
							className={cn(
								'rounded-2xl border border-l-4 border-border bg-card p-3',
								TONE_ACCENT_CLASSES[tone].borderLeft,
							)}
						>
							<div
								className={cn(
									'flex items-center gap-3',
									isLetter && 'mb-2.5',
								)}
							>
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
								{!isLetter && editor}
							</div>
							{isLetter && editor}
						</li>
					);
				})}
			</ul>

			<StickyActionBar
				className="-mx-4 shrink-0 rounded-t-2xl md:-mx-6"
				status={t('markedProgress', {
					marked: markedCount,
					total: roster.length,
				})}
				hint={isDirty ? tShell('unsavedChanges') : tShell('savedState')}
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
