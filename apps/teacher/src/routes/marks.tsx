import { ArrowLeft, Star } from 'lucide-react';
import { useNavigate, useParams } from '@tanstack/react-router';

import { Button, EmptyState, PageHeader } from '@repo/ui';

/**
 * Enter marks for a session's assessments (`/teach/assessments`,
 * api-reference §4.4/§4.5) — reached from a Today card's "Marks" action.
 * Scaffolded stub: navigation and the route param are wired; the score-entry
 * flow is a follow-up.
 */
export function MarksRoute() {
	const navigate = useNavigate();
	const { sessionId } = useParams({
		from: '/_authed/sessions/$sessionId/marks',
	});

	return (
		<div className="mx-auto w-full max-w-3xl">
			<PageHeader
				title="Marks"
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
					icon={<Star />}
					title="Marks are coming soon"
					description="Record each student's assessment scores here, then publish them to the group."
				/>
			</div>
		</div>
	);
}
