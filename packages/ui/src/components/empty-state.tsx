import * as React from 'react';

import { cn } from '../lib/utils';

interface EmptyStateProps extends Omit<React.ComponentProps<'div'>, 'title'> {
	/** Leading icon, typically a lucide icon element. */
	icon?: React.ReactNode;
	title: React.ReactNode;
	description?: React.ReactNode;
	/** Optional call-to-action (e.g. a "Add student" button). */
	action?: React.ReactNode;
}

/**
 * Centered empty / zero-state placeholder used by lists, tables, and panels
 * when there is no data or no search match.
 */
function EmptyState({
	className,
	icon,
	title,
	description,
	action,
	...props
}: EmptyStateProps) {
	return (
		<div
			data-slot="empty-state"
			className={cn(
				'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
				className,
			)}
			{...props}
		>
			{icon && (
				<span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground [&>svg]:size-6">
					{icon}
				</span>
			)}
			<div className="flex flex-col gap-1">
				<p className="font-semibold text-foreground">{title}</p>
				{description && (
					<p className="max-w-sm text-sm text-muted-foreground">
						{description}
					</p>
				)}
			</div>
			{action && <div className="mt-1">{action}</div>}
		</div>
	);
}

export { EmptyState };
export type { EmptyStateProps };
