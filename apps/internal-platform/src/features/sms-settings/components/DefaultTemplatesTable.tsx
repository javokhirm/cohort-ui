import {
	StatusBadge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@repo/ui';

import { useAppT } from '@/locales';
import type {
	PlatformDefaultTemplate,
	PlatformTemplateModeration,
} from '@/api/platformSms/types';
import { indexPlatformModeration, PLATFORM_MODERATION_TONES } from '../lib/moderation';

interface DefaultTemplatesTableProps {
	templates: PlatformDefaultTemplate[];
	moderation: PlatformTemplateModeration[] | undefined;
}

/**
 * Every code-owned SMS default, one row per `(code, locale)`, with its current
 * moderation state on the platform account. Read-only: defaults are code-owned
 * and change only in a backend deploy (see `docs/api-reference.md` §3.18) — this
 * table exists so an operator can see what actually ships and whether it can
 * currently send, not to edit it.
 */
export function DefaultTemplatesTable({
	templates,
	moderation,
}: DefaultTemplatesTableProps) {
	const t = useAppT('smsSettings');
	const index = indexPlatformModeration(moderation);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>{t('defaults.column.code')}</TableHead>
					<TableHead>{t('defaults.column.locale')}</TableHead>
					<TableHead>{t('defaults.column.body')}</TableHead>
					<TableHead>{t('defaults.column.status')}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{templates.map((template) => {
					const state = index.get(template.body);
					return (
						<TableRow key={`${template.code}:${template.locale}`}>
							<TableCell className="font-medium">{template.code}</TableCell>
							<TableCell className="text-muted-foreground uppercase">
								{template.locale}
							</TableCell>
							<TableCell className="max-w-md truncate text-sm text-muted-foreground">
								{template.body}
							</TableCell>
							<TableCell>
								{state ? (
									<StatusBadge
										tone={PLATFORM_MODERATION_TONES[state.status]}
									>
										{t(`moderation.status.${state.status}`)}
									</StatusBadge>
								) : (
									<span className="text-xs text-muted-foreground">
										{t('moderation.status.UNKNOWN')}
									</span>
								)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
