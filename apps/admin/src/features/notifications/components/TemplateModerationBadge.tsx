import { CircleAlert, Clock, Hourglass } from 'lucide-react';

import { cn, StatusBadge, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';

import { useAppT } from '@/locales';

import type {
	TemplateModeration,
	TemplateModerationStatus,
} from '../api/notifications.queries';
import { MODERATION_TONES, needsAttention } from '../lib/moderation';

interface TemplateModerationBadgeProps {
	moderation: TemplateModeration | undefined;
	/** Compact list rows show the pill alone; the editor adds the explanation. */
	withTooltip?: boolean;
}

/**
 * The pill telling a center whether this copy can actually be sent.
 *
 * Worth a component of its own because a saved SMS template is **not** a sendable
 * one: Uzbek gateways deliver only pre-approved text, so between saving and
 * approval every message on this copy is rejected. Without this pill that gap is
 * invisible — the save looks successful and the failure surfaces much later, in
 * the outbox, as a gateway error in Russian.
 *
 * Renders nothing when the state is unknown (non-SMS channel, an unsaved draft, or
 * a center with no SMS credentials — see `moderationFor`). An absent pill means
 * "no gateway verdict applies here", which is honest; inventing a neutral
 * "unknown" pill would add noise to every Telegram and email row.
 */
export function TemplateModerationBadge({
	moderation,
	withTooltip = false,
}: TemplateModerationBadgeProps) {
	const tn = useAppT('notifications');

	if (!moderation) return null;

	const badge = (
		<StatusBadge tone={MODERATION_TONES[moderation.status]}>
			{tn(`moderation.status.${moderation.status}`)}
		</StatusBadge>
	);

	if (!withTooltip) return badge;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex">{badge}</span>
			</TooltipTrigger>
			<TooltipContent className="max-w-xs">
				{tn(`moderation.hint.${moderation.status}`)}
			</TooltipContent>
		</Tooltip>
	);
}

/** Icon + colour per blocking status. Approved has no icon — it is the norm. */
const ATTENTION_ICONS: Record<
	Exclude<TemplateModerationStatus, 'APPROVED'>,
	{ Icon: typeof Clock; className: string }
> = {
	PENDING: { Icon: Clock, className: 'text-tone-amber-fg' },
	MODERATION: { Icon: Hourglass, className: 'text-tone-blue-fg' },
	REJECTED: { Icon: CircleAlert, className: 'text-tone-red-fg' },
};

/**
 * The compact form, for the master list.
 *
 * A pill per row would not fit the 22rem pane and would mostly read "fine" — so
 * the list flags only copy that **cannot currently be sent**, as an icon with the
 * explanation on hover. Approved rows and rows with no verdict show nothing, which
 * keeps the signal meaning "this one needs you".
 */
export function TemplateModerationIcon({
	moderation,
}: Pick<TemplateModerationBadgeProps, 'moderation'>) {
	const tn = useAppT('notifications');

	// Narrows away `APPROVED` and `undefined` in one step, so the icon lookup below
	// is total rather than defensively indexed.
	if (!needsAttention(moderation)) return null;

	const { Icon, className } = ATTENTION_ICONS[moderation.status];
	const label = tn(`moderation.status.${moderation.status}`);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex shrink-0">
					<Icon aria-label={label} className={cn('size-3.5', className)} />
				</span>
			</TooltipTrigger>
			<TooltipContent className="max-w-xs">
				{tn(`moderation.hint.${moderation.status}`)}
			</TooltipContent>
		</Tooltip>
	);
}
