import { Link } from '@tanstack/react-router';

import { Button } from '@repo/ui';

export function CenteredNotice({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center gap-4 py-24 text-center">
			<p className="text-muted-foreground">{message}</p>
			<Link
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				to={'/audit-log' as any}
			>
				<Button variant="outline">← Audit Log</Button>
			</Link>
		</div>
	);
}
