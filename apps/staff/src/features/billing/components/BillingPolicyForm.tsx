import { useEffect } from 'react';
import { useForm, type Control, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormSelect,
	Input,
	Spinner,
	Switch,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';

import type { BillingMode, BillingPolicyResponse } from '../api/billing-policy.queries';
import { useUpdateBillingPolicy } from '../api/billing-policy.mutations';
import {
	billingPolicySchema,
	type BillingPolicyFormValues,
} from '../schemas/billing-policy-form.schema';

const BILLING_MODE_OPTIONS = [
	{ value: 'PREPAID', label: 'Prepaid' },
	{ value: 'POSTPAID', label: 'Postpaid (arrears)' },
];

const BILLING_MODE_HINTS: Record<BillingMode, string> = {
	PREPAID: 'Bills the current month in advance, before it starts.',
	POSTPAID:
		"Bills the previous, fully-elapsed month in arrears, via two independent legs: a time-based leg for Monthly fee plans and a consumption-based leg for Per-session plans (billed by sessions actually consumed, per the consumption rule below). Each enrollment is billed by exactly one leg, based on its fee plan's billing cycle — never both.",
};

const PRORATION_OPTIONS = [
	{ value: 'SESSION', label: 'Session-based' },
	{ value: 'DAILY', label: 'Daily' },
	{ value: 'NONE', label: 'None' },
];

const CONSUMPTION_OPTIONS = [
	{ value: 'ATTENDED_PLUS_UNEXCUSED', label: 'Attended + unexcused' },
	{ value: 'ALL_SCHEDULED', label: 'All scheduled' },
	{ value: 'ATTENDED_ONLY', label: 'Attended only' },
];

const LATE_FEE_TYPE_OPTIONS = [
	{ value: 'FIXED', label: 'Fixed amount (UZS)' },
	{ value: 'PERCENT', label: 'Percentage (%)' },
];

const LATE_FEE_RECURRENCE_OPTIONS = [
	{ value: 'ONE_TIME', label: 'One-time' },
	{ value: 'DAILY', label: 'Daily' },
	{ value: 'WEEKLY', label: 'Weekly' },
];

type PolicyControl = Control<BillingPolicyFormValues>;
type PolicyField = FieldPath<BillingPolicyFormValues>;

/**
 * Numeric field bound via `field.onChange`. Empty input becomes `null` when
 * `nullable` (a disabled dunning / cap value) and `undefined` otherwise so Zod
 * reports it as required. Coerces `null`/`undefined` to `''` for the input.
 */
function NumberField({
	control,
	name,
	label,
	min,
	max,
	nullable = false,
	placeholder,
	hint,
	disabled,
}: {
	control: PolicyControl;
	name: PolicyField;
	label: string;
	min?: number;
	max?: number;
	nullable?: boolean;
	placeholder?: string;
	hint?: string;
	disabled?: boolean;
}) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<Input
							type="number"
							min={min}
							max={max}
							placeholder={placeholder}
							disabled={disabled}
							value={
								field.value === null || field.value === undefined
									? ''
									: (field.value as number)
							}
							onChange={(e) =>
								field.onChange(
									e.target.value === ''
										? nullable
											? null
											: undefined
										: Number(e.target.value),
								)
							}
						/>
					</FormControl>
					{hint && <p className="text-xs text-muted-foreground">{hint}</p>}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

/** Labelled toggle row bound to a boolean field. */
function SwitchField({
	control,
	name,
	label,
	description,
}: {
	control: PolicyControl;
	name: PolicyField;
	label: string;
	description?: string;
}) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border border-border p-3">
					<div className="flex flex-col gap-0.5">
						<FormLabel>{label}</FormLabel>
						{description && (
							<p className="text-xs text-muted-foreground">{description}</p>
						)}
					</div>
					<FormControl>
						<Switch
							checked={Boolean(field.value)}
							onCheckedChange={(v) => field.onChange(v === true)}
						/>
					</FormControl>
				</FormItem>
			)}
		/>
	);
}

