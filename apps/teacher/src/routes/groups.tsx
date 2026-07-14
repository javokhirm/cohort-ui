import { LayoutGrid } from 'lucide-react';

import { EmptyState } from '@repo/ui';

/** Placeholder. Wired to `GET /teach/groups` in a follow-up. */
export function GroupsRoute() {
	return (
		<div className="mx-auto w-full max-w-5xl">
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<LayoutGrid />}
					title="No groups loaded yet"
					description="The groups you teach will appear here once this screen is wired to the teach groups endpoint."
				/>
			</div>
		</div>
	);
}
