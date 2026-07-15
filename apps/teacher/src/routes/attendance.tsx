import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { useNavigate, useParams } from '@tanstack/react-router';

import { Button, EmptyState, PageHeader } from '@repo/ui';

/**
 * Take attendance for a session (`GET`/`POST /teach/sessions/:id/attendances`,
 * api-reference §4.3) — reached from a Today card's "Take attendance" action.
 * Scaffolded stub: navigation and the route param are wired; the roster-marking
 * flow (the design's attendance sheet) is a follow-up.
 */
export function AttendanceRoute() {
	const navigate = useNavigate();
	const { sessionId } = useParams({
		from: '/_authed/sessions/$sessionId/attendance',
	});

	return (
		<div className="mx-auto w-full max-w-3xl">
			<PageHeader
				title="Take attendance"
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
					icon={<ClipboardCheck />}
					title="Attendance is coming soon"
					description="Mark each student present, absent, or late here — one tap per row, saved in a batch."
				/>
			</div>
		</div>
	);
}
