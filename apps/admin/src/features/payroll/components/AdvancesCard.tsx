import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';

import {
	Button,
	Card,
	ConfirmDialog,
	Form,
	FormDatePicker,
	FormInput,
	FormMoneyInput,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatDate, formatMoney, todayIsoDate } from '@repo/utils';

import { Can } from '@/components/Can';
import { usePermissions } from '@/features/auth/hooks';

import { useCreateAdvance, useRemoveAdvance } from '../api/payroll.mutations';
import type { PayrollAdvance, PayrollStaffPeriodResponse } from '../api/payroll.queries';
import {
	advanceFormSchema,
	type AdvanceFormValues,
} from '../schemas/advance-form.schema';
import { useAppT } from '@/locales';

type PayrollT = ReturnType<typeof useAppT<'payroll'>>;

/** Backend error codes worth translating for the operator. */
function advanceErrorMessage(t: PayrollT, err: unknown, fallback: string): string {
	if (!isApiError(err)) return fallback;
	switch (err.code) {
		case 'PAYROLL_PERIOD_FINALIZED':
			return t('advance.errorFinalized');
		case 'ADVANCE_LINKED':
			return t('advance.errorLinked');
		case 'PAYROLL_MONTH_IN_FUTURE':
			return t('advance.errorFutureMonth');
		default:
			return err.message || fallback;
	}
}

function AddAdvanceForm({ period }: { period: PayrollStaffPeriodResponse }) {
	const t = useAppT('payroll');
	const createAdvance = useCreateAdvance();
	const form = useForm<AdvanceFormValues>({
		resolver: zodResolver(advanceFormSchema),
		defaultValues: { label: '', amount: undefined, advanceDate: todayIsoDate() },
	});

	async function onSubmit(values: AdvanceFormValues) {
		try {
			await createAdvance.mutateAsync({
				staffId: period.staffId,
				branchId: period.branchId,
				amount: values.amount,
				label: values.label?.trim() || undefined,
				advanceDate: values.advanceDate,
			});
			toast.success(t('advance.recorded'));
			form.reset({ label: '', amount: undefined, advanceDate: todayIsoDate() });
		} catch (err) {
			toast.error(advanceErrorMessage(t, err, t('advance.recordFailed')));
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-2.5 border-b border-border px-5 py-3.5"
			>
				<FormInput
					control={form.control}
					name="label"
					placeholder={t('advance.reasonPlaceholder')}
				/>
				<div className="flex items-start gap-2">
					<div className="flex-1">
						<FormMoneyInput
							control={form.control}
							name="amount"
							placeholder={t('advance.amountPlaceholder')}
						/>
					</div>
					<FormDatePicker
						control={form.control}
						name="advanceDate"
						className="w-36"
					/>
					<Button type="submit" disabled={createAdvance.isPending}>
						<Plus className="mr-1 size-4" />
						{t('record')}
					</Button>
				</div>
			</form>
		</Form>
	);
}

/**
 * Mid-month advances — salary drawn before the run, remembered and deducted
 * from net. Recording and removing are `payroll.manage` actions and possible
 * only while the row is LIVE; a finalized snapshot locks its advances.
 */
export function AdvancesCard({ period }: { period: PayrollStaffPeriodResponse }) {
	const t = useAppT('payroll');
	const { can } = usePermissions();
	const removeAdvance = useRemoveAdvance();
	const [advanceToRemove, setAdvanceToRemove] = useState<PayrollAdvance | null>(null);

	const isLive = period.status === 'LIVE';
	const canManage = can('payroll.manage');

	function handleRemoveConfirm() {
		if (!advanceToRemove) return;
		removeAdvance.mutate(advanceToRemove.id, {
			onSuccess: () => {
				toast.success(t('advance.removed'));
				setAdvanceToRemove(null);
			},
			onError: (err) => {
				toast.error(advanceErrorMessage(t, err, t('advance.removeFailed')));
			},
		});
	}

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="border-b border-border px-5 py-3.5">
				<h2 className="text-sm font-bold">{t('advance.title')}</h2>
				<p className="mt-0.5 text-xs text-muted-foreground">
					{t('advance.subtitle')}
				</p>
			</div>

			{period.advances.length === 0 ? (
				<p className="border-b border-border px-5 py-4 text-sm text-muted-foreground">
					{t('advance.empty')}
				</p>
			) : (
				period.advances.map((advance) => (
					<div
						key={advance.id}
						className="flex items-center justify-between gap-3 border-b border-border px-5 py-3"
					>
						<div className="min-w-0">
							<div className="truncate text-sm font-medium text-tone-red-fg">
								{advance.label ?? t('advance.defaultLabel')}
							</div>
							<div className="mt-0.5 text-xs text-muted-foreground">
								{formatDate(advance.advanceDate)}
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-1.5">
							<span className="text-sm font-semibold tabular-nums text-tone-red-fg">
								−{formatMoney(advance.amount)}
							</span>
							{canManage && isLive && advance.removable && (
								<Button
									variant="ghost"
									size="icon"
									className="size-7 text-muted-foreground hover:text-destructive"
									aria-label={t('advance.removeAria')}
									onClick={() => setAdvanceToRemove(advance)}
								>
									<X className="size-3.5" />
								</Button>
							)}
						</div>
					</div>
				))
			)}

			{isLive && (
				<Can permission="payroll.manage">
					<AddAdvanceForm period={period} />
				</Can>
			)}

			{period.advancesExceedGross && (
				<div className="border-b border-border bg-destructive/5 px-5 py-3 text-xs text-destructive">
					{t('advance.exceedWarning')}
				</div>
			)}

			<div className="bg-muted/40 px-5 py-3.5">
				<div className="mb-1.5 flex items-center justify-between text-sm">
					<span className="text-muted-foreground">{t('column.computed')}</span>
					<span className="tabular-nums">
						{formatMoney(period.grossAmount)}
					</span>
				</div>
				<div className="mb-2 flex items-center justify-between text-sm">
					<span className="text-muted-foreground">{t('column.advances')}</span>
					<span className="tabular-nums text-tone-red-fg">
						−{formatMoney(period.advancesTotal)}
					</span>
				</div>
				<div className="mb-2 h-px bg-border" />
				<div className="flex items-center justify-between">
					<span className="text-sm font-bold">{t('stat.netPayable')}</span>
					<span className="text-base font-bold tabular-nums text-tone-green-fg">
						{formatMoney(period.netAmount)}
					</span>
				</div>
			</div>

			<ConfirmDialog
				open={advanceToRemove !== null}
				onOpenChange={(open) => {
					if (!open) setAdvanceToRemove(null);
				}}
				title={t('advance.removeTitle')}
				description={
					advanceToRemove
						? t('advance.removeDescription', {
								amount: formatMoney(advanceToRemove.amount),
								date: formatDate(advanceToRemove.advanceDate),
							})
						: undefined
				}
				confirmLabel={t('advance.removeConfirm')}
				variant="destructive"
				loading={removeAdvance.isPending}
				onConfirm={handleRemoveConfirm}
			/>
		</Card>
	);
}
