import { GraduationCap } from 'lucide-react';

import { EmptyState } from '@repo/ui';

import { useAppT } from '@/locales';

/**
 * Placeholder landing screen — the app shell is wired, the screens are not.
 * Nothing to fetch until the backend ships `/api/v1/portal/*`.
 */
export function HomeRoute() {
	const t = useAppT('shell');

	return (
		<div className="flex min-h-svh items-center justify-center bg-background px-6">
			<EmptyState
				icon={<GraduationCap />}
				title={t('placeholderTitle')}
				description={t('placeholderDescription')}
			/>
		</div>
	);
}
