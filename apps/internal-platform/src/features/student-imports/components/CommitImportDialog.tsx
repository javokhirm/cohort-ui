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
					<DialogTitle>Import {counters.validRows} students?</DialogTitle>
					<DialogDescription>
						This creates {counters.validRows} enrollment
						{counters.validRows === 1 ? '' : 's'} in this center. Each student
						will be billed for the first time on their own next billing date —
						no invoices are raised now.
					</DialogDescription>
				</DialogHeader>

				{hasInvalidRows && (
					<div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
						<p className="text-sm text-destructive">
							{counters.invalidRows} row
							{counters.invalidRows === 1 ? '' : 's'} failed validation and
							cannot be imported. Fix the file and upload it again, or
							import the rest without them.
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
								Import the {counters.validRows} valid rows and leave the
								rest out
							</Label>
						</div>
					</div>
				)}

				{mutation.isError && (
					<p className="text-sm text-destructive">
						{mutation.error instanceof Error
							? mutation.error.message
							: 'Failed to start the import. Please try again.'}
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
							? 'Starting…'
							: `Import ${counters.validRows} students`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
