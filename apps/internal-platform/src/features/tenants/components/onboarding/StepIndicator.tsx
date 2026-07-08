import { Check } from 'lucide-react';

import { cn } from '@repo/ui';

import { STEP_LABELS } from './types';
import type { OnboardStep } from './types';

export function StepIndicator({ current }: { current: OnboardStep }) {
	return (
		<div className="flex w-full items-start">
			{STEP_LABELS.flatMap((label, i) => {
				const n = (i + 1) as OnboardStep;
				const done = n < current;
				const active = n === current;

				const circle = (
					<div key={`step-${n}`} className="flex flex-col items-center gap-1.5">
						<div
							className={cn(
								'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
								done && 'bg-primary text-primary-foreground',
								active && 'border-2 border-primary text-primary',
								!done &&
									!active &&
									'border-2 border-border text-muted-foreground',
							)}
						>
							{done ? <Check className="size-4" strokeWidth={2.5} /> : n}
						</div>
						<span
							className={cn(
								'hidden text-xs font-medium sm:block',
								active || done
									? 'text-foreground'
									: 'text-muted-foreground',
							)}
						>
							{label}
						</span>
					</div>
				);

				if (i === 0) return [circle];

				return [
					<div
						key={`connector-${i}`}
						className={cn(
							'mt-4 h-px flex-1',
							n <= current ? 'bg-primary' : 'bg-border',
						)}
					/>,
					circle,
				];
			})}
		</div>
	);
}
