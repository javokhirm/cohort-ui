import { cn, type StatusTone, TONE_ACCENT_CLASSES } from '@repo/ui';

export interface LegendItem {
	tone: StatusTone;
	label: string;
}

interface ToneLegendProps {
	items: LegendItem[];
	className?: string;
}

/**
 * Decodes the colours a grid uses — the key without which a wall of tinted
 * chips means nothing to a first-time reader. Each entry pairs its dot with a
 * written label, so the legend never leaves colour as the only carrier of
 * meaning (WCAG 1.4.1).
 */
export function ToneLegend({ items, className }: ToneLegendProps) {
	return (
		<ul className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)}>
			{items.map((item) => (
				<li
					key={item.label}
					className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
				>
					<span
						className={cn(
							'size-2 shrink-0 rounded-full',
							TONE_ACCENT_CLASSES[item.tone].dot,
						)}
					/>
					{item.label}
				</li>
			))}
		</ul>
	);
}
