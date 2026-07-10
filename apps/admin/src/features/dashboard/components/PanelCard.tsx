import type { ReactNode } from 'react';

import { Card } from '@repo/ui';

/**
 * The shared frame for every dashboard panel (charts + lists): a titled card
 * with an optional subtitle and a right-aligned header slot (a "View all" link
 * or a headline figure). Body padding is opt-out via `flush` for lists that
 * render their own full-width rows.
 */
export function PanelCard({
	title,
	subtitle,
	headerRight,
	flush = false,
	children,
}: {
	title: string;
	subtitle?: string;
	headerRight?: ReactNode;
	flush?: boolean;
	children: ReactNode;
}) {
	return (
		<Card className="gap-0 py-0">
			<div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
				<div>
					<h2 className="text-sm font-semibold">{title}</h2>
					{subtitle && (
						<p className="text-xs text-muted-foreground">{subtitle}</p>
					)}
				</div>
				{headerRight}
			</div>
			<div className={flush ? 'px-0 py-0' : 'px-5 py-4'}>{children}</div>
		</Card>
	);
}
