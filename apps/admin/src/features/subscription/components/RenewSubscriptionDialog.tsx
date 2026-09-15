import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Spinner,
	toast,
} from '@repo/ui';
import {
	isApiError,
	type BillingInterval,
	type SubscriptionAccessView,
} from '@repo/api-client';
import { formatDate, formatPrice } from '@repo/utils';
import { useT } from '@repo/i18n';

import { useAppT } from '@/locales';

import {
	useRenewSubscription,
	type RenewSubscriptionInput,
	type RenewSubscriptionResult,
} from '../api/subscription.mutations';
import { useSubscriptionPlans, useSubscriptionQuote } from '../api/subscription.queries';
import { openCheckoutWindow, submitCheckoutForm } from '../lib/payme-checkout';

const INTERVALS: BillingInterval[] = ['MONTHLY', 'ANNUAL'];

/**
 * How long the dialog stays locked waiting for Payme. Past it the flow is no
 * longer "active" — an abandoned checkout must not strand the admin in a modal
 * with no way out, and the settlement still lands on its own whenever it
 * arrives (the webhook restores access server-side regardless of this screen).
 */
const SETTLEMENT_TIMEOUT_MS = 10 * 60 * 1000;

interface RenewSubscriptionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subscription: SubscriptionAccessView;
	/**
	 * The started payment. Owned by the page because it also drives the
	 * settlement poll there; `null` until the admin commits.
	 */
	intent: RenewSubscriptionResult | null;
	onStarted: (intent: RenewSubscriptionResult) => void;
}

/**
 * The whole payment flow: pick what to buy, hand off to Payme, wait for the
 * settlement. Deliberately a modal and not a route — the admin never leaves the
 * subscription screen, and **while the payment is in flight the modal is
 * locked**: no close button, no Esc, no click-outside. It closes when the
 * server confirms the period moved, or once we stop waiting.
 */
export function RenewSubscriptionDialog({
	open,
	onOpenChange,
	subscription,
	intent,
	onStarted,
}: RenewSubscriptionDialogProps) {
	const t = useAppT('subscription');
	// Which payment we gave up waiting for, by its settlement key — so a second
	// attempt starts its own wait without an effect resetting a boolean.
	const [timedOutKey, setTimedOutKey] = useState<string | null>(null);
	const [popupBlocked, setPopupBlocked] = useState(false);
	const renew = useRenewSubscription();

	const timedOut = intent != null && timedOutKey === intent.idempotencyKey;
	const locked = renew.isPending || (intent != null && !timedOut);

	useEffect(() => {
		if (!intent) return;
		const key = intent.idempotencyKey;
		const timer = window.setTimeout(() => setTimedOutKey(key), SETTLEMENT_TIMEOUT_MS);
		return () => window.clearTimeout(timer);
	}, [intent]);

	async function handleSubmit(input: RenewSubscriptionInput) {
		// Opened here, inside the click — after the await below the gesture is
		// spent and the browser blocks the tab.
		const checkoutWindow = openCheckoutWindow();
		setPopupBlocked(checkoutWindow == null);
		try {
			const result = await renew.mutateAsync(input);
			if (!result.checkoutForm && !result.checkoutUrl) {
				// The invoice exists but Payme isn't configured for this
				// deployment, so nothing can settle it. Better an unpaid invoice
				// (same as an abandoned checkout) than a locked wait that can
				// never end.
				checkoutWindow?.close();
				toast.error(t('renew.unavailable'));
				return;
			}
			onStarted(result);
			if (checkoutWindow) sendToCheckout(checkoutWindow, result);
		} catch (err) {
			checkoutWindow?.close();
			toast.error(isApiError(err) ? err.message : t('renew.failed'));
		}
	}

	/** Re-opens checkout from a fresh click, for a blocked or closed tab. */
	function handleReopen() {
		if (!intent) return;
		const checkoutWindow = openCheckoutWindow();
		setPopupBlocked(checkoutWindow == null);
		if (checkoutWindow) sendToCheckout(checkoutWindow, intent);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next && locked) return;
				onOpenChange(next);
			}}
		>
			<DialogContent
				showCloseButton={!locked}
				onEscapeKeyDown={(e) => {
					if (locked) e.preventDefault();
				}}
				onInteractOutside={(e) => {
					if (locked) e.preventDefault();
				}}
			>
				{intent ? (
					<AwaitingPayment
						intent={intent}
						timedOut={timedOut}
						popupBlocked={popupBlocked}
						onReopen={handleReopen}
						onClose={() => onOpenChange(false)}
					/>
				) : (
					/* Mounts fresh on each open, so its picker state resets without an effect. */
					open && (
						<RenewForm
							subscription={subscription}
							isSubmitting={renew.isPending}
							onSubmit={handleSubmit}
							onCancel={() => onOpenChange(false)}
						/>
					)
				)}
			</DialogContent>
		</Dialog>
	);
}

