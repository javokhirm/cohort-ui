import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import {
	Button,
	Checkbox,
	DatePicker,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Spinner,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { useStudents } from '@/features/people/api/students.queries';

import { useEnrollStudents } from '../api/groups.mutations';
import { describeEnrollmentDateError } from '../lib/enrollment-date';

interface EnrollStudentsDialogProps {
	groupId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Student ids already enrolled — filtered out of the picker. */
	enrolledStudentIds: number[];
}

export function EnrollStudentsDialog({
	groupId,
	open,
	onOpenChange,
	enrolledStudentIds,
}: EnrollStudentsDialogProps) {
	const t = useAppT('groups');
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{t('roster.enroll')}</DialogTitle>
					<DialogDescription>{t('roster.enrollSearchHint')}</DialogDescription>
				</DialogHeader>

				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    picker state resets without a reset effect. */}
				{open && (
					<EnrollForm
						groupId={groupId}
						enrolledStudentIds={enrolledStudentIds}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function EnrollForm({
	groupId,
	enrolledStudentIds,
	onClose,
}: {
	groupId: number;
	enrolledStudentIds: number[];
	onClose: () => void;
}) {
	const t = useAppT('groups');
	const tc = useT('common');
	const [input, setInput] = useState('');
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState<number[]>([]);
	const [enrolledAt, setEnrolledAt] = useState<string | undefined>(undefined);

	const enrollStudents = useEnrollStudents();

	// Debounce the search box (async setState — not a synchronous effect write).
	useEffect(() => {
		const t = setTimeout(() => setSearch(input.trim()), 300);
		return () => clearTimeout(t);
	}, [input]);

	const { data, isLoading } = useStudents({
		status: 'ACTIVE',
		search: search || undefined,
		limit: 20,
	});
	const enrolledSet = useMemo(() => new Set(enrolledStudentIds), [enrolledStudentIds]);
	const students = (data?.rows ?? []).filter((s) => !enrolledSet.has(s.id));

	function toggle(id: number) {
		setSelected((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	}

	async function onEnroll() {
		if (!enrolledAt) return;

		try {
			await enrollStudents.mutateAsync({
				groupId,
				studentIds: selected,
				enrolledAt,
			});
			toast.success(
				`${selected.length} student${selected.length === 1 ? '' : 's'} enrolled`,
			);
			onClose();
		} catch (err) {
			const badDate = describeEnrollmentDateError(t, err);
			if (badDate) {
				toast.error(badDate);
			} else if (isApiError(err) && err.status === 409) {
				toast.error(t('roster.atCapacity'));
			} else if (isApiError(err)) {
				toast.error(err.message);
			} else {
				toast.error(tc('error.unknown'));
			}
		}
	}

	return (
		<>
			<div className="flex flex-col gap-3">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder={t('searchPlaceholder')}
						className="pl-9"
					/>
				</div>

				<div className="h-64 overflow-y-auto rounded-lg border">
					{isLoading ? (
						<div className="p-4 text-sm text-muted-foreground">
							Loading students…
						</div>
					) : students.length === 0 ? (
						<div className="p-6 text-center text-sm text-muted-foreground">
							No matching students.
						</div>
					) : (
						<div className="divide-y divide-border">
							{students.map((s) => (
								<label
									key={s.id}
									className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted"
								>
									<Checkbox
										checked={selected.includes(s.id)}
										onCheckedChange={() => toggle(s.id)}
									/>
									<div className="flex flex-col">
										<span className="text-sm font-medium">
											{s.user.firstName} {s.user.lastName}
										</span>
										<span className="font-mono text-xs text-muted-foreground">
											{s.studentCode}
										</span>
									</div>
								</label>
							))}
						</div>
					)}
				</div>

				<div className="flex flex-col gap-1.5 mt-8">
					<Label htmlFor="enrolledAt">{t('form.field.startDate')}</Label>
					<DatePicker
						id="enrolledAt"
						value={enrolledAt}
						onChange={setEnrolledAt}
						placeholder={t('form.field.startDatePlaceholder')}
						disabled={enrollStudents.isPending}
					/>
					<p className="text-xs text-muted-foreground">
						The day the student actually started. This sets their billing
						anniversary, so back-date it if you are adding them late.
					</p>
				</div>
			</div>

			<DialogFooter>
				<Button
					variant="outline"
					onClick={onClose}
					disabled={enrollStudents.isPending}
				>
					{tc('action.cancel')}
				</Button>
				<Button
					onClick={() => void onEnroll()}
					disabled={
						selected.length === 0 || !enrolledAt || enrollStudents.isPending
					}
				>
					{enrollStudents.isPending && <Spinner className="mr-2 size-4" />}
					Enroll {selected.length > 0 ? `(${selected.length})` : ''}
				</Button>
			</DialogFooter>
		</>
	);
}
