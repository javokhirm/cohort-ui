import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { PayrollTable } from './PayrollTable';
import type { PayrollResponse } from '../api/payroll.queries';

// TanStack Router navigate is not needed by the table, but the row-action
// dropdown lives under a QueryClient; stub the router import defensively.
vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => vi.fn(),
}));

function renderTable(children: ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
	);
}

const ROWS: PayrollResponse[] = [
	{
		id: 1,
		branchId: 1,
		staffId: 1,
		staff: { id: 1, staffCode: 'STF-001', firstName: 'Diyorbek', lastName: 'Rustamov' },
		periodStart: '2026-06-01',
		periodEnd: '2026-06-30',
		grossAmount: 8_000_000,
		deductions: 960_000,
		netAmount: 7_040_000,
		status: 'DRAFT',
		breakdown: { hoursTaught: 72 },
		approvedByUserId: null,
		paidAt: null,
		createdAt: '2026-06-30T00:00:00Z',
		updatedAt: '2026-06-30T00:00:00Z',
	},
];

describe('PayrollTable', () => {
	it('renders staff, formatted net money and the status badge', () => {
		renderTable(<PayrollTable payrolls={ROWS} canManage={false} />);

		expect(screen.getByText('Diyorbek Rustamov')).toBeInTheDocument();
		// formatMoney(7_040_000, 'UZS', 'uz-UZ') → "7 040 000 soʻm"
		// (grouped digits + localized currency symbol; separators are non-breaking).
		const net = screen.getByText((text) => /7.040.000/.test(text));
		expect(net).toBeInTheDocument();
		expect(screen.getByText('Draft')).toBeInTheDocument();
		expect(screen.getByText('72')).toBeInTheDocument();
	});

	it('hides the actions column when the user cannot manage payroll', () => {
		renderTable(<PayrollTable payrolls={ROWS} canManage={false} />);
		expect(
			screen.queryByRole('button', { name: /payroll actions/i }),
		).not.toBeInTheDocument();
	});

	it('shows the actions menu when the user can manage payroll', () => {
		renderTable(<PayrollTable payrolls={ROWS} canManage />);
		expect(
			screen.getByRole('button', { name: /payroll actions/i }),
		).toBeInTheDocument();
	});
});
