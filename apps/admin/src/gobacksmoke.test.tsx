import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from '@tanstack/react-router';
import { useGoBack } from '@/hooks/useGoBack';

function Detail() {
	const goBack = useGoBack({ to: '/groups' });
	return <button onClick={goBack}>back</button>;
}

const rootRoute = createRootRoute({ component: () => <Outlet /> });
const groupsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/groups',
	component: () => <div>GROUPS</div>,
});
const leadsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/leads',
	component: () => <div>LEADS</div>,
});
const detailRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/groups/$groupId',
	component: Detail,
});

function mount(initialEntries: string[]) {
	const router = createRouter({
		routeTree: rootRoute.addChildren([groupsRoute, leadsRoute, detailRoute]),
		history: createMemoryHistory({ initialEntries }),
	});
	render(<RouterProvider router={router} />);
	return router;
}

describe('useGoBack', () => {
	it('returns to the real previous screen, not the hardcoded parent', async () => {
		// Entered the group from Leads — the fallback (/groups) is NOT where we came from.
		const router = mount(['/leads', '/groups/7']);
		await userEvent.click(await screen.findByRole('button', { name: 'back' }));
		expect(await screen.findByText('LEADS')).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/leads');
	});

	it('preserves the previous screen search params', async () => {
		const router = mount(['/groups?page=3', '/groups/7']);
		await userEvent.click(await screen.findByRole('button', { name: 'back' }));
		await screen.findByText('GROUPS');
		expect(router.state.location.searchStr).toBe('?page=3');
	});

	it('falls back when the page was opened directly, with no history to pop', async () => {
		const router = mount(['/groups/7']);
		await userEvent.click(await screen.findByRole('button', { name: 'back' }));
		expect(await screen.findByText('GROUPS')).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/groups');
	});
});
