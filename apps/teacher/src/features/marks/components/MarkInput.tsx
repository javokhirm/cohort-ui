import { Button, cn, Input, TONE_CLASSES } from '@repo/ui';

import { LETTER_GRADES, type MarkConfig } from '../api/marks.queries';
import { normalizedPctFor, scoreTone } from '../lib/scale';

interface MarkInputProps {
	config: MarkConfig;
	/** The draft value as a string: a numeric score, a letter, or "" (unmarked). */
	value: string;
	onChange: (value: string) => void;
	/** Accessible name — the control carries no visible label of its own. */
	label?: string;
	className?: string;
}

/**
 * A controlled mark editor whose shape follows the active grading scale: a
 * bounded numeric field for POINTS/PERCENTAGE (with `.5` steps when the scale
 * allows half-points), or an A–F segmented control for LETTER, each letter
 * filled with its band's tone once picked. The server validates
 * authoritatively; this only shapes the input.
 */
export function MarkInput({ config, value, onChange, label, className }: MarkInputProps) {
	if (config.type === 'LETTER') {
		return (
			<div
				role="group"
				aria-label={label}
				className={cn(
					'grid grid-cols-5 gap-1 rounded-xl border border-border bg-muted p-1',
					className,
				)}
			>
				{LETTER_GRADES.map((letter) => {
					const active = value === letter;
					const tone = scoreTone(normalizedPctFor(config, { letter }));
					return (
						<Button
							key={letter}
							type="button"
							variant="ghost"
							size="sm"
							aria-pressed={active}
							onClick={() => onChange(active ? '' : letter)}
							className={cn(
								'h-8 justify-center rounded-lg px-1 text-xs font-bold',
								active
									? cn(TONE_CLASSES[tone], 'shadow-sm')
									: 'text-muted-foreground hover:bg-card hover:text-foreground',
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
		<div className={cn('flex shrink-0 items-center gap-1.5', className)}>
			<Input
				type="number"
				inputMode="decimal"
				aria-label={label}
				min={0}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="—"
				className="w-20 text-center font-semibold tabular-nums"
			/>
			<span className="text-xs font-medium whitespace-nowrap text-muted-foreground">
				/ {config.maxPoints ?? '—'}
				{config.type === 'PERCENTAGE' ? '%' : ''}
			</span>
		</div>
	);
}
