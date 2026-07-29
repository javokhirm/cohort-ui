import { RouterProvider } from '@tanstack/react-router';

import { router } from './router';

/**
 * App root.
 *
 * There is no boot gate here yet: the `/api/v1/portal/*` surface is unbuilt on
 * the backend, so this app has no session to restore and nothing to fetch. When
 * login lands, hold the router until the silent refresh settles — the way
 * `apps/teacher/src/App.tsx` does — so route guards never see `unknown`.
 */
export function App() {
	return <RouterProvider router={router} />;
}
