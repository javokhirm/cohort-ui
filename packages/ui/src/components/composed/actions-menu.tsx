import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Button } from '@repo/ui/components/button';

export interface ActionsMenuAction {
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	onClick?: () => void;
	/** `destructive` renders the item in red (e.g. a delete action). */
	variant?: 'default' | 'destructive';
	disabled?: boolean;
	/** Drop the action entirely, e.g. behind a permission check. */
	hidden?: boolean;
}

export type ActionsMenuItem = ActionsMenuAction | 'separator';

export interface ActionsMenuProps {
	items: ActionsMenuItem[];
	/** Accessible label for the "..." trigger button. */
	label: string;
	align?: 'start' | 'center' | 'end';
	disabled?: boolean;
	className?: string;
}

/**
 * The "..." actions menu used to collapse a row of header/row buttons (edit,
 * message, delete, …) into one trigger, so the layout stays compact regardless
 * of how many actions a permission set unlocks.
 */
function ActionsMenu({
	items,
	label,
	align = 'end',
	disabled,
	className,
}: ActionsMenuProps) {
	const visible = items.filter((item) => item === 'separator' || !item.hidden);
	// Drop a leading/trailing/duplicate separator left behind once hidden items
	// are filtered out — an edge separator or double rule reads as a layout bug.
	const cleaned = visible.filter(
		(item, i) =>
			item !== 'separator' ||
			(i > 0 && i < visible.length - 1 && visible[i - 1] !== 'separator'),
	);

	if (cleaned.length === 0) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					disabled={disabled}
					aria-label={label}
					className={className}
				>
					<MoreHorizontal className="size-6" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align={align}>
				{cleaned.map((item, i) =>
					item === 'separator' ? (
						<DropdownMenuSeparator key={`separator-${i}`} />
					) : (
						<DropdownMenuItem
							key={item.label}
							variant={item.variant}
							disabled={item.disabled}
							onClick={item.onClick}
						>
							{item.icon && <item.icon className="size-4" />}
							{item.label}
						</DropdownMenuItem>
					),
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { ActionsMenu };
