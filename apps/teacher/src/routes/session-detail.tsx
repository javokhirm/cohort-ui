import { ArrowLeft, CalendarClock } from 'lucide-react';
import { useNavigate, useParams } from '@tanstack/react-router';

import { Button, EmptyState, PageHeader } from '@repo/ui';

/**
 * Session detail (`GET /teach/sessions/:id`, api-reference §4.1) — reached from a
 * Today card. Scaffolded stub: navigation and the route param are wired, the
 * full detail + roster view is a follow-up that will match the design's session
 * screen.
 */
export function SessionDetailRoute() {
	const navigate = useNavigate();
	const { sessionId } = useParams({ from: '/_authed/sessions/$sessionId' });

	return (
		<div className="mx-auto w-full max-w-3xl">
			<PageHeader
				title="Session"
				description={`Session #${sessionId}`}
				actions={
					<Button
						variant="outline"
						size="sm"
						onClick={() => void navigate({ to: '/' })}
					>
						<ArrowLeft className="size-4" />
						Back to today
					</Button>
				}
			/>

			<div className="mt-5 rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<CalendarClock />}
					title="Session detail is coming soon"
					description="The full session view — roster, topic, and status — will live here."
				/>
			</div>
		</div>
	);
}
