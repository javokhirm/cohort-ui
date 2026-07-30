import { ShieldAlert } from 'lucide-react';

import { Button, EmptyState } from '@repo/ui';

import { useAuth } from '@/features/auth/hooks';
import { useAppT } from '@/locales';

/**
 * Reached when a signed-in user holds no STUDENT role — the student API would 403 every
 * request, so there is nothing to show them here.
 */
export function ForbiddenPage() {
	const t = useAppT('shell');
	const { logout } = useAuth();

	return (
		<div className="flex min-h-svh items-center justify-center bg-background px-6">
			<EmptyState
				icon={<ShieldAlert />}
				title={t('notStudentTitle')}
				description={t('notStudentDescription')}
				action={
					<Button variant="outline" onClick={logout}>
						{t('backToSignIn')}
					</Button>
				}
			/>
		</div>
	);
}
