import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
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
		courseId: 1,
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
		courseId: null,
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
	it('renders the plan name, resolved course, formatted money and badges', async () => {
		renderTable(<FeePlanTable feePlans={ROWS} />);

		expect(screen.getByText('Monthly Tuition — IELTS')).toBeInTheDocument();
		await waitFor(() => expect(screen.getByText('IELTS Prep')).toBeInTheDocument());
		expect(screen.getByText(/1.300.000/)).toBeInTheDocument();
		expect(screen.getByText('Monthly')).toBeInTheDocument();
		expect(screen.getByText('Active')).toBeInTheDocument();
	});

	it('shows "Any" for a plan with no course and "Inherited" for null overrides', () => {
		renderTable(<FeePlanTable feePlans={ROWS} />);

		expect(screen.getByText('Any')).toBeInTheDocument();
		expect(screen.getByText('Per session')).toBeInTheDocument();
		expect(screen.getByText('Inactive')).toBeInTheDocument();
		// Null due-day and proration both render as "Inherited".
		expect(screen.getAllByText('Inherited')).toHaveLength(2);
	});

	it('invokes onEdit when a row is clicked', async () => {
		const onEdit = vi.fn();
		renderTable(<FeePlanTable feePlans={ROWS} onEdit={onEdit} />);

		// Let the course-list fetch settle first — clicking mid-fetch races the
		// re-render and can land on a since-replaced DOM node.
		await waitFor(() => expect(screen.getByText('IELTS Prep')).toBeInTheDocument());

		await userEvent.click(screen.getByText('Monthly Tuition — IELTS'));
		expect(onEdit).toHaveBeenCalledWith(ROWS[0]);
	});

	it('renders the empty state when there are no fee plans', () => {
		renderTable(<FeePlanTable feePlans={[]} />);
		expect(screen.getByText('No fee plans match this filter.')).toBeInTheDocument();
	});
});
