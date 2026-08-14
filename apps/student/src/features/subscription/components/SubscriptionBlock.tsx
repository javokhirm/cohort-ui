import { ShieldAlert } from 'lucide-react';

import { Card, CardContent } from '@repo/ui';
import { useT } from '@repo/i18n';
import { formatDate } from '@repo/utils';

import { useSessionStore } from '@/store/sessionStore';

/**
 * Full-screen, non-dismissible state shown when the center's subscription has
 * lapsed — a 402 on any student route, or `subscription.hasAccess === false` from
 * login/refresh. The authed layout renders this in place of the shell, so no
 * student screen is reachable and manual URL entry cannot bypass it.
 *
 * Read-only by design: a student cannot pay — only an OWNER on the admin console
 * can — so there is deliberately no renew action, only guidance to contact the
 * center's administrator. The session stays valid; this is an access state, not a
 * sign-out (logging in again succeeds and returns the same block).
 *
 * Plan name and expiry come from whichever source resolved first: the live
 * `subscription` view (login/refresh) or the 402 `subscriptionBlock` details.
 */
export function SubscriptionBlock() {
	const t = useT('subscription');
	const subscription = useSessionStore((s) => s.subscription);
	const block = useSessionStore((s) => s.subscriptionBlock);

	const planName = subscription?.plan?.name ?? block?.planName ?? null;
	const expiresOn = subscription?.currentPeriodEnd ?? block?.currentPeriodEnd ?? null;

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center bg-muted px-4 py-10">
			<Card className="w-full max-w-md">
				<CardContent className="flex flex-col items-center gap-5 px-6 py-8 text-center">
					<div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
						<ShieldAlert className="size-7" />
					</div>

					<div className="flex flex-col gap-2">
						<h1 className="text-lg font-semibold text-foreground">
							{t('expired.title')}
						</h1>
						<p className="text-sm text-muted-foreground">
							{t('expired.description')}
						</p>
					</div>

					{(planName || expiresOn) && (
						<div className="grid w-full grid-cols-2 gap-3 border-t border-border pt-5 text-left">
							{planName && (
								<div className="flex flex-col gap-1">
									<span className="text-xs text-muted-foreground">
										{t('expired.planLabel')}
									</span>
									<span className="text-sm font-semibold text-foreground">
										{planName}
									</span>
								</div>
							)}
							{expiresOn && (
								<div className="flex flex-col gap-1">
									<span className="text-xs text-muted-foreground">
										{t('expired.expiredOnLabel')}
									</span>
									<span className="text-sm font-semibold text-foreground">
										{formatDate(expiresOn)}
									</span>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
