import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { BillingPolicyForm } from './BillingPolicyForm';
import { MOCK_BILLING_POLICY } from '@/test/handlers';
import type { BillingPolicyResponse } from '../api/billing-policy.queries';

function renderForm(children: ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
	);
}

const POLICY: BillingPolicyResponse = { ...MOCK_BILLING_POLICY };

describe('BillingPolicyForm', () => {
	it('renders the effective policy values', () => {
		renderForm(<BillingPolicyForm policy={POLICY} />);

		expect(screen.getByLabelText('Default due day (1–28)')).toHaveValue(5);
		expect(screen.getByLabelText('Grace days (0–60)')).toHaveValue(7);
	});

	it('reveals the late-fee sub-fields only when late fees are enabled', async () => {
		renderForm(<BillingPolicyForm policy={POLICY} />);

		// Hidden while disabled (the fixture has lateFeeEnabled: false).
		expect(screen.queryByLabelText('Late fee amount')).not.toBeInTheDocument();

		await userEvent.click(screen.getByLabelText('Enable late fees'));

		await waitFor(() =>
			expect(screen.getByLabelText('Late fee amount')).toBeInTheDocument(),
		);
	});

	it('explains the advance-billing behavior for a PREPAID tenant', () => {
		renderForm(<BillingPolicyForm policy={POLICY} />);

		expect(
			screen.getByText(/bills the current month in advance/i),
		).toBeInTheDocument();
	});

	it('explains the arrears/two-legs behavior for a POSTPAID tenant', () => {
		renderForm(<BillingPolicyForm policy={{ ...POLICY, billingMode: 'POSTPAID' }} />);

		expect(screen.getByText(/two independent legs/i)).toBeInTheDocument();
	});
});
