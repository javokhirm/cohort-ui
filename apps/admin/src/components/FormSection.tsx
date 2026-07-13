import { cn } from '@repo/ui';

interface FormSectionProps {
	title?: string;
	children: React.ReactNode;
	className?: string;
}

/** A white section block with an optional uppercase eyebrow heading, matching the design. */
export function FormSection({ title, children, className }: FormSectionProps) {
	return (
		<div className={cn('flex flex-col gap-4 rounded-xl bg-white p-4', className)}>
			{title && (
				<span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
					{title}
				</span>
			)}
			{children}
		</div>
	);
}
