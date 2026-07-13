import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	DetailRows,
	type DetailRow,
} from '@repo/ui';
import { formatPrice } from '@repo/utils';

import type {
	BillingCycleAnchor,
	BillingMode,
	BillingPolicyResponse,
	ConsumptionRule,
	LateFeeRecurrence,
	LateFeeType,
	PolicyProrationMethod,
} from '../api/billing-policy.queries';

const BILLING_MODE_LABEL: Record<BillingMode, string> = {
	PREPAID: 'Prepaid — billed in advance',
	POSTPAID: 'Postpaid — billed in arrears',
};

const BILLING_CYCLE_ANCHOR_LABEL: Record<BillingCycleAnchor, string> = {
	CALENDAR: 'Calendar month',
	ENROLLMENT: 'Enrollment anniversary',
};

const PRORATION_LABEL: Record<PolicyProrationMethod, string> = {
	SESSION: 'Session-based',
	DAILY: 'Daily',
	NONE: 'None',
};

const CONSUMPTION_LABEL: Record<ConsumptionRule, string> = {
	ATTENDED_PLUS_UNEXCUSED: 'Attended + unexcused',
	ALL_SCHEDULED: 'All scheduled',
	ATTENDED_ONLY: 'Attended only',
};

const LATE_FEE_TYPE_LABEL: Record<LateFeeType, string> = {
	FIXED: 'Fixed amount',
	PERCENT: 'Percentage of the invoice',
};

const LATE_FEE_RECURRENCE_LABEL: Record<LateFeeRecurrence, string> = {
	ONE_TIME: 'One-time',
	DAILY: 'Daily',
	WEEKLY: 'Weekly',
};

const onOff = (value: boolean) => (value ? 'On' : 'Off');

/** `null` on a dunning field means the step is switched off entirely. */
const daysOrDisabled = (days: number | null) =>
	days == null ? 'Disabled' : `${days} days past due`;

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
	const isAnniversary = policy.billingCycleAnchor === 'ENROLLMENT';

	const basics: DetailRow[] = [
		{ label: 'Billing mode', value: BILLING_MODE_LABEL[policy.billingMode] },
		{
			label: 'Billing cycle',
			value: BILLING_CYCLE_ANCHOR_LABEL[policy.billingCycleAnchor],
		},
		// Under enrollment-anniversary billing there is no shared billing/due day —
		// every student rolls on their own join date — so showing those two fields
		// would be actively misleading.
		...(isAnniversary
			? [
					{
						label: 'Invoice due',
						value:
							policy.dueOffsetDays === 0
								? "On each student's cycle start date"
								: `${policy.dueOffsetDays} days into each student's cycle`,
					},
				]
			: [
					{
						label: 'Billing day',
						value: `Day ${policy.billingDay} of the month`,
					},
					{
						label: 'Default due day',
						value: `Day ${policy.dueDay} of the month`,
					},
				]),
		{
			label: 'Default proration',
			value: isAnniversary
				? `${PRORATION_LABEL[policy.prorationMethod]} — not applied on this cycle`
				: PRORATION_LABEL[policy.prorationMethod],
		},
		{
			label: 'Immediate invoice due offset',
			value:
				policy.immediateDueDays === 0
					? 'Same day'
					: `${policy.immediateDueDays} days`,
		},
		{
			label: 'Grace period',
			value:
				policy.graceDays === 0
					? 'None — overdue on the due date'
					: `${policy.graceDays} days before an invoice is marked overdue`,
		},
	];

	const enrollment: DetailRow[] = [
		{
			label: 'Charge on enrollment',
			value: policy.chargeOnEnrollment
				? isAnniversary
					? 'On — first full cycle invoiced immediately'
					: 'On — prorated invoice issued immediately'
				: 'Off — billed on the next run',
		},
	];

	const lateFees: DetailRow[] = policy.lateFeeEnabled
		? [
				{ label: 'Late fees', value: 'On' },
				{ label: 'Type', value: LATE_FEE_TYPE_LABEL[policy.lateFeeType] },
				{
					label: 'Amount',
					value:
						policy.lateFeeType === 'PERCENT'
							? `${policy.lateFeeAmount}%`
							: formatPrice(policy.lateFeeAmount),
				},
				{
					label: 'Recurrence',
					value: LATE_FEE_RECURRENCE_LABEL[policy.lateFeeRecurrence],
				},
				{
					label: 'Maximum per invoice',
					value:
						policy.lateFeeMaxTotal == null
							? 'Uncapped'
							: formatPrice(policy.lateFeeMaxTotal),
				},
			]
		: [{ label: 'Late fees', value: 'Off' }];

	const dunning: DetailRow[] = [
		{
			label: 'Auto-suspend enrollment',
			value: daysOrDisabled(policy.autoSuspendAfterDays),
		},
		{
			label: 'Auto-cancel enrollment',
			value: daysOrDisabled(policy.autoCancelAfterDays),
		},
		{ label: 'Payment reminders', value: onOff(policy.remindersEnabled) },
	];

	const advanced: DetailRow[] = [
		{
			label: 'Consumption rule',
			value: CONSUMPTION_LABEL[policy.consumptionRule],
		},
		{ label: 'Auto-apply wallet credit', value: onOff(policy.autoApplyCredit) },
	];

	return (
		<div className="flex flex-col gap-6">
			<Section title="Billing basics" rows={basics} />
			<Section title="Enrollment" rows={enrollment} />
			<Section title="Late fees" rows={lateFees} />
			<Section title="Dunning" rows={dunning} />
			<Section title="Advanced" rows={advanced} />
		</div>
	);
}
