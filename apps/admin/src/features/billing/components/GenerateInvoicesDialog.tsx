import { useState } from 'react';

import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';

import { useBranches } from '@/api/branches';
import { useBillingPolicy } from '../api/billing-policy.queries';
import {
	useGenerateMonthlyInvoices,
	type GenerateMonthlyInvoicesResult,
} from '../api/invoices.mutations';

const ALL_BRANCHES = 'all';

/** The natural period for the tenant's billing mode — current month (PREPAID) or the previous, fully-elapsed month (POSTPAID). */
function naturalPeriod(billingMode: 'PREPAID' | 'POSTPAID' | undefined): {
	year: number;
	month: number;
} {
	const now = new Date();
	if (billingMode === 'POSTPAID') {
		const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		return { year: prev.getFullYear(), month: prev.getMonth() + 1 };
	}
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function toMonthInputValue(year: number, month: number): string {
	return `${year}-${String(month).padStart(2, '0')}`;
}

function formatPeriod(year: number, month: number): string {
	return new Date(year, month - 1, 1).toLocaleDateString('en', {
		month: 'long',
		year: 'numeric',
	});
}

interface GenerateInvoicesDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function GenerateInvoicesDialog({
	open,
	onOpenChange,
}: GenerateInvoicesDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    form/result state resets without a reset effect. */}
				{open && <GenerateInvoicesForm onClose={() => onOpenChange(false)} />}
			</DialogContent>
		</Dialog>
	);
}

function GenerateInvoicesForm({ onClose }: { onClose: () => void }) {
	const { data: policy } = useBillingPolicy();
	const { data: branches = [] } = useBranches();
	const billingMode = policy?.billingMode;
	const isPostpaid = billingMode === 'POSTPAID';

	const defaults = naturalPeriod(billingMode);
	const [period, setPeriod] = useState(
		toMonthInputValue(defaults.year, defaults.month),
	);
	const [branchId, setBranchId] = useState(ALL_BRANCHES);
	const [result, setResult] = useState<GenerateMonthlyInvoicesResult | null>(null);

	const generate = useGenerateMonthlyInvoices();

	const [yearStr, monthStr] = period.split('-');
	const year = Number(yearStr);
	const month = Number(monthStr);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		try {
			const data = await generate.mutateAsync({
				year,
				month,
				branchId: branchId === ALL_BRANCHES ? undefined : Number(branchId),
			});
			setResult(data);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to generate invoices');
		}
	}

	if (result) {
		return (
			<GenerationResult
				result={result}
				onClose={onClose}
				onRunAnother={() => setResult(null)}
			/>
		);
	}

	return (
		<form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
			<DialogHeader>
				<DialogTitle>Generate monthly invoices</DialogTitle>
				<DialogDescription>
					{isPostpaid
						? 'Bills the selected month in arrears, after it has fully elapsed — this single run covers both the time-based monthly leg and the consumption-based per-session leg.'
						: 'Bills the selected month in advance, before it starts.'}
				</DialogDescription>
			</DialogHeader>

			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="generate-period">
						{isPostpaid ? 'Consumed month' : 'Billing month'}
					</Label>
					<Input
						id="generate-period"
						type="month"
						required
						value={period}
						onChange={(e) => setPeriod(e.target.value)}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="generate-branch">Branch</Label>
					<Select value={branchId} onValueChange={setBranchId}>
						<SelectTrigger id="generate-branch">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
							{branches.map((b) => (
								<SelectItem key={b.id} value={String(b.id)}>
									{b.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<p className="text-xs text-muted-foreground">
				{isPostpaid
					? `Generates invoices for enrollments consumed in ${formatPeriod(year, month)}. Existing invoices for the period are left untouched.`
					: `Generates invoices for ${formatPeriod(year, month)}, in advance. Existing invoices for the period are left untouched.`}
			</p>

			<DialogFooter>
				<Button
					type="button"
					variant="outline"
					onClick={onClose}
					disabled={generate.isPending}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={generate.isPending}>
					{generate.isPending && <Spinner className="mr-2 size-4" />}
					Generate invoices
				</Button>
			</DialogFooter>
		</form>
	);
}

function ResultStat({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex flex-col gap-0.5 rounded-lg border border-border p-3">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="text-lg font-semibold tabular-nums">{value}</span>
		</div>
	);
}

function GenerationResult({
	result,
	onClose,
	onRunAnother,
}: {
	result: GenerateMonthlyInvoicesResult;
	onClose: () => void;
	onRunAnother: () => void;
}) {
	return (
		<div className="flex flex-col gap-5">
			<DialogHeader>
				<DialogTitle>
					Invoices generated for{' '}
					{formatPeriod(result.period.year, result.period.month)}
				</DialogTitle>
				<DialogDescription>
					{result.generated} invoice{result.generated === 1 ? '' : 's'} created
					{result.prorated > 0 ? ` (${result.prorated} prorated)` : ''}.
				</DialogDescription>
			</DialogHeader>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<ResultStat label="Generated" value={result.generated} />
				<ResultStat label="Prorated" value={result.prorated} />
				<ResultStat
					label="Skipped — already invoiced"
					value={result.skippedExisting}
				/>
				<ResultStat
					label="Skipped — no fee plan"
					value={result.skippedNoFeePlan}
				/>
				<ResultStat
					label="Skipped — no sessions consumed this period"
					value={result.skippedZeroConsumption}
				/>
				<ResultStat
					label="Skipped — suspended for the full period"
					value={result.skippedSuspended}
				/>
			</div>

			{result.errors.length > 0 && (
				<Alert variant="destructive">
					<AlertTitle>
						{result.errors.length} error
						{result.errors.length === 1 ? '' : 's'} during generation
					</AlertTitle>
					<AlertDescription>
						<ul className="list-disc pl-4">
							{result.errors.map((e, i) => (
								<li key={i}>{e.message}</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onRunAnother}>
					Run another period
				</Button>
				<Button type="button" onClick={onClose}>
					Done
				</Button>
			</DialogFooter>
		</div>
	);
}
