import { cn } from '@repo/ui';

interface FormSectionProps {
	title?: string;
	actions?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

/** A white section block with an optional uppercase eyebrow heading, matching the design. */
export function FormSection({ title, actions, children, className }: FormSectionProps) {
	return (
		<div className={cn('flex flex-col gap-4 rounded-xl bg-white p-4', className)}>
			{(title || actions) && (
				<div className="flex items-center justify-between">
					{title && (
						<span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
							{title}
						</span>
					)}
					{actions}
				</div>
			)}
			{children}
		</div>
	);
}
