import { Check, UserCheck } from 'lucide-react';

import { Button, Spinner, StatusBadge } from '@repo/ui';

import { useAppT } from '@/locales';

import type { GuardianLookup } from '../api/students.queries';

type GuardianMatch = NonNullable<GuardianLookup['guardian']>;

interface GuardianMatchCardProps {
	match: GuardianMatch;
	/** True once this guardian is connected (or queued to be, on create). */
	connected: boolean;
	/** Set when the match is already a guardian of the student being edited. */
	alreadyOnThisStudent: boolean;
	connecting: boolean;
	onConnect: () => void;
}

/**
 * "Existing guardian found" — the confirmation step that keeps a sibling's
 * parent from being registered twice.
 *
 * It shows who the number resolves to and which students they already cover, so
 * the operator can tell the right Karimova from the wrong one before linking.
 * Connecting is always their explicit click: a phone match alone never links
 * anybody.
 */
export function GuardianMatchCard({
	match,
	connected,
	alreadyOnThisStudent,
	connecting,
	onConnect,
}: GuardianMatchCardProps) {
	const t = useAppT('people');

	const fullName = `${match.user.firstName} ${match.user.lastName}`.trim();
	const connectedNames = match.students
		.map((s) => `${s.firstName} ${s.lastName}`.trim())
		.filter(Boolean);

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
			<div className="flex items-start gap-2">
				<UserCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<div className="flex flex-col gap-1">
					<span className="text-sm font-semibold">
						{match.isGuardian
							? t('form.guardianLookup.foundTitle')
							: t('form.guardianLookup.foundTitleNonGuardian')}
					</span>
					<span className="text-sm font-medium">{fullName}</span>
					<span className="text-sm text-muted-foreground">
						{match.user.phone ?? '—'}
					</span>
				</div>
			</div>

			{/* Why this person is already on file. A number the center knows in
			    another capacity (staff, a student) resolves here too, and linking
			    still reuses that one identity — say so rather than implying they
			    are already a parent. */}
			<p className="text-xs text-muted-foreground">
				{match.isGuardian
					? t('form.guardianLookup.foundDescription')
					: t('form.guardianLookup.foundNonGuardian')}
			</p>

			{connectedNames.length > 0 && (
				<p className="text-xs text-muted-foreground">
					<span className="font-medium text-foreground">
						{t('form.guardianLookup.connectedStudents')}
					</span>{' '}
					{connectedNames.join(', ')}
				</p>
			)}

			{alreadyOnThisStudent ? (
				<StatusBadge tone="green">
					{t('form.guardianLookup.alreadyConnected')}
				</StatusBadge>
			) : connected ? (
				<div className="flex items-center gap-1.5 text-sm font-medium text-tone-green-fg">
					<Check className="size-4" />
					{t('form.guardianLookup.connected')}
				</div>
			) : (
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">
						{t('form.guardianLookup.connectPrompt')}
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="self-start"
						disabled={connecting}
						onClick={onConnect}
					>
						{connecting && <Spinner className="mr-2 size-4" />}
						{t('form.guardianLookup.connectAction')}
					</Button>
				</div>
			)}
		</div>
	);
}
