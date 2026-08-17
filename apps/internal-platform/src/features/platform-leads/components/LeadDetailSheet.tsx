import {
	DetailRows,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	type DetailRow,
} from '@repo/ui';

import { formatDateTime } from '@repo/utils';
import type { PlatformLead } from '@/api/platformLeads/types';
import { useAppT } from '@/locales';

import { platformLeadSourceLabel } from '../constants';

/**
 * A single lead's detail. Rendered from the row already fetched by the list —
 * `GET /super-admin/platform-leads` returns every field the list needs
 * (including the full `message`), so no separate detail request is made here.
 */
export function LeadDetailSheet({
	lead,
	open,
	onOpenChange,
}: {
	lead: PlatformLead | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const t = useAppT('leads');

	const rows: DetailRow[] = lead
		? [
				{ label: t('detail.email'), value: lead.email },
				{ label: t('detail.phone'), value: lead.phone ?? '—' },
				{ label: t('detail.center'), value: lead.centerName ?? '—' },
				{
					label: t('detail.source'),
					value: platformLeadSourceLabel(t, lead.source),
				},
				{ label: t('detail.createdAt'), value: formatDateTime(lead.createdAt) },
			]
		: [];

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
				<SheetHeader>
					<SheetTitle>{lead?.name ?? t('detail.title')}</SheetTitle>
					<SheetDescription>{t('detail.subtitle')}</SheetDescription>
				</SheetHeader>

				{lead && (
					<div className="flex flex-1 flex-col gap-5 px-4 pb-4">
						<DetailRows rows={rows} />

						{lead.message && (
							<div className="flex flex-col gap-1.5">
								<span className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
									{t('detail.message')}
								</span>
								<p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm whitespace-pre-wrap">
									{lead.message}
								</p>
							</div>
						)}
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
