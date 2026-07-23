import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { isApiError } from '@repo/api-client';
import { Button, Spinner, Tabs, TabsList, TabsTrigger, Textarea, toast } from '@repo/ui';
import { useT } from '@repo/i18n';

import { useAppT } from '@/locales';

import { useLogLeadActivity } from '../api/leads.mutations';
import type { LeadLoggableActivityType } from '../api/leads.queries';
import { ACTIVITY_TYPE_OPTIONS } from '../lib/lead-options';
import {
	blankToUndefined,
	logActivitySchema,
	type LogActivityFormValues,
} from '../schemas/lead-form.schema';

interface LeadActivityFormProps {
	leadId: number;
	onDone: () => void;
	onCancel: () => void;
}

/** Inline "log a touchpoint" form shown inside the lead detail sheet. */
export function LeadActivityForm({ leadId, onDone, onCancel }: LeadActivityFormProps) {
	const t = useAppT('leads');
	const tc = useT('common');
	const schema = useMemo(() => logActivitySchema(), []);

	const form = useForm<LogActivityFormValues>({
		resolver: zodResolver(schema),
		defaultValues: { type: 'CALL', notes: '' },
	});
	const logActivity = useLogLeadActivity();
	const type = form.watch('type');

	async function onSubmit(values: LogActivityFormValues) {
		try {
			await logActivity.mutateAsync({
				id: leadId,
				type: values.type,
				notes: blankToUndefined(values.notes),
			});
			toast.success(t('activity.logged'));
			form.reset({ type: 'CALL', notes: '' });
			onDone();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('activity.failed'));
		}
	}

	return (
		<form
			onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
			className="flex flex-col gap-3 rounded-xl border bg-muted/50 p-3"
		>
			<Tabs
				value={type}
				onValueChange={(v) =>
					form.setValue('type', v as LeadLoggableActivityType)
				}
			>
				<TabsList className="w-full">
					{ACTIVITY_TYPE_OPTIONS.map((opt) => (
						<TabsTrigger key={opt.value} value={opt.value}>
							{t(`activityType.${opt.value}`)}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			<Textarea
				placeholder={t('activity.placeholder')}
				className="min-h-15"
				{...form.register('notes')}
			/>

			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="flex-1"
					onClick={onCancel}
				>
					{tc('action.cancel')}
				</Button>
				<Button
					type="submit"
					size="sm"
					className="flex-1"
					disabled={logActivity.isPending}
				>
					{logActivity.isPending && <Spinner className="mr-2 size-4" />}
					{tc('action.save')}
				</Button>
			</div>
		</form>
	);
}
