import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/lib/auth/session-store';
import { VALID } from '@/test/handlers';
import { LoginForm } from './login-form';

function renderForm() {
	const onAuthenticated = vi.fn();
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	render(
		<QueryClientProvider client={queryClient}>
			<LoginForm onAuthenticated={onAuthenticated} />
		</QueryClientProvider>,
	);
	return { onAuthenticated, user: userEvent.setup() };
}

async function submitCredentials(
	user: ReturnType<typeof userEvent.setup>,
	password: string,
) {
	await user.type(screen.getByLabelText('Work email'), VALID.email);
	await user.type(screen.getByLabelText('Password'), password);
	await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

async function enterOtp(user: ReturnType<typeof userEvent.setup>, code: string) {
	const cells = screen.getAllByRole('textbox');
	await user.click(cells[0]);
	await user.paste(code);
	await user.click(screen.getByRole('button', { name: /verify/i }));
}

describe('LoginForm', () => {
	it('signs in through the credentials → OTP flow', async () => {
		const { onAuthenticated, user } = renderForm();

		await submitCredentials(user, VALID.password);
		await screen.findByText(/two-factor authentication/i);
		await enterOtp(user, VALID.code);

		await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
		const state = useSessionStore.getState();
		expect(state.status).toBe('authenticated');
		expect(state.accessToken).toBe('access-token-1');
	});

	it('shows an error and stays on step 1 for invalid credentials', async () => {
		const { onAuthenticated, user } = renderForm();

		await submitCredentials(user, 'wrong-password');

		expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument();
		expect(onAuthenticated).not.toHaveBeenCalled();
		expect(useSessionStore.getState().status).not.toBe('authenticated');
	});

	it('shows an error and stays on step 2 for an invalid OTP', async () => {
		const { onAuthenticated, user } = renderForm();

		await submitCredentials(user, VALID.password);
		await screen.findByText(/two-factor authentication/i);
		await enterOtp(user, '000000');

		expect(await screen.findByText(/invalid or expired code/i)).toBeInTheDocument();
		expect(onAuthenticated).not.toHaveBeenCalled();
		expect(useSessionStore.getState().status).not.toBe('authenticated');
	});
});
