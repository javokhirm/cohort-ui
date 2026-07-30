import { ChevronRight, CircleHelp, Moon, Sun } from 'lucide-react';

import { Button, toast, useTheme } from '@repo/ui';
import { useT } from '@repo/i18n';

import { useAppT } from '@/locales';

interface PreferencesCardProps {
	/** Front-desk number, from the student's own branch or the center it belongs to. */
	contactPhone: string | null;
}

/**
 * The Preferences card: the theme switch and a Help & contact row.
 *
 * Help & contact surfaces the center's front-desk number in a toast — what the design does,
 * and the only thing the contract supports: there is no help endpoint and no help screen.
 */
export function PreferencesCard({ contactPhone }: PreferencesCardProps) {
	const t = useAppT('profile');
	const tCommon = useT('common');
	const { isDark, toggleTheme } = useTheme();

	function showContact() {
		toast(t('contactTitle'), {
			description: contactPhone
				? t('contactDescription', { phone: contactPhone })
				: t('contactUnavailable'),
		});
	}

	return (
		<div className="mb-4.5 rounded-[15px] border border-border bg-card px-3.5 py-1.5 shadow-xs">
			<Button
				variant="ghost"
				onClick={toggleTheme}
				className="h-auto w-full justify-start gap-2.75 rounded-none border-b border-border px-0 py-3.25 hover:bg-transparent"
			>
				<span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-muted text-muted-foreground [&>svg]:size-4">
					{isDark ? <Moon /> : <Sun />}
				</span>
				<span className="flex-1 text-left text-[13.5px] font-semibold text-foreground">
					{t('theme')}
				</span>
				<span className="text-[12.5px] font-semibold text-muted-foreground">
					{isDark ? tCommon('theme.dark') : tCommon('theme.light')}
				</span>
			</Button>

			<Button
				variant="ghost"
				onClick={showContact}
				className="h-auto w-full justify-start gap-2.75 rounded-none px-0 py-3.25 hover:bg-transparent"
			>
				<span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-muted text-muted-foreground [&>svg]:size-4">
					<CircleHelp />
				</span>
				<span className="flex-1 text-left text-[13.5px] font-semibold text-foreground">
					{t('helpAndContact')}
				</span>
				<span className="flex shrink-0 items-center">
					<ChevronRight className="size-3.75 text-muted-foreground" />
				</span>
			</Button>
		</div>
	);
}
