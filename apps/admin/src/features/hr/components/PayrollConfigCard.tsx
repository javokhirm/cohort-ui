import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';

import {
	Button,
	Card,
	CardContent,
	FieldGroup,
	Form,
	FormDatePicker,
	FormInput,
	FormMoneyInput,
	FormSelect,
	Skeleton,
	Spinner,
	StatusBadge,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatDate, formatMoney, todayIsoDate } from '@repo/utils';

import { Can } from '@/components/Can';
import { FormSheet } from '@/components/FormSheet';
import { usePayrollConfigs } from '@/features/payroll/api/payroll-configs.queries';
import { useCreatePayrollConfig } from '@/features/payroll/api/payroll-configs.mutations';
import type { PayrollConfigResponse } from '@/features/payroll/api/payroll-configs.queries';

import {
	payrollConfigFormSchema,
	type PayrollConfigFormValues,
} from '../schemas/payroll-config-form.schema';

const PAYROLL_TYPE_OPTIONS = [
	{ value: 'FIXED', label: 'Fixed salary' },
	{ value: 'PERCENT', label: '% of student fees' },
];

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

function ChangePayModelSheet({
	staffId,
	open,
	onOpenChange,
}: {
	staffId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const createConfig = useCreatePayrollConfig(staffId);
	const form = useForm<PayrollConfigFormValues>({
		resolver: zodResolver(payrollConfigFormSchema),
		defaultValues: {
			payrollType: 'FIXED',
			baseSalary: undefined,
			payrollPercent: undefined,
			effectiveFrom: todayIsoDate(),
		},
	});
	const payrollType = form.watch('payrollType');

	async function onSubmit(values: PayrollConfigFormValues) {
		try {
			await createConfig.mutateAsync({
				payrollType: values.payrollType,
				baseSalary:
					values.payrollType === 'FIXED' ? values.baseSalary : undefined,
				payrollPercent:
					values.payrollType === 'PERCENT' ? values.payrollPercent : undefined,
				effectiveFrom: values.effectiveFrom,
			});
			toast.success('Pay model updated');
			onOpenChange(false);
			form.reset({
				payrollType: 'FIXED',
				baseSalary: undefined,
				payrollPercent: undefined,
				effectiveFrom: todayIsoDate(),
			});
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to update the pay model');
		}
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Change pay model"
			description="Opens a new pay window; earlier periods keep the model they were computed with."
			footer={
				<>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="payroll-config-form"
						disabled={createConfig.isPending}
					>
						{createConfig.isPending && <Spinner className="mr-2 size-4" />}
						Save
					</Button>
				</>
			}
		>
			<Form {...form}>
				<form
					id="payroll-config-form"
					onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
					className="flex flex-col gap-4"
				>
					<FieldGroup>
						<FormSelect
							control={form.control}
							name="payrollType"
							label="Pay model *"
							options={PAYROLL_TYPE_OPTIONS}
						/>
						{payrollType === 'PERCENT' ? (
							<>
								<FormInput
									control={form.control}
									name="payrollPercent"
									label="Share of student fees (%) *"
									type="number"
									placeholder="e.g. 50"
									onChange={(e) =>
										form.setValue(
											'payrollPercent',
											e.target.value === ''
												? undefined
												: Number(e.target.value),
											{ shouldValidate: true },
										)
									}
								/>
								<p className="text-xs text-muted-foreground">
									The teacher earns this share of the tuition of
									students in their groups, prorated by completed
									sessions.
								</p>
							</>
						) : (
							<FormMoneyInput
								control={form.control}
								name="baseSalary"
								label="Monthly salary *"
								placeholder="0"
							/>
						)}
						<FormDatePicker
							control={form.control}
							name="effectiveFrom"
							label="Effective from *"
						/>
						<p className="text-xs text-muted-foreground">
							Payroll from this date uses the new pay model.
						</p>
					</FieldGroup>
				</form>
			</Form>
		</FormSheet>
	);
}

/**
 * The staff member's pay model — current window, past windows, and the
 * `payroll.manage`-gated "Change pay model" action. Replaces the old
 * monthly-salary card: pay now lives on a dated config timeline, so historic
 * payroll never changes retroactively.
 */
export function PayrollConfigCard({ staffId }: { staffId: number }) {
	const { data: configs, isLoading, isError } = usePayrollConfigs(staffId);
	const [changeOpen, setChangeOpen] = useState(false);

	const current = configs ? findCurrentConfig(configs) : undefined;
	const history = (configs ?? []).filter((c) => c.id !== current?.id);

	return (
		<Card>
			<CardContent className="flex flex-col gap-3 pt-5">
				<div className="flex items-center justify-between">
					<p className="font-semibold">Pay model</p>
					<Can permission="payroll.manage">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setChangeOpen(true)}
						>
							<Pencil className="mr-1.5 size-3.5" />
							Change pay model
						</Button>
					</Can>
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
									<span className="shrink-0 text-xs text-muted-foreground">
										{formatDate(config.effectiveFrom)} –{' '}
										{config.effectiveTo
											? formatDate(config.effectiveTo)
											: 'now'}
									</span>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>

			<ChangePayModelSheet
				staffId={staffId}
				open={changeOpen}
				onOpenChange={setChangeOpen}
			/>
		</Card>
	);
}