/** Prefers the POST form — it is the only one carrying the fiscal receipt detail. */
function sendToCheckout(
	checkoutWindow: Window,
	intent: Pick<RenewSubscriptionResult, 'checkoutForm' | 'checkoutUrl'>,
): void {
	if (intent.checkoutForm) {
		submitCheckoutForm(intent.checkoutForm);
	} else if (intent.checkoutUrl) {
		checkoutWindow.location.href = intent.checkoutUrl;
	}
}

function RenewForm({
	subscription,
	isSubmitting,
	onSubmit,
	onCancel,
}: {
	subscription: SubscriptionAccessView;
	isSubmitting: boolean;
	onSubmit: (input: RenewSubscriptionInput) => void;
	onCancel: () => void;
}) {
	const t = useAppT('subscription');
	const tc = useT('common');

	const [changePlan, setChangePlan] = useState(false);
	const [planId, setPlanId] = useState<number | null>(subscription.plan?.id ?? null);
	const [billingInterval, setBillingInterval] = useState<BillingInterval>(
		subscription.billingInterval ?? 'MONTHLY',
	);

	const { data: quote, isLoading: isQuoteLoading } = useSubscriptionQuote(!changePlan);
	const { data: plans = [], isLoading: isPlansLoading } =
		useSubscriptionPlans(changePlan);

	const selectedPlan = plans.find((p) => p.id === planId);
	const estimatedAmount = selectedPlan
		? billingInterval === 'MONTHLY'
			? selectedPlan.priceMonthly
			: selectedPlan.priceAnnual
		: null;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		onSubmit({
			subscriptionTierId: changePlan ? (planId ?? undefined) : undefined,
			billingInterval: changePlan ? billingInterval : undefined,
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<DialogHeader>
				<DialogTitle>{t('renew.dialogTitle')}</DialogTitle>
				<DialogDescription>{t('renew.dialogDescription')}</DialogDescription>
			</DialogHeader>

			<RadioGroup
				value={changePlan ? 'change' : 'keep'}
				onValueChange={(v) => setChangePlan(v === 'change')}
				className="grid grid-cols-1 gap-2 sm:grid-cols-2"
			>
				<Label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-data-[state=checked]:border-primary">
					<RadioGroupItem value="keep" />
					{t('renew.keepPlan')}
				</Label>
				<Label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-data-[state=checked]:border-primary">
					<RadioGroupItem value="change" />
					{t('renew.changePlan')}
				</Label>
			</RadioGroup>

			{changePlan ? (
				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-col gap-1.5">
						<Label>{t('renew.plan')}</Label>
						{isPlansLoading ? (
							<Skeleton className="h-9 w-full" />
						) : (
							<Select
								value={planId != null ? String(planId) : undefined}
								onValueChange={(v) => setPlanId(Number(v))}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{plans.map((plan) => (
										<SelectItem key={plan.id} value={String(plan.id)}>
											{plan.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
					<div className="flex flex-col gap-1.5">
						<Label>{t('renew.interval')}</Label>
						<Select
							value={billingInterval}
							onValueChange={(v) =>
								setBillingInterval(v as BillingInterval)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{INTERVALS.map((i) => (
									<SelectItem key={i} value={i}>
										{t(`interval.${i}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			) : null}

			<div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
				{changePlan ? (
					estimatedAmount != null ? (
						<>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">
									{t('renew.quoteAmount')}
								</span>
								<span className="font-semibold tabular-nums">
									{formatPrice(estimatedAmount)} {subscription.currency}
								</span>
							</div>
							<p className="mt-1.5 text-xs text-muted-foreground">
								{t('renew.estimatedNote')}
							</p>
						</>
					) : (
						<Skeleton className="h-5 w-full" />
					)
				) : isQuoteLoading || !quote ? (
					<Skeleton className="h-10 w-full" />
				) : (
					<>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">
								{t('renew.quoteAmount')}
							</span>
							<span className="font-semibold tabular-nums">
								{formatPrice(quote.amount)} {quote.currency}
							</span>
						</div>
						<p className="mt-1.5 text-xs text-muted-foreground">
							{formatDate(quote.periodStart)} –{' '}
							{formatDate(quote.periodEnd)}
						</p>
						{quote.restarted && (
							<p className="mt-1 text-xs text-tone-amber-fg">
								{t('renew.restartedNote')}
							</p>
						)}
					</>
				)}
			</div>

			{/* Payme is the only gateway on offer, so this states the method
			    rather than asking for it — there is nothing to choose. */}
			<div className="flex items-center justify-between gap-2 text-sm">
				<span className="text-muted-foreground">{t('renew.method')}</span>
				<span className="font-semibold">{t('method.PAYME')}</span>
			</div>

			<DialogFooter>
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isSubmitting}
				>
					{tc('action.cancel')}
				</Button>
				<Button
					type="submit"
					disabled={isSubmitting || (changePlan && planId == null)}
				>
					{isSubmitting && <Spinner className="mr-2 size-4" />}
					{t('renew.submit')}
				</Button>
			</DialogFooter>
		</form>
	);
}

/**
 * The locked half of the flow. Shows what is being paid and waits — access is
 * restored by the settlement webhook, never by anything this screen does, so
 * there is nothing here to confirm or retry, only the checkout tab to re-open.
 */
function AwaitingPayment({
	intent,
	timedOut,
	popupBlocked,
	onReopen,
	onClose,
}: {
	intent: RenewSubscriptionResult;
	timedOut: boolean;
	popupBlocked: boolean;
	onReopen: () => void;
	onClose: () => void;
}) {
	const t = useAppT('subscription');
	const tc = useT('common');

	return (
		<div className="flex flex-col gap-5">
			<DialogHeader>
				<DialogTitle>
					{t(timedOut ? 'renew.timedOutTitle' : 'renew.awaitingTitle')}
				</DialogTitle>
				<DialogDescription>
					{t(
						timedOut
							? 'renew.timedOutDescription'
							: 'renew.awaitingDescription',
					)}
				</DialogDescription>
			</DialogHeader>

			<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">
						{t('renew.quoteAmount')}
					</span>
					<span className="font-semibold tabular-nums">
						{formatPrice(intent.payment.amount)} {intent.payment.currency}
					</span>
				</div>
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>{t('active.period')}</span>
					<span>
						{formatDate(intent.invoice.periodStart)} –{' '}
						{formatDate(intent.invoice.periodEnd)}
					</span>
				</div>
			</div>

			{popupBlocked && (
				<Alert variant="warning">
					<AlertDescription>{t('renew.popupBlocked')}</AlertDescription>
				</Alert>
			)}

			{!timedOut && (
				<p className="flex items-center gap-2 text-sm text-muted-foreground">
					<Spinner className="size-3.5 shrink-0" />
					{t('renew.doNotClose')}
				</p>
			)}

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onReopen}>
					<ExternalLink className="mr-2 size-4" />
					{t('renew.reopenCheckout')}
				</Button>
				{timedOut && (
					<Button type="button" onClick={onClose}>
						{tc('action.close')}
					</Button>
				)}
			</DialogFooter>
		</div>
	);
}
