import * as React from 'react';

import { cn } from '../lib/utils';

interface PageHeaderProps extends Omit<React.ComponentProps<'div'>, 'title'> {
	title: React.ReactNode;
	description?: React.ReactNode;
	/** Right-aligned actions (buttons, menus). */
	actions?: React.ReactNode;
}

/**
 * Standard screen header — title + optional subtitle on the left, actions on
 * the right. Matches the page-header pattern used across every surface.
 */
function PageHeader({
	className,
	title,
	description,
	actions,
	...props
}: PageHeaderProps) {
	return (
		<div
			data-slot="page-header"
			className={cn(
				'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
				className,
			)}
			{...props}
		>
			<div className="flex flex-col gap-1">
				<h1 className="text-xl font-bold tracking-tight text-foreground">
					{title}
				</h1>
				{description && (
					<p className="text-sm text-muted-foreground">{description}</p>
				)}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}

export { PageHeader };
export type { PageHeaderProps };
