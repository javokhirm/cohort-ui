import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { isApiError } from '@repo/api-client';
import { Button, Spinner, Tabs, TabsList, TabsTrigger, Textarea, toast } from '@repo/ui';

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
	const form = useForm<LogActivityFormValues>({
		resolver: zodResolver(logActivitySchema),
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
			toast.success('Activity logged');
			form.reset({ type: 'CALL', notes: '' });
			onDone();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : 'Failed to log activity.');
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
							{opt.label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			<Textarea
				placeholder="What happened?"
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
					Cancel
				</Button>
				<Button
					type="submit"
					size="sm"
					className="flex-1"
					disabled={logActivity.isPending}
				>
					{logActivity.isPending && <Spinner className="mr-2 size-4" />}
					Save
				</Button>
			</div>
		</form>
	);
}
