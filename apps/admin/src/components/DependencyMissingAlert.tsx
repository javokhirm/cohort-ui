import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@repo/ui';

interface DependencyMissingAlertProps {
	/** States the fact and its consequence, e.g. "This branch has no active fee
	 * plan — a course can't be created." */
	description: string;
	/** The fix — typically a `<Link>` to where the missing resource is created. */
	action: React.ReactNode;
}

/**
 * Warns that a required field's options are empty because a prerequisite
 * resource doesn't exist yet (no fee plan, no course, no group, …). Belongs
 * at the top of the form, above the fields it blocks, so the admin doesn't
 * fill the whole thing out before discovering it can't be saved.
 */
export function DependencyMissingAlert({
	description,
	action,
}: DependencyMissingAlertProps) {
	return (
		<Alert variant="warning">
			<AlertTriangle />
			<AlertDescription className="flex flex-col items-start gap-1">
				<span>{description}</span>
				{action}
			</AlertDescription>
		</Alert>
	);
}
