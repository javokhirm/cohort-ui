import { ShieldAlert } from 'lucide-react';

import { Button, EmptyState } from '@repo/ui';

import { useAuth } from '@/features/auth/hooks';

/**
 * Reached when a signed-in user holds no TEACHER role — the teach API would
 * 403 every request, so there is nothing to show them here.
 */
export function ForbiddenPage() {
	const { logout } = useAuth();

	return (
		<div className="flex min-h-svh items-center justify-center bg-background px-6">
			<EmptyState
				icon={<ShieldAlert />}
				title="This console is for teachers"
				description="Your account doesn't hold a teacher role. Sign in with a teacher account, or use the admin console instead."
				action={
					<Button variant="outline" onClick={logout}>
						Back to sign in
					</Button>
				}
			/>
		</div>
	);
}
