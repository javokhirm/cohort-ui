import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { FeePlanForm } from './FeePlanForm';
import type { FeePlanResponse } from '../api/fee-plans.queries';

function renderForm(children: ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
	);
}

const MONTHLY_PLAN: FeePlanResponse = {
	id: 1,
	branchId: null,
	groupCount: 2,
	name: 'Monthly Tuition — IELTS',
	amount: 1_300_000,
	currency: 'UZS',
	billingCycle: 'MONTHLY',
	isActive: true,
	createdAt: '2026-01-01T00:00:00Z',
	updatedAt: '2026-01-01T00:00:00Z',
};

const PER_SESSION_PLAN: FeePlanResponse = {
	...MONTHLY_PLAN,
	id: 4,
	name: 'Private Tutoring — Per session',
	billingCycle: 'PER_SESSION',
};

describe('FeePlanForm (edit)', () => {
	it('labels the amount field for a monthly plan', () => {
		renderForm(
			<FeePlanForm
				mode="edit"
				open
				feePlan={MONTHLY_PLAN}
				onOpenChange={() => {}}
			/>,
		);

		expect(screen.getByLabelText('Amount (UZS) *')).toBeInTheDocument();
	});

	it('labels the amount field as a per-session price', () => {
		renderForm(
			<FeePlanForm
				mode="edit"
				open
				feePlan={PER_SESSION_PLAN}
				onOpenChange={() => {}}
			/>,
		);

		expect(screen.getByLabelText('Price per session (UZS) *')).toBeInTheDocument();
	});

	it('offers no way to override the billing policy, and says where the terms come from', () => {
		// The plan once carried per-plan due-day and proration overrides. They are
		// gone — the policy decides for every plan — so the form must expose no
		// control that implies otherwise.
		renderForm(
			<FeePlanForm
				mode="edit"
				open
				feePlan={MONTHLY_PLAN}
				onOpenChange={() => {}}
			/>,
		);

		expect(screen.queryByText(/override/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/due day/i)).not.toBeInTheDocument();
		expect(
			screen.queryByText(/proration \(mid-month joins\)/i),
		).not.toBeInTheDocument();
		expect(screen.getByText(/cannot be changed per plan/i)).toBeInTheDocument();
	});

	it('lists the groups billing on the plan, and offers no course picker', async () => {
		renderForm(
			<FeePlanForm
				mode="edit"
				open
				feePlan={MONTHLY_PLAN}
				onOpenChange={() => {}}
			/>,
		);

		expect(screen.getByText('Groups using this plan')).toBeInTheDocument();
		// A plan is standalone — courses point at it, never the other way round.
		expect(screen.queryByLabelText('Course')).not.toBeInTheDocument();
		await waitFor(() =>
			expect(screen.getByText('IELTS Prep — Morning')).toBeInTheDocument(),
		);
	});
});
