import { useEffect } from 'react';
import { useForm, useWatch, type Control, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	Card,
	CardContent,
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

import type {
	BillingCycleAnchor,
	BillingMode,
	TenantBillingPolicy,
} from '@/api/billing-policy/types';

import { useUpdateTenantBillingPolicy } from '../../hooks';
import {
	billingPolicySchema,
	type BillingPolicyFormValues,
} from '../../schemas/billing-policy-form.schema';
import { useAppT } from '@/locales';

// Option lists and hints hold user-facing text, so they are built from the
// translator at render rather than held as module-scope literals.
type PolicyT = ReturnType<typeof useAppT<'tenants'>>;

function billingModeOptions(t: PolicyT) {
	return [
		{ value: 'PREPAID', label: t('policy.prepaid') },
		{ value: 'POSTPAID', label: t('policy.postpaid') },
	];
}

function billingModeHint(t: PolicyT, mode: BillingMode): string {
	return mode === 'PREPAID' ? t('policy.prepaidHint') : t('policy.postpaidHint');
}

function billingCycleAnchorOptions(t: PolicyT) {
	return [
		{ value: 'CALENDAR', label: t('policy.calendarMonth') },
		{ value: 'ENROLLMENT', label: t('policy.enrollmentAnniversary') },
	];
}

function billingCycleAnchorHint(t: PolicyT, anchor: BillingCycleAnchor): string {
	return anchor === 'CALENDAR' ? t('policy.calendarHint') : t('policy.enrollmentHint');
}

function prorationOptions(t: PolicyT) {
	return [
		{ value: 'SESSION', label: t('policy.sessionBased') },
		{ value: 'DAILY', label: t('policy.daily') },
		{ value: 'NONE', label: t('policy.none') },
	];
}

function consumptionOptions(t: PolicyT) {
	return [
		{ value: 'ATTENDED_PLUS_UNEXCUSED', label: t('policy.attendedUnexcused') },
		{ value: 'ALL_SCHEDULED', label: t('policy.allScheduled') },
		{ value: 'ATTENDED_ONLY', label: t('policy.attendedOnly') },
	];
}

function lateFeeTypeOptions(t: PolicyT) {
	return [
		{ value: 'FIXED', label: t('policy.fixedAmount') },
		{ value: 'PERCENT', label: t('policy.percentage') },
	];
}

function lateFeeRecurrenceOptions(t: PolicyT) {
	return [
		{ value: 'ONE_TIME', label: t('policy.oneTime') },
		{ value: 'DAILY', label: t('policy.daily') },
		{ value: 'WEEKLY', label: t('policy.weekly') },
	];
}

const CARD_CLASS = 'gap-0 py-0';
const CARD_HEADER_CLASS = 'border-b border-border px-5 py-4';
const CARD_TITLE_CLASS = 'text-sm font-semibold';
const CARD_CONTENT_CLASS = 'flex flex-col gap-4 px-5 py-5';

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

function toDefaults(p: TenantBillingPolicy): BillingPolicyFormValues {
	return {
		billingMode: p.billingMode,
		billingCycleAnchor: p.billingCycleAnchor,
		billingDay: p.billingDay,
		dueDay: p.dueDay,
		dueOffsetDays: p.dueOffsetDays,
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

/**
 * The billing-policy editor for one tenant. This is the only place the policy can
 * be changed — every save is recorded in the platform audit trail with a
 * before/after diff, and takes effect from the tenant's next billing run.
 */
export function BillingPolicyForm({
	tenantId,
	policy,
}: {
	tenantId: number;
	policy: TenantBillingPolicy;
}) {
	const t = useAppT('tenants');
	const form = useForm<BillingPolicyFormValues>({
		resolver: zodResolver(billingPolicySchema),
		defaultValues: toDefaults(policy),
	});

	const updatePolicy = useUpdateTenantBillingPolicy(tenantId);

	// `useWatch` rather than `form.watch()`: the latter returns a fresh function
	// the React Compiler cannot memoize safely, and this app lints with zero
	// warnings. It also scopes re-renders to just these three fields.
	const control = form.control;
	const lateFeeEnabled = useWatch({ control, name: 'lateFeeEnabled' });
	const billingMode = useWatch({ control, name: 'billingMode' });
	const billingCycleAnchor = useWatch({ control, name: 'billingCycleAnchor' });
	const isAnniversary = billingCycleAnchor === 'ENROLLMENT';

	// Re-seed when the console switches to another tenant, or the server returns a
	// policy that differs from what was submitted (this is a merge-upsert).
	useEffect(() => {
		form.reset(toDefaults(policy));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [policy]);

	async function onSubmit(values: BillingPolicyFormValues) {
		try {
			await updatePolicy.mutateAsync({
				billingMode: values.billingMode,
				billingCycleAnchor: values.billingCycleAnchor,
				billingDay: values.billingDay,
				dueDay: values.dueDay,
				dueOffsetDays: values.dueOffsetDays,
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
			toast.success(t('policy.saved'));
		} catch (err) {
			// The server re-validates the cross-field rules against the merged
			// result and is the source of truth — surface its message verbatim.
			toast.error(isApiError(err) ? err.message : t('policy.saveError'));
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex max-w-3xl flex-col gap-6"
			>
				<Card className={CARD_CLASS}>
					<CardHeader className={CARD_HEADER_CLASS}>
						<CardTitle className={CARD_TITLE_CLASS}>
							{t('policy.billingMode')}
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							{t('policy.billingModeHint')}
						</p>
					</CardHeader>
					<CardContent className={CARD_CONTENT_CLASS}>
						<div className="flex flex-col gap-1.5">
							<FormSelect
								control={form.control}
								name="billingMode"
								label={t('policy.billingMode')}
								options={billingModeOptions(t)}
							/>
							<p className="text-xs text-muted-foreground">
								{billingModeHint(t, billingMode)}
							</p>
						</div>
						<div className="flex flex-col gap-1.5">
							<FormSelect
								control={form.control}
								name="billingCycleAnchor"
								label={t('policy.billingCycle')}
								options={billingCycleAnchorOptions(t)}
							/>
							<p className="text-xs text-muted-foreground">
								{billingCycleAnchorHint(t, billingCycleAnchor)}
							</p>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormSelect
								control={form.control}
								name="prorationMethod"
								label={t('policy.defaultProration')}
								options={prorationOptions(t)}
							/>
							{isAnniversary ? (
								<NumberField
									control={form.control}
									name="dueOffsetDays"
									label={t('policy.dueOffset')}
									min={0}
									max={28}
									hint={t('policy.dueOffsetHint')}
								/>
							) : (
								<>
									<NumberField
										control={form.control}
										name="billingDay"
										label={t('policy.billingDay')}
										min={1}
										max={28}
										hint={t('policy.billingDayHint')}
									/>
									<NumberField
										control={form.control}
										name="dueDay"
										label={t('policy.defaultDueDay')}
										min={1}
										max={28}
									/>
								</>
							)}
							<NumberField
								control={form.control}
								name="immediateDueDays"
								label={t('policy.immediateDueOffset')}
								min={0}
								max={28}
								hint={t('policy.immediateDueHint')}
							/>
							<NumberField
								control={form.control}
								name="graceDays"
								label={t('policy.graceDays')}
								min={0}
								max={60}
								hint={t('policy.graceDaysHint')}
							/>
						</div>
						{isAnniversary && (
							<p className="text-xs text-muted-foreground">
								{t('policy.enrollmentAnniversaryNote')}
							</p>
						)}
					</CardContent>
				</Card>

				<Card className={CARD_CLASS}>
					<CardHeader className={CARD_HEADER_CLASS}>
						<CardTitle className={CARD_TITLE_CLASS}>
							{t('policy.chargeOnEnrollment')}
						</CardTitle>
					</CardHeader>
					<CardContent className={CARD_CONTENT_CLASS}>
						<SwitchField
							control={form.control}
							name="chargeOnEnrollment"
							label={t('policy.chargeOnEnrollment')}
							description={
								isAnniversary
									? t('policy.chargeOnEnrollmentHintAnniversary')
									: t('policy.chargeOnEnrollmentHint')
							}
						/>
					</CardContent>
				</Card>

				<Card className={CARD_CLASS}>
					<CardHeader className={CARD_HEADER_CLASS}>
						<CardTitle className={CARD_TITLE_CLASS}>
							{t('policy.lateFeeType')}
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							{t('policy.dunningHint')}
						</p>
					</CardHeader>
					<CardContent className={CARD_CONTENT_CLASS}>
						<SwitchField
							control={form.control}
							name="lateFeeEnabled"
							label={t('policy.enableLateFees')}
						/>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormSelect
								control={form.control}
								name="lateFeeType"
								label={t('policy.lateFeeType')}
								options={lateFeeTypeOptions(t)}
								disabled={!lateFeeEnabled}
							/>
							<NumberField
								control={form.control}
								name="lateFeeAmount"
								label={t('policy.lateFeeAmount')}
								min={0}
								hint={t('policy.lateFeeAmountHint')}
								disabled={!lateFeeEnabled}
							/>
							<FormSelect
								control={form.control}
								name="lateFeeRecurrence"
								label={t('policy.recurrence')}
								options={lateFeeRecurrenceOptions(t)}
								disabled={!lateFeeEnabled}
							/>
							<NumberField
								control={form.control}
								name="lateFeeMaxTotal"
								label={t('policy.maxTotal')}
								min={0}
								nullable
								placeholder={t('policy.maxTotalPlaceholder')}
								disabled={!lateFeeEnabled}
							/>
						</div>
					</CardContent>
				</Card>

				<Card className={CARD_CLASS}>
					<CardHeader className={CARD_HEADER_CLASS}>
						<CardTitle className={CARD_TITLE_CLASS}>
							{t('policy.recurrence')}
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							{t('policy.dunningSection')}
						</p>
					</CardHeader>
					<CardContent className={CARD_CONTENT_CLASS}>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<NumberField
								control={form.control}
								name="autoSuspendAfterDays"
								label={t('policy.autoSuspendAfter')}
								min={1}
								nullable
								placeholder={t('policy.disabledPlaceholder')}
								hint={t('policy.autoSuspendHint')}
							/>
							<NumberField
								control={form.control}
								name="autoCancelAfterDays"
								label={t('policy.autoCancelAfter')}
								min={1}
								nullable
								placeholder={t('policy.disabledPlaceholder')}
								hint={t('policy.autoCancelHint')}
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							{t('policy.dunningNote')}
						</p>
						<SwitchField
							control={form.control}
							name="remindersEnabled"
							label={t('policy.paymentReminders')}
							description={t('policy.paymentRemindersDescription')}
						/>
					</CardContent>
				</Card>

				<Card className={CARD_CLASS}>
					<CardHeader className={CARD_HEADER_CLASS}>
						<CardTitle className={CARD_TITLE_CLASS}>
							{t('policy.consumptionRule')}
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							{t('policy.consumptionSection')}
						</p>
					</CardHeader>
					<CardContent className={CARD_CONTENT_CLASS}>
						<div className="flex flex-col gap-1.5">
							<FormSelect
								control={form.control}
								name="consumptionRule"
								label={t('policy.consumptionRule')}
								options={consumptionOptions(t)}
							/>
							<p className="text-xs text-muted-foreground">
								{t('policy.consumptionRuleHint')}
							</p>
						</div>
						<SwitchField
							control={form.control}
							name="autoApplyCredit"
							label={t('policy.autoApplyWalletCredit')}
							description={t('policy.autoApplyDescription')}
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
						{t('policy.reset')}
					</Button>
					<Button type="submit" disabled={updatePolicy.isPending}>
						{updatePolicy.isPending && <Spinner className="mr-2 size-4" />}
						{t('policy.save')}
					</Button>
				</div>
			</form>
		</Form>
	);
}
