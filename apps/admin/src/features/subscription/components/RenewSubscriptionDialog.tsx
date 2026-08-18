import { useState } from 'react';

import {
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
	type RenewSubscriptionResult,
} from '../api/subscription.mutations';
import {
	useSubscriptionPlans,
	useSubscriptionQuote,
	type SubscriptionPaymentMethod,
} from '../api/subscription.queries';

const PAYMENT_METHODS: SubscriptionPaymentMethod[] = ['CLICK', 'PAYME', 'UZUM'];
const INTERVALS: BillingInterval[] = ['MONTHLY', 'ANNUAL'];

interface RenewSubscriptionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subscription: SubscriptionAccessView;
	onRenewed: (result: RenewSubscriptionResult) => void;
}

export function RenewSubscriptionDialog({
	open,
	onOpenChange,
	subscription,
	onRenewed,
}: RenewSubscriptionDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{/* Mounts fresh on each open, so its picker state resets without an effect. */}
				{open && (
					<RenewForm
						subscription={subscription}
						onClose={() => onOpenChange(false)}
						onRenewed={onRenewed}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function RenewForm({
	subscription,
	onClose,
	onRenewed,
}: {
	subscription: SubscriptionAccessView;
	onClose: () => void;
	onRenewed: (result: RenewSubscriptionResult) => void;
}) {
	const t = useAppT('subscription');
	const tc = useT('common');

	const [changePlan, setChangePlan] = useState(false);
	const [planId, setPlanId] = useState<number | null>(subscription.plan?.id ?? null);
	const [billingInterval, setBillingInterval] = useState<BillingInterval>(
		subscription.billingInterval ?? 'MONTHLY',
	);
	const [method, setMethod] = useState<SubscriptionPaymentMethod>('CLICK');

	const { data: quote, isLoading: isQuoteLoading } = useSubscriptionQuote(!changePlan);
	const { data: plans = [], isLoading: isPlansLoading } =
		useSubscriptionPlans(changePlan);
	const renew = useRenewSubscription();

	const selectedPlan = plans.find((p) => p.id === planId);
	const estimatedAmount = selectedPlan
		? billingInterval === 'MONTHLY'
			? selectedPlan.priceMonthly
			: selectedPlan.priceAnnual
		: null;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		try {
			const result = await renew.mutateAsync({
				method,
				subscriptionTierId: changePlan ? (planId ?? undefined) : undefined,
				billingInterval: changePlan ? billingInterval : undefined,
			});
			onClose();
			onRenewed(result);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('renew.failed'));
		}
	}

	return (
		<form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
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

			<div className="flex flex-col gap-1.5">
				<Label>{t('renew.method')}</Label>
				<RadioGroup
					value={method}
					onValueChange={(v) => setMethod(v as SubscriptionPaymentMethod)}
					className="grid grid-cols-2 gap-2 sm:grid-cols-3"
				>
					{PAYMENT_METHODS.map((m) => (
						<Label
							key={m}
							className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2.5 text-sm has-data-[state=checked]:border-primary"
						>
							<RadioGroupItem value={m} />
							{t(`method.${m}`)}
						</Label>
					))}
				</RadioGroup>
			</div>

			<DialogFooter>
				<Button
					type="button"
					variant="outline"
					onClick={onClose}
					disabled={renew.isPending}
				>
					{tc('action.cancel')}
				</Button>
				<Button
					type="submit"
					disabled={renew.isPending || (changePlan && planId == null)}
				>
					{renew.isPending && <Spinner className="mr-2 size-4" />}
					{t('renew.submit')}
				</Button>
			</DialogFooter>
		</form>
	);
}
