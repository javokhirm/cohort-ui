import { cn } from '@repo/ui';

import type { StudentMark } from '../api/marks.queries';
import {
	MARK_TONE_CLASS,
	markTone,
	markValueLabel,
	scaleUnitLabel,
} from '../lib/mark-format';
import { useAppT } from '@/locales';

interface MarkChipProps {
	mark: StudentMark;
	/** `lg` is the session sheet's hero chip; `md` is the log row's. */
	size?: 'md' | 'lg';
	className?: string;
}

/**
 * A daily mark in its own scale, with the unit caption underneath — the design's
 * `8/10 · 0–10`, `B · A–F`, `88% · %`. The value is always shown as the teacher
 * entered it; only the colour is derived from `normalizedPct`, so marks from
 * different scales still read as comparably good or bad.
 */
export function MarkChip({ mark, size = 'md', className }: MarkChipProps) {
	const t = useAppT('progress');
	const tone = MARK_TONE_CLASS[markTone(mark.normalizedPct)];

	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center rounded-[11px] px-2.5 py-1.5',
				tone.bg,
				size === 'lg' ? 'min-w-18' : 'min-w-13.5',
				className,
			)}
		>
			<span
				className={cn(
					'font-extrabold leading-tight tabular-nums',
					tone.fg,
					size === 'lg' ? 'text-2xl' : 'text-[15px]',
				)}
			>
				{markValueLabel(mark.scale, mark.rawScore, mark.letter)}
			</span>
			<span className={cn('text-[9px] font-semibold opacity-70', tone.fg)}>
				{scaleUnitLabel(mark.scale, t)}
			</span>
		</div>
	);
}
