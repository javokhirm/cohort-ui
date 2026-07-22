import { useState } from 'react';
import { MoreHorizontal, Pencil, RefreshCw, Trash2 } from 'lucide-react';

import {
	Button,
	Card,
	CardContent,
	ConfirmDialog,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Skeleton,
	StatusBadge,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatDate, formatMoney, todayIsoDate } from '@repo/utils';

import { Can } from '@/components/Can';
import { usePayrollConfigs } from '@/features/payroll/api/payroll-configs.queries';
import { useDeletePayrollConfig } from '@/features/payroll/api/payroll-configs.mutations';
import type { PayrollConfigResponse } from '@/features/payroll/api/payroll-configs.queries';

import { PayrollConfigSheet } from './PayrollConfigSheet';

function configValueLabel(config: PayrollConfigResponse): string {
	return config.payrollType === 'PERCENT'
		? `${config.payrollPercent ?? 0}% of student fees`
		: formatMoney(config.baseSalary ?? 0);
}

/** The window that applies today: started, and not yet closed. */
function findCurrentConfig(
	configs: PayrollConfigResponse[],
): PayrollConfigResponse | undefined {
	const today = todayIsoDate();
	return configs
		.filter(
			(c) =>
				c.effectiveFrom <= today &&
				(c.effectiveTo === null || c.effectiveTo >= today),
		)
		.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

/** The last window on the timeline — the only one the API lets you delete. */
function findNewestConfig(
	configs: PayrollConfigResponse[],
): PayrollConfigResponse | undefined {
	return [...configs].sort(
		(a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.id - a.id,
	)[0];
}

function ConfigActions({
	config,
	isNewest,
	onEdit,
	onDelete,
	onChangePayModel,
}: {
	config: PayrollConfigResponse;
	isNewest: boolean;
	onEdit: (config: PayrollConfigResponse) => void;
	onDelete: (config: PayrollConfigResponse) => void;
	onChangePayModel?: () => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="size-8 shrink-0 p-0"
					// Several of these sit on one card — name the window so they
					// stay distinguishable to a screen reader.
					aria-label={`Actions for the pay window from ${formatDate(config.effectiveFrom)}`}
				>
					<MoreHorizontal className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => onEdit(config)}>
					<Pencil className="size-4" />
					Edit
				</DropdownMenuItem>
				{/* Only offered on the current window — it opens a new window
				    starting today, so it doesn't make sense on a past one. */}
				{onChangePayModel && (
					<DropdownMenuItem onClick={onChangePayModel}>
						<RefreshCw className="size-4" />
						Change pay model
					</DropdownMenuItem>
				)}
				{/* Only the newest window is removable — deleting a middle one would
				    tear a hole in the priced timeline, and the API 409s. */}
				{isNewest && (
					<DropdownMenuItem
						variant="destructive"
						onClick={() => onDelete(config)}
					>
						<Trash2 className="size-4" />
						Delete
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * The staff member's pay model — current window, past windows, and the
 * `payroll.manage`-gated actions. Pay lives on a dated config timeline, so
 * historic payroll never changes retroactively: "Change pay model" opens a new
 * window, while edit/delete correct a window that no finalized payroll has
 * priced yet (the API is the judge — it 409s otherwise).
 */
export function PayrollConfigCard({ staffId }: { staffId: number }) {
	const { data: configs, isLoading, isError } = usePayrollConfigs(staffId);
	const [changeOpen, setChangeOpen] = useState(false);
	const [editingConfig, setEditingConfig] = useState<PayrollConfigResponse | null>(
		null,
	);
	const [deletingConfig, setDeletingConfig] = useState<PayrollConfigResponse | null>(
		null,
	);

	const deleteMutation = useDeletePayrollConfig(staffId);

	const current = configs ? findCurrentConfig(configs) : undefined;
	const newest = configs ? findNewestConfig(configs) : undefined;
	const history = (configs ?? []).filter((c) => c.id !== current?.id);
	// Delete is only offered on the newest window, so anything else on the
	// timeline is necessarily its predecessor and will reopen in its place.
	const hasPredecessor = (configs?.length ?? 0) > 1;

	function handleDeleteConfirm() {
		if (!deletingConfig) return;
		deleteMutation.mutate(deletingConfig.id, {
			onSuccess: () => {
				toast.success('Pay window deleted');
				setDeletingConfig(null);
			},
			onError: (err) => {
				toast.error(
					isApiError(err) ? err.message : 'Failed to delete the pay window',
				);
				setDeletingConfig(null);
			},
		});
	}

	return (
		<Card>
			<CardContent className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<p className="font-semibold">Pay model</p>
					{/* Actions for the current window live here, beside the title.
					    With no window yet there is nothing to act on, so the header
					    falls back to the one action that applies: opening the first. */}
					{!isLoading && !isError && (
						<Can permission="payroll.manage">
							{current ? (
								<ConfigActions
									config={current}
									isNewest={current.id === newest?.id}
									onEdit={setEditingConfig}
									onDelete={setDeletingConfig}
									onChangePayModel={() => setChangeOpen(true)}
								/>
							) : (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setChangeOpen(true)}
								>
									<Pencil className="mr-1.5 size-3.5" />
									Change pay model
								</Button>
							)}
						</Can>
					)}
				</div>

				{isLoading ? (
					<Skeleton className="h-16 rounded-lg" />
				) : isError ? (
					<p className="py-4 text-sm text-muted-foreground">
						Failed to load the pay configuration.
					</p>
				) : !current ? (
					<p className="py-4 text-sm text-muted-foreground">
						No pay configured — this member is excluded from payroll.
					</p>
				) : (
					<div className="flex flex-col gap-1.5">
						<StatusBadge kind="payroll_rate" status={current.payrollType} />
						<p className="text-xl font-bold tabular-nums">
							{configValueLabel(current)}
						</p>
						<p className="text-xs text-muted-foreground">
							since {formatDate(current.effectiveFrom)}
						</p>
					</div>
				)}

				{history.length > 0 && (
					<div className="border-t border-border pt-3">
						<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							History
						</p>
						<div className="flex flex-col gap-2">
							{history.map((config) => (
								<div
									key={config.id}
									className="flex items-center justify-between gap-2 text-sm"
								>
									<span className="text-muted-foreground">
										{configValueLabel(config)}
									</span>
									<div className="flex items-center gap-1">
										<span className="shrink-0 text-xs text-muted-foreground">
											{formatDate(config.effectiveFrom)} –{' '}
											{config.effectiveTo
												? formatDate(config.effectiveTo)
												: 'now'}
										</span>
										<Can permission="payroll.manage">
											<ConfigActions
												config={config}
												isNewest={config.id === newest?.id}
												onEdit={setEditingConfig}
												onDelete={setDeletingConfig}
											/>
										</Can>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>

			<PayrollConfigSheet
				mode="create"
				staffId={staffId}
				open={changeOpen}
				onOpenChange={setChangeOpen}
			/>
			{editingConfig && (
				<PayrollConfigSheet
					mode="edit"
					config={editingConfig}
					open={editingConfig !== null}
					onOpenChange={(open) => {
						if (!open) setEditingConfig(null);
					}}
				/>
			)}
			<ConfirmDialog
				open={deletingConfig !== null}
				onOpenChange={(open) => {
					if (!open) setDeletingConfig(null);
				}}
				title="Delete this pay window?"
				description={
					hasPredecessor
						? 'The previous pay window reopens and prices every day from here on. Finalized payroll is unaffected.'
						: 'This member will have no pay model and will be excluded from payroll until you add one.'
				}
				confirmLabel="Delete window"
				variant="destructive"
				loading={deleteMutation.isPending}
				onConfirm={handleDeleteConfirm}
			/>
		</Card>
	);
}
