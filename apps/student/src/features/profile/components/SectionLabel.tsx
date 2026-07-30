import { cn } from '@repo/ui';

interface SectionLabelProps {
	children: string;
	className?: string;
}

/** The small uppercase caption above each of the Profile screen's cards. */
export function SectionLabel({ children, className }: SectionLabelProps) {
	return (
		<p
			className={cn(
				'mb-2.25 px-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground',
				className,
			)}
		>
			{children}
		</p>
	);
}
