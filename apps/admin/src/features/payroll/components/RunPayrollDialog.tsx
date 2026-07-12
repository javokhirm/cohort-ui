import { useState } from 'react';

import {
	Button,
	DatePicker,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	Spinner,
	Switch,
	toast,
} from '@repo/ui';
import { toIsoDate } from '@repo/utils';

import { useRunPayroll } from '../api/payroll.mutations';

/** Current month [start, end] as YYYY-MM-DD, computed at call time (never module scope). */
function currentMonthRange(): { start: string; end: string } {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	return { start: toIsoDate(start), end: toIsoDate(end) };
}

interface RunPayrollDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function RunPayrollDialog({ open, onOpenChange }: RunPayrollDialogProps) {
	const defaults = currentMonthRange();
	const [periodStart, setPeriodStart] = useState(defaults.start);
	const [periodEnd, setPeriodEnd] = useState(defaults.end);
	const [autoCalculate, setAutoCalculate] = useState(true);

	const runPayroll = useRunPayroll();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		runPayroll.mutate(
			{ periodStart, periodEnd, autoCalculate },
			{
				onSuccess: (result) => {
					toast.success(
						`Payroll run created — ${result.created} draft record(s)`,
					);
					onOpenChange(false);
				},
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<form onSubmit={handleSubmit} className="flex flex-col gap-5">
					<DialogHeader>
						<DialogTitle>Run payroll</DialogTitle>
						<DialogDescription>
							This generates draft payroll records for active staff.
						</DialogDescription>
					</DialogHeader>

					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="period-start">Period start</Label>
							<DatePicker
								id="period-start"
								value={periodStart}
								onChange={(value) => setPeriodStart(value ?? '')}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="period-end">Period end</Label>
							<DatePicker
								id="period-end"
								value={periodEnd}
								onChange={(value) => setPeriodEnd(value ?? '')}
							/>
						</div>
					</div>

					<div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
						<div className="flex flex-col gap-0.5">
							<Label htmlFor="auto-calc" className="text-sm font-medium">
								Auto-calculate
							</Label>
							<p className="text-xs text-muted-foreground">
								From sessions taught × rate + bonuses
							</p>
						</div>
						<Switch
							id="auto-calc"
							checked={autoCalculate}
							onCheckedChange={setAutoCalculate}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={runPayroll.isPending || !periodStart || !periodEnd}
						>
							{runPayroll.isPending && <Spinner className="mr-2 size-4" />}
							Run payroll
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