function toDefaults(p: BillingPolicyResponse): BillingPolicyFormValues {
	return {
		billingMode: p.billingMode,
		billingDay: p.billingDay,
		dueDay: p.dueDay,
		immediateDueDays: p.immediateDueDays,
		graceDays: p.graceDays,
		prorationMethod: p.prorationMethod,
		consumptionRule: p.consumptionRule,
		chargeOnEnrollment: p.chargeOnEnrollment,
		autoApplyCredit: p.autoApplyCredit,
		remindersEnabled: p.remindersEnabled,
		lateFeeEnabled: p.lateFeeEnabled,
		lateFeeType: p.lateFeeType,
		lateFeeAmount: p.lateFeeAmount,
		lateFeeRecurrence: p.lateFeeRecurrence,
		lateFeeMaxTotal: p.lateFeeMaxTotal,
		autoSuspendAfterDays: p.autoSuspendAfterDays,
		autoCancelAfterDays: p.autoCancelAfterDays,
	};
}

export function BillingPolicyForm({ policy }: { policy: BillingPolicyResponse }) {
	const form = useForm<BillingPolicyFormValues>({
		resolver: zodResolver(billingPolicySchema),
		defaultValues: toDefaults(policy),
	});

	const updatePolicy = useUpdateBillingPolicy();
	const lateFeeEnabled = form.watch('lateFeeEnabled');
	const billingMode = form.watch('billingMode');

	useEffect(() => {
		form.reset(toDefaults(policy));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [policy]);

	async function onSubmit(values: BillingPolicyFormValues) {
		try {
			await updatePolicy.mutateAsync({
				billingMode: values.billingMode,
				billingDay: values.billingDay,
				dueDay: values.dueDay,
				immediateDueDays: values.immediateDueDays,
				graceDays: values.graceDays,
				prorationMethod: values.prorationMethod,
				consumptionRule: values.consumptionRule,
				chargeOnEnrollment: values.chargeOnEnrollment,
				autoApplyCredit: values.autoApplyCredit,
				remindersEnabled: values.remindersEnabled,
				lateFeeEnabled: values.lateFeeEnabled,
				lateFeeType: values.lateFeeType,
				lateFeeAmount: values.lateFeeAmount,
				lateFeeRecurrence: values.lateFeeRecurrence,
				lateFeeMaxTotal: values.lateFeeMaxTotal,
				autoSuspendAfterDays: values.autoSuspendAfterDays,
				autoCancelAfterDays: values.autoCancelAfterDays,
			});
			toast.success('Billing policy saved');
		} catch (err) {
			// No error-code → message layer in this repo; surface the API message.
			toast.error(isApiError(err) ? err.message : 'Failed to save billing policy');
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-6"
			>
				<Card>
					<CardHeader>
						<CardTitle>Billing basics</CardTitle>
						<CardDescription>
							Defaults for invoice generation. Fee plans may override the
							due-day and proration per plan.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<FormSelect
								control={form.control}
								name="billingMode"
								label="Billing mode"
								options={BILLING_MODE_OPTIONS}
							/>
							<p className="text-xs text-muted-foreground">
								{BILLING_MODE_HINTS[billingMode]}
							</p>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormSelect
								control={form.control}
								name="prorationMethod"
								label="Default proration"
								options={PRORATION_OPTIONS}
							/>
							<NumberField
								control={form.control}
								name="billingDay"
								label="Billing day (1–28)"
								min={1}
								max={28}
								hint="Day the daily cycle generates that period's invoices."
							/>
							<NumberField
								control={form.control}
								name="dueDay"
								label="Default due day (1–28)"
								min={1}
								max={28}
							/>
							<NumberField
								control={form.control}
								name="immediateDueDays"
								label="Immediate due offset (days)"
								min={0}
								max={28}
								hint="Due offset for charge-on-enrollment invoices; 0 = same day."
							/>
							<NumberField
								control={form.control}
								name="graceDays"
								label="Grace days (0–60)"
								min={0}
								max={60}
								hint="Days past due before an invoice flips to OVERDUE."
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Enrollment</CardTitle>
					</CardHeader>
					<CardContent>
						<SwitchField
							control={form.control}
							name="chargeOnEnrollment"
							label="Charge on enrollment"
							description="Issue a prorated invoice immediately when a student is enrolled onto a monthly fee plan."
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Late fees</CardTitle>
						<CardDescription>
							Applied automatically by the nightly dunning job once an
							invoice is overdue.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<SwitchField
							control={form.control}
							name="lateFeeEnabled"
							label="Enable late fees"
						/>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormSelect
								control={form.control}
								name="lateFeeType"
								label="Late fee type"
								options={LATE_FEE_TYPE_OPTIONS}
								disabled={!lateFeeEnabled}
							/>
							<NumberField
								control={form.control}
								name="lateFeeAmount"
								label="Late fee amount"
								min={0}
								hint="A percentage must be ≤ 100."
								disabled={!lateFeeEnabled}
							/>
							<FormSelect
								control={form.control}
								name="lateFeeRecurrence"
								label="Recurrence"
								options={LATE_FEE_RECURRENCE_OPTIONS}
								disabled={!lateFeeEnabled}
							/>
							<NumberField
								control={form.control}
								name="lateFeeMaxTotal"
								label="Max total (blank = uncapped)"
								min={0}
								nullable
								placeholder="Uncapped"
								disabled={!lateFeeEnabled}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Dunning</CardTitle>
						<CardDescription>
							Runs nightly per tenant: suspends, then cancels, enrollments
							whose invoices stay unpaid. Auto-cancel days must exceed
							auto-suspend days.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<NumberField
								control={form.control}
								name="autoSuspendAfterDays"
								label="Auto-suspend after (days)"
								min={1}
								nullable
								placeholder="Disabled"
								hint="Days past the invoice's due date before its enrollment is auto-suspended."
							/>
							<NumberField
								control={form.control}
								name="autoCancelAfterDays"
								label="Auto-cancel after (days)"
								min={1}
								nullable
								placeholder="Disabled"
								hint="Days past the invoice's due date before its enrollment is auto-dropped."
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							Grace days, auto-suspend, and auto-cancel are all counted from
							the invoice's actual due date — grace only delays when it
							flips to OVERDUE, it doesn't reset the clock for
							suspend/cancel.
						</p>
						<SwitchField
							control={form.control}
							name="remindersEnabled"
							label="Payment reminders"
							description="Fires the Payment Reminder Rules you've configured as invoices approach and pass their due date."
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Advanced</CardTitle>
						<CardDescription>
							Consumption rule for per-session billing, plus wallet settings
							reserved for a later phase.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<FormSelect
								control={form.control}
								name="consumptionRule"
								label="Consumption rule"
								options={CONSUMPTION_OPTIONS}
							/>
							<p className="text-xs text-muted-foreground">
								Which sessions count as chargeable on a Per-session fee
								plan's invoice: attended sessions plus unexcused absences,
								every scheduled session, or only sessions actually
								attended.
							</p>
						</div>
						<SwitchField
							control={form.control}
							name="autoApplyCredit"
							label="Auto-apply wallet credit"
							description="Reserved for a later phase — no visible effect yet."
						/>
					</CardContent>
				</Card>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => form.reset(toDefaults(policy))}
						disabled={updatePolicy.isPending}
					>
						Reset
					</Button>
					<Button type="submit" disabled={updatePolicy.isPending}>
						{updatePolicy.isPending && <Spinner className="mr-2 size-4" />}
						Save policy
					</Button>
				</div>
			</form>
		</Form>
	);
}
