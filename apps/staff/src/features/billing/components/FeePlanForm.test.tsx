import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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
	courseId: 1,
	name: 'Monthly Tuition — IELTS',
	amount: 1_300_000,
	currency: 'UZS',
	billingCycle: 'MONTHLY',
	prorationMethod: 'SESSION',
	dueDay: 1,
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
	it('labels the amount field for a monthly plan and shows the override controls', () => {
		renderForm(
			<FeePlanForm
				mode="edit"
				open
				feePlan={MONTHLY_PLAN}
				onOpenChange={() => {}}
			/>,
		);

		expect(screen.getByLabelText('Amount (UZS) *')).toBeInTheDocument();
		expect(
			screen.getByText('Override tenant default due day'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Override tenant default proration'),
		).toBeInTheDocument();
	});

	it('labels the amount field as a per-session price and hides proration/due-day overrides', () => {
		renderForm(
			<FeePlanForm
				mode="edit"
				open
				feePlan={PER_SESSION_PLAN}
				onOpenChange={() => {}}
			/>,
		);

		expect(screen.getByLabelText('Price per session (UZS) *')).toBeInTheDocument();
		expect(
			screen.queryByText('Override tenant default due day'),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText('Override tenant default proration'),
		).not.toBeInTheDocument();
		expect(screen.getByText(/aren.t prorated/i)).toBeInTheDocument();
	});
});
