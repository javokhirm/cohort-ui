import { Button, cn, Input, type StatusTone, TONE_CLASSES } from '@repo/ui';

import { LETTER_GRADES, type MarkConfig } from '../api/marks.queries';
import { normalizedPctFor, scoreTone } from '../lib/scale';

interface MarkInputProps {
	config: MarkConfig;
	/** The draft value as a string: a numeric score, a letter, or "" (unmarked). */
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

/**
 * A controlled mark editor whose shape follows the active grading scale: a
 * bounded numeric field for POINTS/PERCENTAGE (with `.5` steps when the scale
 * allows half-points), or an A–F selector for LETTER (each letter tinted by its
 * band). The server validates authoritatively; this only shapes the input.
 */
export function MarkInput({ config, value, onChange, className }: MarkInputProps) {
	if (config.type === 'LETTER') {
		return (
			<div className={cn('grid grid-cols-5 gap-2', className)}>
				{LETTER_GRADES.map((letter) => {
					const active = value === letter;
					const tone = scoreTone(normalizedPctFor(config, { letter }));
					return (
						<Button
							key={letter}
							type="button"
							variant="outline"
							size="sm"
							aria-pressed={active}
							onClick={() => onChange(active ? '' : letter)}
							className={cn(
								'justify-center font-semibold',
								active &&
									cn(
										TONE_CLASSES[tone as StatusTone],
										'border-transparent',
									),
							)}
						>
							{letter}
						</Button>
					);
				})}
			</div>
		);
	}

	const max = config.maxPoints ?? undefined;
	const step = config.type === 'POINTS' && config.allowHalf ? 0.5 : 1;
	return (
		<div className={cn('flex items-center gap-2', className)}>
			<Input
				type="number"
				inputMode="decimal"
				min={0}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="—"
				className="w-24 text-center tabular-nums"
			/>
			<span className="text-sm text-muted-foreground">
				/ {config.maxPoints ?? '—'}
				{config.type === 'PERCENTAGE' ? '%' : ''}
			</span>
		</div>
	);
}
