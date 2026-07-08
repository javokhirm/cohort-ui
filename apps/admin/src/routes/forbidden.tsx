import { Link } from '@tanstack/react-router';
import { ShieldAlert } from 'lucide-react';

import { Button, EmptyState } from '@repo/ui';

export function ForbiddenPage() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-background px-6">
			<EmptyState
				icon={<ShieldAlert />}
				title="Not permitted"
				description="You don't have permission to access this page."
				action={
					<Button asChild variant="outline">
						<Link to="/login">Back to sign in</Link>
					</Button>
				}
			/>
		</div>
	);
}
