import { Link } from '@tanstack/react-router';
import { ShieldAlert } from 'lucide-react';

import { Button, EmptyState } from '@repo/ui';
import { useAppT } from '@/locales';

export function ForbiddenPage() {
	const t = useAppT('shell');
	return (
		<div className="flex min-h-svh items-center justify-center bg-background px-6">
			<EmptyState
				icon={<ShieldAlert />}
				title={t('forbiddenTitle')}
				description={t('forbiddenDescription')}
				action={
					<Button asChild variant="outline">
						<Link to="/login">Back to sign in</Link>
					</Button>
				}
			/>
		</div>
	);
}
