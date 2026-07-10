import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { FeePlanTable } from './FeePlanTable';
import type { FeePlanResponse } from '../api/fee-plans.queries';

function renderTable(children: ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
	);
}

const ROWS: FeePlanResponse[] = [
	{
		id: 1,
		branchId: null,
		groupCount: 2,
		name: 'Monthly Tuition — IELTS',
		amount: 1_300_000,
		currency: 'UZS',
		billingCycle: 'MONTHLY',
		prorationMethod: 'SESSION',
		dueDay: 1,
		isActive: true,
		createdAt: '2025-01-10T00:00:00Z',
		updatedAt: '2025-01-10T00:00:00Z',
	},
	{
		id: 4,
		branchId: null,
		groupCount: 0,
		name: 'Private Tutoring — Per session',
		amount: 120_000,
		currency: 'UZS',
		billingCycle: 'PER_SESSION',
		// Inherits the tenant billing policy (null overrides).
		prorationMethod: null,
		dueDay: null,
		isActive: false,
		createdAt: '2025-01-13T00:00:00Z',
		updatedAt: '2025-01-13T00:00:00Z',
	},
];

describe('FeePlanTable', () => {
	it('renders the plan name, group count, formatted money and badges', () => {
		renderTable(<FeePlanTable feePlans={ROWS} />);

		expect(screen.getByText('Monthly Tuition — IELTS')).toBeInTheDocument();
		expect(screen.getByText('2 groups')).toBeInTheDocument();
		expect(screen.getByText(/1.300.000/)).toBeInTheDocument();
		expect(screen.getByText('Monthly')).toBeInTheDocument();
		expect(screen.getByText('Active')).toBeInTheDocument();
	});

	it('shows "Not in use" for a plan no group bills on, and "Inherited" for null overrides', () => {
		renderTable(<FeePlanTable feePlans={ROWS} />);

		expect(screen.getByText('Not in use')).toBeInTheDocument();
		expect(screen.getByText('Per session')).toBeInTheDocument();
		expect(screen.getByText('Inactive')).toBeInTheDocument();
		// Null due-day and proration both render as "Inherited".
		expect(screen.getAllByText('Inherited')).toHaveLength(2);
	});

	it('singularises a lone group', () => {
		renderTable(<FeePlanTable feePlans={[{ ...ROWS[0]!, groupCount: 1 }]} />);
		expect(screen.getByText('1 group')).toBeInTheDocument();
	});

	it('invokes onEdit when a row is clicked', async () => {
		const onEdit = vi.fn();
		renderTable(<FeePlanTable feePlans={ROWS} onEdit={onEdit} />);

		await userEvent.click(screen.getByText('Monthly Tuition — IELTS'));
		expect(onEdit).toHaveBeenCalledWith(ROWS[0]);
	});

	it('renders the empty state when there are no fee plans', () => {
		renderTable(<FeePlanTable feePlans={[]} />);
		expect(screen.getByText('No fee plans match this filter.')).toBeInTheDocument();
	});
});
