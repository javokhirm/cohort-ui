import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { X } from 'lucide-react';

import { Alert, AlertDescription, Button } from '@repo/ui';
import { formatDate } from '@repo/utils';

import { useAppT } from '@/locales';
import { useSessionStore } from '@/store/sessionStore';

/**
 * Dismissible "renew soon" warning, mounted once in the authed shell so it
 * shows on every screen while `expiresSoon` holds. Dismissal is local
 * component state — it clears on the next full load, there is no
 * server-side "seen" flag to persist against.
 */
export function SubscriptionBanner() {
	const subscription = useSessionStore((s) => s.subscription);
	const [dismissed, setDismissed] = useState(false);
	const t = useAppT('subscription');

	const shouldShow =
		!dismissed &&
		!!subscription?.hasAccess &&
		subscription.expiresSoon &&
		!!subscription.currentPeriodEnd;

	if (!shouldShow) return null;

	return (
		<Alert variant="warning" className="mb-4">
			<AlertDescription className="flex flex-wrap items-center justify-between gap-3">
				<span>
					{t('banner.message', {
						date: formatDate(subscription.currentPeriodEnd as string),
					})}
				</span>
				<div className="flex items-center gap-2">
					<Button asChild size="sm" variant="outline">
						<Link to="/subscription">{t('banner.renew')}</Link>
					</Button>
					<Button
						size="icon"
						variant="ghost"
						className="size-7"
						aria-label={t('banner.dismiss')}
						onClick={() => setDismissed(true)}
					>
						<X className="size-3.5" />
					</Button>
				</div>
			</AlertDescription>
		</Alert>
	);
}
