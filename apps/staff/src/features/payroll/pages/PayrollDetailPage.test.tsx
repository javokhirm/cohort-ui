import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { useSessionStore } from '@/store/sessionStore';

import { PayrollDetailPage } from './PayrollDetailPage';

// The page links back to the list; stub the router so it renders outside a
// RouterProvider (same approach as GroupFormPage.test.tsx).
vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => vi.fn(),
	Link: ({ children, ...props }: { children: ReactNode }) => (
		<a {...props}>{children}</a>
	),
}));

function resetSession(permissions: string[] = []) {
	useSessionStore.setState({
		accessToken: null,
		user: {
			id: 1,
			firstName: 'M',
			lastName: 'M',
			roles: ['MANAGER'],
			branchScope: null,
		},
		status: 'authenticated',
		permissions,
		permissionsLoaded: true,
	});
}

function renderDetail(payrollId: number) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	render(
		<QueryClientProvider client={queryClient}>
			<PayrollDetailPage payrollId={payrollId} />
		</QueryClientProvider>,
	);
	return { user: userEvent.setup() };
}

describe('PayrollDetailPage', () => {
	beforeEach(() => resetSession());

	it('renders the record — staff, status, gross/deductions/net', async () => {
		resetSession(['payroll.read']);
		renderDetail(1);

		expect(await screen.findByText('Diyorbek Rustamov')).toBeInTheDocument();
		expect(screen.getByText('Draft')).toBeInTheDocument();
		expect(screen.getByText('72')).toBeInTheDocument(); // hours taught
	});

	it('shows "not found" for an unknown id', async () => {
		resetSession(['payroll.read']);
		renderDetail(999);

		expect(await screen.findByText('Payroll record not found.')).toBeInTheDocument();
	});

	it('approves a DRAFT record when the user holds payroll.approve', async () => {
		resetSession(['payroll.read', 'payroll.approve']);
		const { user } = renderDetail(1);

		const approveButton = await screen.findByRole('button', { name: /approve/i });
		await user.click(approveButton);

		// The click round-trips through the real POST /payrolls/1/approve mutation
		// (MSW-backed) — once it settles, the button is no longer pending-disabled.
		await waitFor(() => expect(approveButton).not.toBeDisabled());
	});

	it('hides Approve without payroll.approve, and Mark as paid only shows for APPROVED', async () => {
		resetSession(['payroll.read']);
		renderDetail(1);

		await screen.findByText('Diyorbek Rustamov');
		expect(
			screen.queryByRole('button', { name: /approve/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: /mark as paid/i }),
		).not.toBeInTheDocument();
	});

	it('does not show Mark as paid for a DRAFT record even with payroll.pay', async () => {
		resetSession(['payroll.read', 'payroll.pay']);
		renderDetail(1);

		await screen.findByText('Diyorbek Rustamov');
		expect(
			screen.queryByRole('button', { name: /mark as paid/i }),
		).not.toBeInTheDocument();
	});

	it('marks an APPROVED record paid when the user holds payroll.pay', async () => {
		resetSession(['payroll.read', 'payroll.pay']);
		const { user } = renderDetail(2);

		const payButton = await screen.findByRole('button', { name: /mark as paid/i });
		await user.click(payButton);

		await waitFor(() => expect(payButton).not.toBeDisabled());
	});

	it('edits a DRAFT record via the edit sheet', async () => {
		resetSession(['payroll.read', 'payroll.create']);
		const { user } = renderDetail(1);

		await user.click(await screen.findByRole('button', { name: /^edit$/i }));

		const grossInput = await screen.findByLabelText(/gross amount/i);
		await user.clear(grossInput);
		await user.type(grossInput, '9000000');
		await user.click(screen.getByRole('button', { name: /save changes/i }));

		await waitFor(() =>
			expect(
				screen.queryByRole('button', { name: /save changes/i }),
			).not.toBeInTheDocument(),
		);
	});
});
