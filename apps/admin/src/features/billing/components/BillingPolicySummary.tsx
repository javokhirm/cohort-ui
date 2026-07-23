import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	DetailRows,
	type DetailRow,
} from '@repo/ui';
import { formatPrice } from '@repo/utils';
import { useAppT } from '@/locales';

import type {
	BillingCycleAnchor,
	BillingMode,
	BillingPolicyResponse,
	ConsumptionRule,
	LateFeeRecurrence,
	LateFeeType,
	PolicyProrationMethod,
} from '../api/billing-policy.queries';

function Section({ title, rows }: { title: string; rows: DetailRow[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm font-semibold">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<DetailRows rows={rows} />
			</CardContent>
		</Card>
	);
}

/**
 * Read-only view of the tenant's effective billing policy. Deliberately has no
 * edit affordance: the policy is configured by the platform team, not self-serve
 * (see `BillingPolicyPage`).
 */
export function BillingPolicySummary({ policy }: { policy: BillingPolicyResponse }) {
	const t = useAppT('billing');
	const isAnniversary = policy.billingCycleAnchor === 'ENROLLMENT';

	const billingModeLabel: Record<BillingMode, string> = {
		PREPAID: t('policyDetail.modePrepaid'),
		POSTPAID: t('policyDetail.modePostpaid'),
	};
	const anchorLabel: Record<BillingCycleAnchor, string> = {
		CALENDAR: t('policyDetail.anchorCalendar'),
		ENROLLMENT: t('policyDetail.anchorEnrollment'),
	};
	const prorationLabel: Record<PolicyProrationMethod, string> = {
		SESSION: t('policyDetail.prorationSession'),
		DAILY: t('policyDetail.prorationDaily'),
		NONE: t('policyDetail.prorationNone'),
	};
	const consumptionLabel: Record<ConsumptionRule, string> = {
		ATTENDED_PLUS_UNEXCUSED: t('policyDetail.consumptionAttendedPlusUnexcused'),
		ALL_SCHEDULED: t('policyDetail.consumptionAllScheduled'),
		ATTENDED_ONLY: t('policyDetail.consumptionAttendedOnly'),
	};
	const lateFeeTypeLabel: Record<LateFeeType, string> = {
		FIXED: t('policyDetail.lateFeeFixed'),
		PERCENT: t('policyDetail.lateFeePercent'),
	};
	const lateFeeRecurrenceLabel: Record<LateFeeRecurrence, string> = {
		ONE_TIME: t('policyDetail.recurrenceOneTime'),
		DAILY: t('policyDetail.recurrenceDaily'),
		WEEKLY: t('policyDetail.recurrenceWeekly'),
	};

	const onOff = (value: boolean) =>
		value ? t('policyDetail.on') : t('policyDetail.off');

	/** `null` on a dunning field means the step is switched off entirely. */
	const daysOrDisabled = (days: number | null) =>
		days == null
			? t('policyDetail.disabled')
			: t('policyDetail.daysPastDue', { days });

	const basics: DetailRow[] = [
		{
			label: t('policyDetail.billingMode'),
			value: billingModeLabel[policy.billingMode],
		},
		{
			label: t('policyDetail.billingCycle'),
			value: anchorLabel[policy.billingCycleAnchor],
		},
		// Under enrollment-anniversary billing there is no shared billing/due day —
		// every student rolls on their own join date — so showing those two fields
		// would be actively misleading.
		...(isAnniversary
			? [
					{
						label: t('policyDetail.invoiceDue'),
						value:
							policy.dueOffsetDays === 0
								? t('policyDetail.dueOnCycleStart')
								: t('policyDetail.dueDaysIntoCycle', {
										days: policy.dueOffsetDays,
									}),
					},
				]
			: [
					{
						label: t('policyDetail.billingDay'),
						value: t('policyDetail.dayOfMonth', { day: policy.billingDay }),
					},
					{
						label: t('policyDetail.defaultDueDay'),
						value: t('policyDetail.dayOfMonth', { day: policy.dueDay }),
					},
				]),
		{
			label: t('policyDetail.defaultProration'),
			value: isAnniversary
				? t('policyDetail.prorationNotApplied', {
						method: prorationLabel[policy.prorationMethod],
					})
				: prorationLabel[policy.prorationMethod],
		},
		{
			label: t('policyDetail.immediateDueOffset'),
			value:
				policy.immediateDueDays === 0
					? t('policyDetail.sameDay')
					: t('policyDetail.daysValue', { days: policy.immediateDueDays }),
		},
		{
			label: t('policyDetail.gracePeriod'),
			value:
				policy.graceDays === 0
					? t('policyDetail.graceNone')
					: t('policyDetail.graceValue', { days: policy.graceDays }),
		},
	];

	const enrollment: DetailRow[] = [
		{
			label: t('policyDetail.chargeOnEnrollment'),
			value: policy.chargeOnEnrollment
				? isAnniversary
					? t('policyDetail.chargeOnFirstCycle')
					: t('policyDetail.chargeOnProrated')
				: t('policyDetail.chargeOff'),
		},
	];

	const lateFees: DetailRow[] = policy.lateFeeEnabled
		? [
				{ label: t('policyDetail.lateFees'), value: t('policyDetail.on') },
				{
					label: t('policyDetail.type'),
					value: lateFeeTypeLabel[policy.lateFeeType],
				},
				{
					label: t('policyDetail.amount'),
					value:
						policy.lateFeeType === 'PERCENT'
							? `${policy.lateFeeAmount}%`
							: formatPrice(policy.lateFeeAmount),
				},
				{
					label: t('policyDetail.recurrence'),
					value: lateFeeRecurrenceLabel[policy.lateFeeRecurrence],
				},
				{
					label: t('policyDetail.maxPerInvoice'),
					value:
						policy.lateFeeMaxTotal == null
							? t('policyDetail.uncapped')
							: formatPrice(policy.lateFeeMaxTotal),
				},
			]
		: [{ label: t('policyDetail.lateFees'), value: t('policyDetail.off') }];

	const dunning: DetailRow[] = [
		{
			label: t('policyDetail.autoSuspend'),
			value: daysOrDisabled(policy.autoSuspendAfterDays),
		},
		{
			label: t('policyDetail.autoCancel'),
			value: daysOrDisabled(policy.autoCancelAfterDays),
		},
		{
			label: t('policyDetail.paymentReminders'),
			value: onOff(policy.remindersEnabled),
		},
	];

	const advanced: DetailRow[] = [
		{
			label: t('policyDetail.consumptionRule'),
			value: consumptionLabel[policy.consumptionRule],
		},
		{
			label: t('policyDetail.autoApplyCredit'),
			value: onOff(policy.autoApplyCredit),
		},
	];

	return (
		<div className="flex flex-col gap-6">
			<Section title={t('policySections.basics')} rows={basics} />
			<Section title={t('policySections.enrollment')} rows={enrollment} />
			<Section title={t('policySections.lateFees')} rows={lateFees} />
			<Section title={t('policySections.dunning')} rows={dunning} />
			<Section title={t('policySections.advanced')} rows={advanced} />
		</div>
	);
}
