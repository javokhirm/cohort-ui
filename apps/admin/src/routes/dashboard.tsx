import { LayoutDashboard } from 'lucide-react';

import { EmptyState, Spinner } from '@repo/ui';
import { useAuth, useOperator } from '@/features/auth/hooks';

/**
 * Authenticated landing. Minimal by design — this pass ships the shell + auth
 * only. It does exercise the protected surface end-to-end via `GET /admin/me`
 * (bearer token → envelope unwrap), proving the authed client works.
 */
export function DashboardPage() {
	const { user } = useAuth();
	const operator = useOperator();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-xl font-semibold">
					Welcome{user ? `, ${user.firstName}` : ''}
				</h1>
				<p className="text-sm text-muted-foreground">
					{operator.isLoading ? (
						<span className="inline-flex items-center gap-2">
							<Spinner className="size-3.5" /> Loading your profile…
						</span>
					) : operator.data ? (
						<>Signed in as {operator.data.email ?? operator.data.phone}</>
					) : (
						'Platform super-admin console.'
					)}
				</p>
			</div>

			<div className="rounded-xl border border-border bg-card">
				<EmptyState
					icon={<LayoutDashboard />}
					title="Dashboard coming soon"
					description="Tenants, revenue, and platform metrics will live here once their endpoints are wired into the console."
				/>
			</div>
		</div>
	);
}
