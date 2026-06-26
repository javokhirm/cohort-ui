import * as React from 'react';

import { cn } from '../lib/utils';
import {
	resolveStatus,
	TONE_CLASSES,
	type StatusKind,
	type StatusTone,
} from '../lib/status';

const statusBadgeBase =
	'inline-flex items-center justify-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none';

interface StatusBadgeProps extends React.ComponentProps<'span'> {
	/** Domain whose status map to use (e.g. `invoice`, `payment`, `session`). */
	kind?: StatusKind;
	/** The raw backend status value; resolved to a tone + label via `kind`. */
	status?: string;
	/** Override the tone directly instead of resolving from `kind`/`status`. */
	tone?: StatusTone;
}

/**
 * The shared status pill. Drive it from a domain status:
 *   `<StatusBadge kind="invoice" status="overdue" />`
 * or set a tone + label explicitly:
 *   `<StatusBadge tone="green">Live</StatusBadge>`.
 * Unknown statuses fall back to a neutral slate pill with a title-cased label.
 */
function StatusBadge({
	className,
	kind,
	status,
	tone,
	children,
	...props
}: StatusBadgeProps) {
	const descriptor =
		kind && status !== undefined ? resolveStatus(kind, status) : undefined;
	const resolvedTone: StatusTone = tone ?? descriptor?.tone ?? 'slate';
	const label = children ?? descriptor?.label ?? status ?? null;

	return (
		<span
			data-slot="status-badge"
			data-tone={resolvedTone}
			className={cn(statusBadgeBase, TONE_CLASSES[resolvedTone], className)}
			{...props}
		>
			{label}
		</span>
	);
}

export { StatusBadge };
export type { StatusBadgeProps };
