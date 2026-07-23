import { useState } from 'react';
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
} from '@repo/ui';

import type { StudentImportSessionView } from '@/api/student-imports/types';

import { useCommitStudentImport } from '../hooks';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

interface CommitImportDialogProps {
	tenantId: number;
	session: StudentImportSessionView;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * The point of no return: everything before this writes nothing to the center.
 * So the dialog states plainly what is about to happen — including the thing an
 * operator most needs to know, which is that nobody gets charged today.
 */
export function CommitImportDialog({
	tenantId,
	session,
	open,
	onOpenChange,
}: CommitImportDialogProps) {
	const tc = useT('common');
	const t = useAppT('imports');
	const [skipInvalidRows, setSkipInvalidRows] = useState(false);
	const { counters } = session;
	const hasInvalidRows = counters.invalidRows > 0;

	const mutation = useCommitStudentImport(tenantId, session.sessionId, {
		onSuccess: () => onOpenChange(false),
	});

	const handleOpenChange = (next: boolean) => {
		if (!next) {
			mutation.reset();
			setSkipInvalidRows(false);
		}
		onOpenChange(next);
	};

	// The backend refuses a file that still holds invalid rows unless it is told
	// explicitly to drop them — mirror that here so the button never 409s.
	const blocked = hasInvalidRows && !skipInvalidRows;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{t('commitTitle', { count: counters.validRows })}
					</DialogTitle>
					<DialogDescription>
						{t('commitDescription', { count: counters.validRows })}
					</DialogDescription>
				</DialogHeader>

				{hasInvalidRows && (
					<div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
						<p className="text-sm text-destructive">
							{t('invalidRowsWarning', { count: counters.invalidRows })}
						</p>
						<div className="flex items-center gap-2">
							<Checkbox
								id="skip-invalid"
								checked={skipInvalidRows}
								onCheckedChange={(checked) =>
									setSkipInvalidRows(checked === true)
								}
							/>
							<Label htmlFor="skip-invalid" className="text-sm">
								{t('skipInvalidLabel', { count: counters.validRows })}
							</Label>
						</div>
					</div>
				)}

				{mutation.isError && (
					<p className="text-sm text-destructive">
						{mutation.error instanceof Error
							? mutation.error.message
							: t('commitError')}
					</p>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={() => handleOpenChange(false)}>
						{tc('action.cancel')}
					</Button>
					<Button
						disabled={blocked || mutation.isPending}
						onClick={() => mutation.mutate({ skipInvalidRows })}
					>
						{mutation.isPending
							? t('starting')
							: t('commitButton', { count: counters.validRows })}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
