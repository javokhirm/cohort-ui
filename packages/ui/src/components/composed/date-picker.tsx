import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import type { Matcher } from 'react-day-picker';

import { cn } from '../../lib/utils';
import { Button } from '../button';
import { Calendar } from '../calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

export interface DatePickerProps {
	/** Selected date as an ISO calendar date ("YYYY-MM-DD"), or undefined when empty. */
	value?: string;
	onChange?: (value: string | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	id?: string;
	/** Earliest selectable date, as an ISO calendar date. */
	minDate?: string;
	/** Latest selectable date, as an ISO calendar date. */
	maxDate?: string;
}

/**
 * Parses/formats using local Y-M-D components only (no timezone conversion) — a
 * date-only field represents a calendar day, not an instant, so the value must stay
 * identical regardless of the viewer's browser timezone.
 */
function parseIsoDate(iso: string | undefined): Date | undefined {
	const match = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
	if (!match || !match[1] || !match[2] || !match[3]) return undefined;
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toIsoDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
	return date.toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
}

function DatePicker({
	value,
	onChange,
	placeholder = 'Select date',
	disabled,
	className,
	id,
	minDate,
	maxDate,
}: DatePickerProps) {
	const [open, setOpen] = React.useState(false);
	const selected = parseIsoDate(value);

	const disabledMatchers: Matcher[] = [];
	const minDateValue = parseIsoDate(minDate);
	const maxDateValue = parseIsoDate(maxDate);
	if (minDateValue) disabledMatchers.push({ before: minDateValue });
	if (maxDateValue) disabledMatchers.push({ after: maxDateValue });

	const currentYear = new Date().getFullYear();

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					id={id}
					disabled={disabled}
					className={cn(
						'w-full justify-between font-normal',
						!selected && 'text-muted-foreground',
						className,
					)}
				>
					<span className="truncate">
						{selected ? formatDisplayDate(selected) : placeholder}
					</span>
					<CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto overflow-hidden p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					captionLayout="dropdown"
					startMonth={new Date(currentYear - 100, 0)}
					endMonth={new Date(currentYear + 10, 11)}
					disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
					onSelect={(date) => {
						onChange?.(date ? toIsoDate(date) : undefined);
						setOpen(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}

export { DatePicker, parseIsoDate, toIsoDate };
