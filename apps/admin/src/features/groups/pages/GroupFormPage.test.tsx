import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { mockGroupDetail } from '@/test/handlers';
import { server } from '@/test/server';

import { GroupFormPage } from './GroupFormPage';

// The page navigates on submit/cancel and links back to the list; stub the
// router so it can render outside a RouterProvider.
vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => vi.fn(),
	Link: ({ children, ...props }: { children: ReactNode }) => (
		<a {...props}>{children}</a>
	),
}));

const MANAGE = 'http://localhost:5050/api/v1/manage';

/** Override PATCH /groups/:id so a test can assert the payload the form sent. */
function captureGroupUpdate() {
	const captured: { body: Record<string, unknown> | null } = { body: null };
	server.use(
		http.patch(`${MANAGE}/groups/:id`, async ({ params, request }) => {
			const detail = mockGroupDetail(Number(params['id']));
			captured.body = (await request.json()) as Record<string, unknown>;
			return HttpResponse.json({
				success: true,
				data: { ...detail, ...captured.body, updatedAt: '2026-07-02T00:00:00Z' },
				meta: { timestamp: 'test' },
			});
		}),
	);
	return captured;
}

function renderEditPage() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const group = mockGroupDetail(10);
	if (!group) throw new Error('missing fixture group 10');

	render(
		<QueryClientProvider client={queryClient}>
			<GroupFormPage mode="edit" group={group} />
		</QueryClientProvider>,
	);
	return { user: userEvent.setup() };
}

describe('GroupFormPage — edit — reschedule confirmation', () => {
	it('saves directly, without the modal, when only a safe field (capacity) changes', async () => {
		const captured = captureGroupUpdate();
		const { user } = renderEditPage();

		const capacity = await screen.findByLabelText('Capacity');
		fireEvent.change(capacity, { target: { value: '20' } });

		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		await waitFor(() => expect(captured.body).not.toBeNull());
		expect(screen.queryByText('Reschedule sessions?')).not.toBeInTheDocument();
		expect(captured.body?.capacity).toBe(20);
		expect(captured.body?.regenerateSessions).toBe(false);
	});

	it('warns before saving when the weekly schedule changes', async () => {
		const { user } = renderEditPage();

		// Fixture schedule is MON/WED/FRI — adding Saturday is a reschedule.
		await user.click(await screen.findByRole('button', { name: 'Sat' }));
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		expect(await screen.findByText('Reschedule sessions?')).toBeInTheDocument();
	});

	it('warns when a non-schedule field (start date) changes', async () => {
		const { user } = renderEditPage();

		const startDate = await screen.findByLabelText('Start date');
		fireEvent.change(startDate, { target: { value: '2025-04-01' } });
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		expect(await screen.findByText('Reschedule sessions?')).toBeInTheDocument();
	});

	it('regenerates sessions when the reschedule is confirmed', async () => {
		const captured = captureGroupUpdate();
		const { user } = renderEditPage();

		await user.click(await screen.findByRole('button', { name: 'Sat' }));
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		await screen.findByText('Reschedule sessions?');
		await user.click(screen.getByRole('button', { name: 'Save & reschedule' }));

		await waitFor(() => expect(captured.body).not.toBeNull());
		expect(captured.body?.regenerateSessions).toBe(true);
	});

	it('does not save when the reschedule is cancelled', async () => {
		const captured = captureGroupUpdate();
		const { user } = renderEditPage();

		await user.click(await screen.findByRole('button', { name: 'Sat' }));
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		await screen.findByText('Reschedule sessions?');
		await user.click(screen.getByRole('button', { name: 'Keep editing' }));

		await waitFor(() =>
			expect(screen.queryByText('Reschedule sessions?')).not.toBeInTheDocument(),
		);
		expect(captured.body).toBeNull();
	});
});
