import { useRef, useState } from 'react';
import { Button, Card, Input } from '@repo/ui';

import { downloadImportTemplate } from '@/api/student-imports/student-imports.mutations';
import { IMPORT_COLUMNS } from '@/api/student-imports/types';
import type { StudentImportSessionView } from '@/api/student-imports/types';

import { useUploadStudentImport } from '../hooks';
import { useAppT } from '@/locales';

interface UploadImportCardProps {
	tenantId: number;
	onUploaded: (session: StudentImportSessionView) => void;
}

/**
 * Phase one: pick a CSV and have it checked. Nothing here writes to the center —
 * the upload produces a report, and the operator decides what to do with it.
 */
export function UploadImportCard({ tenantId, onUploaded }: UploadImportCardProps) {
	const t = useAppT('imports');
	const [file, setFile] = useState<File | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const mutation = useUploadStudentImport(tenantId, {
		onSuccess: (session) => {
			setFile(null);
			if (inputRef.current) inputRef.current.value = '';
			onUploaded(session);
		},
	});

	return (
		<Card className="gap-4 p-5">
			<div className="flex flex-col gap-1">
				<h3 className="text-sm font-semibold">{t('uploadTitle')}</h3>
				<p className="text-sm text-muted-foreground">{t('uploadSubtitle')}</p>
			</div>

			<div className="rounded-lg border border-border bg-muted/40 p-3">
				<p className="mb-2 text-xs font-medium text-muted-foreground">
					{t('columns')}
				</p>
				<code className="block break-all font-mono text-xs text-muted-foreground">
					{IMPORT_COLUMNS.join(',')}
				</code>
				<p className="mt-2 text-xs text-muted-foreground">
					<strong className="font-medium text-foreground">
						nextBillingDate
					</strong>{' '}
					{t('nextBillingHint')}
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Input
					ref={inputRef}
					type="file"
					accept=".csv,text/csv"
					className="max-w-xs"
					onChange={(event) => setFile(event.target.files?.[0] ?? null)}
				/>
				<Button
					disabled={!file || mutation.isPending}
					onClick={() => file && mutation.mutate(file)}
				>
					{mutation.isPending ? t('checking') : t('uploadAndCheck')}
				</Button>
				<Button variant="outline" onClick={downloadImportTemplate}>
					{t('downloadTemplate')}
				</Button>
			</div>

			{mutation.isError && (
				<p className="text-sm text-destructive">
					{mutation.error instanceof Error
						? mutation.error.message
						: t('uploadError')}
				</p>
			)}
		</Card>
	);
}
