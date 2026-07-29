import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
} from '@tanstack/react-router';

import { Toaster } from '@repo/ui';

import { HomeRoute } from '@/routes/home';

const rootRoute = createRootRoute({
	component: () => (
		<>
			<Outlet />
			<Toaster position="top-right" />
		</>
	),
});

// The only route today. Auth (`/login`, `/forbidden`, the guarded layout) joins
// the tree once the portal surface exists — see the app README.
const homeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	component: HomeRoute,
});

const routeTree = rootRoute.addChildren([homeRoute]);

export const router = createRouter({
	routeTree,
	defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}
