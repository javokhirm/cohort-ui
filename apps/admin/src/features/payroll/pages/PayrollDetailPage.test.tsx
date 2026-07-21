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

const MONTH = '2026-07';
/** The live PERCENT teacher in the MSW fixtures. */
const LIVE_STAFF_ID = 1;
/** The finalized FIXED teacher in the MSW fixtures. */
const FINALIZED_STAFF_ID = 2;

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

function renderDetail(staffId: number) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	render(
		<QueryClientProvider client={queryClient}>
			<PayrollDetailPage staffId={staffId} month={MONTH} />
		</QueryClientProvider>,
	);
	return { user: userEvent.setup() };
}

describe('PayrollDetailPage', () => {
	beforeEach(() => resetSession());

	it('renders the live figure — teacher, Live badge and the calculation story', async () => {
		resetSession(['payroll.read']);
		renderDetail(LIVE_STAFF_ID);

		expect(
			await screen.findByRole('heading', { name: 'Diyorbek Rustamov' }),
		).toBeInTheDocument();
		expect(screen.getByText('Live')).toBeInTheDocument();
		expect(screen.getByText(/how this is calculated/i)).toBeInTheDocument();
		// Full-precision figure and its banker's-rounded result are both shown.
		expect(screen.getByText(/banker's rounding/i)).toBeInTheDocument();
	});

	it('lists the per-student breakdown with the shared-student note', async () => {
		resetSession(['payroll.read']);
		renderDetail(LIVE_STAFF_ID);

		expect(await screen.findByText('Sardor Alimov')).toBeInTheDocument();
		expect(screen.getByText('Malika Karimova')).toBeInTheDocument();
		// Both students were taught 6 of the group's 8 completed sessions.
		expect(screen.getAllByText('6/8')).toHaveLength(2);
		expect(screen.getByText(/never double-paid/i)).toBeInTheDocument();
	});

	it('shows an empty state for a teacher with no figure this month', async () => {
		resetSession(['payroll.read']);
		renderDetail(999);

		expect(
			await screen.findByText(/no payroll figure for this teacher/i),
		).toBeInTheDocument();
	});

	it('shows the frozen snapshot meta once finalized', async () => {
		resetSession(['payroll.read']);
		renderDetail(FINALIZED_STAFF_ID);

		expect(
			await screen.findByRole('heading', { name: 'Nilufar Karimova' }),
		).toBeInTheDocument();
		expect(screen.getByText(/snapshot finalized/i)).toBeInTheDocument();
		expect(screen.getByText(/Aziz Yusupov/)).toBeInTheDocument();
	});

	it('hides Mark as paid and Unfinalize without the permissions', async () => {
		resetSession(['payroll.read']);
		renderDetail(FINALIZED_STAFF_ID);

		await screen.findByRole('heading', { name: 'Nilufar Karimova' });
		expect(
			screen.queryByRole('button', { name: /mark as paid/i }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: /unfinalize/i }),
		).not.toBeInTheDocument();
	});

	it('does not offer Mark as paid on a live row even with payroll.pay', async () => {
		resetSession(['payroll.read', 'payroll.pay']);
		renderDetail(LIVE_STAFF_ID);

		await screen.findByRole('heading', { name: 'Diyorbek Rustamov' });
		expect(
			screen.queryByRole('button', { name: /mark as paid/i }),
		).not.toBeInTheDocument();
	});

	it('settles a finalized snapshot when the user holds payroll.pay', async () => {
		resetSession(['payroll.read', 'payroll.pay']);
		const { user } = renderDetail(FINALIZED_STAFF_ID);

		await user.click(await screen.findByRole('button', { name: /mark as paid/i }));
		// Confirm in the dialog — money actions are never one-click.
		const confirm = await screen.findByRole('button', { name: /^mark as paid$/i });
		await user.click(confirm);

		await waitFor(() => expect(confirm).not.toBeDisabled());
	});

	it('records a mid-month advance on a live row with payroll.manage', async () => {
		resetSession(['payroll.read', 'payroll.manage']);
		const { user } = renderDetail(LIVE_STAFF_ID);

		expect(await screen.findByText(/mid-month advances/i)).toBeInTheDocument();
		expect(screen.getByText('cash advance')).toBeInTheDocument();

		const amount = await screen.findByPlaceholderText(/amount/i);
		await user.type(amount, '300000');
		await user.click(screen.getByRole('button', { name: /record/i }));

		await waitFor(() => expect(amount).toHaveValue(''));
	});

	it('hides the advance form without payroll.manage', async () => {
		resetSession(['payroll.read']);
		renderDetail(LIVE_STAFF_ID);

		await screen.findByText(/mid-month advances/i);
		expect(screen.queryByRole('button', { name: /record/i })).not.toBeInTheDocument();
	});
});
