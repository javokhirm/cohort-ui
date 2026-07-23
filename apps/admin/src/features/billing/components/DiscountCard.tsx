import { ArrowRight, Pencil } from 'lucide-react';

import {
	Badge,
	Card,
	cn,
	ProgressBar,
	StatusBadge,
	TONE_CLASSES,
	type StatusTone,
} from '@repo/ui';
import { formatDate } from '@repo/utils';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { Can } from '@/components/Can';

import type { DiscountResponse, DiscountType } from '../api/discounts.queries';
import { formatDiscountValue } from '../lib/discount-options';

interface DiscountCardProps {
	discount: DiscountResponse;
	/** Omit to hide the edit affordance (no `discount.manage`). */
	onEdit?: (discount: DiscountResponse) => void;
}

const TYPE_META: Record<
	DiscountType,
	{
		tone: StatusTone;
		descriptionKey: 'discountCard.percentageOff' | 'discountCard.fixedAmountOff';
	}
> = {
	PERCENTAGE: { tone: 'violet', descriptionKey: 'discountCard.percentageOff' },
	FIXED_AMOUNT: { tone: 'green', descriptionKey: 'discountCard.fixedAmountOff' },
};

function Validity({
	validFrom,
	validUntil,
}: Pick<DiscountResponse, 'validFrom' | 'validUntil'>) {
	const t = useAppT('billing');
	if (validFrom && validUntil) {
		return (
			<span className="flex items-center gap-1.5">
				{formatDate(validFrom)}
				<ArrowRight className="size-3 shrink-0" />
				{formatDate(validUntil)}
			</span>
		);
	}
	if (validFrom)
		return (
			<span>
				{t('discountCard.validFromLabel', { date: formatDate(validFrom) })}
			</span>
		);
	if (validUntil)
		return (
			<span>
				{t('discountCard.validUntilLabel', { date: formatDate(validUntil) })}
			</span>
		);
	return <span>{t('discountExtra.noExpiry')}</span>;
}

export function DiscountCard({ discount, onEdit }: DiscountCardProps) {
	const t = useAppT('billing');
	const tc = useT('common');
	const { tone, descriptionKey } = TYPE_META[discount.type];
	const capped = discount.maxUses != null;
	const usagePct = capped ? (discount.currentUses / discount.maxUses!) * 100 : 0;

	return (
		<Card className="gap-0 p-5">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<h3 className="truncate font-semibold text-foreground">
						{discount.name}
					</h3>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{t(descriptionKey)}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{discount.isActive ? (
						<StatusBadge tone="green">{tc('state.active')}</StatusBadge>
					) : (
						<StatusBadge tone="slate">{tc('state.inactive')}</StatusBadge>
					)}
					{onEdit && (
						<Can permission="discount.manage">
							<button
								type="button"
								onClick={() => onEdit(discount)}
								aria-label={t('discountCard.editAria', {
									name: discount.name,
								})}
								className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<Pencil className="size-4" />
							</button>
						</Can>
					)}
				</div>
			</div>

			<div
				className={cn(
					'mt-3 flex items-baseline gap-1.5 rounded-xl px-4 py-4',
					TONE_CLASSES[tone],
				)}
			>
				<span className="text-2xl font-extrabold tabular-nums">
					{formatDiscountValue(discount.type, discount.value)}
				</span>
				<span className="text-xs font-medium opacity-70">
					{t('discountCard.off')}
				</span>
			</div>

			<div className="mt-4 flex flex-col gap-2 text-sm">
				<div className="flex items-center justify-between gap-2">
					<span className="text-muted-foreground">
						{t('discountExtra.promoCode')}
					</span>
					{discount.code ? (
						<Badge
							variant="outline"
							className="border-primary/20 bg-primary/10 font-mono text-primary"
						>
							{discount.code}
						</Badge>
					) : (
						<span className="text-muted-foreground">—</span>
					)}
				</div>
				<div className="flex items-center justify-between gap-2">
					<span className="text-muted-foreground">
						{t('discountExtra.usage')}
					</span>
					<span className="font-semibold tabular-nums text-foreground">
						{capped
							? t('discountCard.usageCapped', {
									used: discount.currentUses,
									max: discount.maxUses,
								})
							: t('discountCard.usageUncapped', {
									count: discount.currentUses,
								})}
					</span>
				</div>
				{capped && <ProgressBar value={usagePct} tone={tone} />}
			</div>

			<div className="mt-4 flex items-center border-t border-border pt-3 text-xs text-muted-foreground">
				<Validity
					validFrom={discount.validFrom}
					validUntil={discount.validUntil}
				/>
			</div>
		</Card>
	);
}
