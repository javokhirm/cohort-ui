import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
	CheckCircle2,
	Edit,
	FileText,
	GraduationCap,
	PlayCircle,
	XCircle,
} from 'lucide-react';

import { ActionsMenu, ConfirmDialog, toast, type ActionsMenuItem } from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { useT } from '@repo/i18n';

import { useAppT } from '@/locales';
import { usePermissions } from '@/features/auth/hooks';

import type { GroupDetail, GroupStatus } from '../api/groups.queries';
import { useUpdateGroup } from '../api/groups.mutations';
import { GROUP_STATUS_TRANSITIONS, isTerminalGroupStatus } from '../lib/group-options';
import { GradingScaleDialog } from './GradingScaleDialog';

/** A status change that closes the group's calendar, so it needs confirming. */
type TerminalTarget = Extract<GroupStatus, 'COMPLETED' | 'CANCELLED'>;

interface GroupActionsProps {
	group: GroupDetail;
}

/**
 * The group screen's actions: Edit, the status changes, and the cross-link into
 * this group's invoices — one `ActionsMenu`, matching `StudentDetailPage` and
 * `StaffDetailPage` (Edit is the menu's first item there too, with no separate
 * button beside it).
 *
 * Status used to be reachable only as a bare select inside the six-section edit
 * form — four steps for the single most common change, and with **no warning**
 * even though entering `COMPLETED`/`CANCELLED` cancels every class the group has
 * not held yet (api-reference.md §3.7). Here each change is an explicit verb and
 * the two destructive ones are confirmed by name. The edit form keeps its select.
 */
export function GroupActions({ group }: GroupActionsProps) {
	const t = useAppT('groups');
	const tc = useT('common');
	const navigate = useNavigate();
	const { can } = usePermissions();
	const updateGroup = useUpdateGroup();

	// The status awaiting confirmation; `null` when nothing is pending.
	const [pending, setPending] = useState<TerminalTarget | null>(null);
	const [gradingScaleOpen, setGradingScaleOpen] = useState(false);

	const transitions = GROUP_STATUS_TRANSITIONS[group.status];
	const canUpdate = can('group.update');

	async function changeStatus(status: GroupStatus) {
		try {
			await updateGroup.mutateAsync({ id: group.id, status });
			toast.success(t('statusChange.done'));
			setPending(null);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tc('error.unknown'));
		}
	}

	function onSelectStatus(status: GroupStatus) {
		if (isTerminalGroupStatus(status)) {
			setPending(status as TerminalTarget);
			return;
		}
		void changeStatus(status);
	}

	const items: ActionsMenuItem[] = [
		{
			label: t('edit'),
			icon: Edit,
			onClick: () =>
				void navigate({
					to: '/groups/$groupId/edit',
					params: { groupId: String(group.id) },
				}),
			hidden: !canUpdate,
		},
		{
			label: t('actions.gradingScale'),
			icon: GraduationCap,
			onClick: () => setGradingScaleOpen(true),
			hidden: !canUpdate,
		},
		'separator',
		{
			label: t('actions.markActive'),
			icon: PlayCircle,
			onClick: () => onSelectStatus('ACTIVE'),
			hidden: !canUpdate || !transitions.includes('ACTIVE'),
		},
		{
			label: t('actions.markCompleted'),
			icon: CheckCircle2,
			onClick: () => onSelectStatus('COMPLETED'),
			hidden: !canUpdate || !transitions.includes('COMPLETED'),
		},
		{
			label: t('actions.cancelGroup'),
			icon: XCircle,
			variant: 'destructive',
			onClick: () => onSelectStatus('CANCELLED'),
			hidden: !canUpdate || !transitions.includes('CANCELLED'),
		},
		'separator',
		{
			label: t('actions.viewInvoices'),
			icon: FileText,
			onClick: () =>
				void navigate({ to: '/invoices', search: { groupId: group.id } }),
			hidden: !can('invoice.read'),
		},
	];

	return (
		<>
			<ActionsMenu label={t('detail.actionsLabel')} items={items} />

			<ConfirmDialog
				open={pending !== null}
				onOpenChange={(open) => {
					if (!open) setPending(null);
				}}
				title={pending ? t(`statusChange.${pending}.title`) : ''}
				description={pending ? t(`statusChange.${pending}.description`) : ''}
				confirmLabel={pending ? t(`statusChange.${pending}.confirm`) : ''}
				cancelLabel={tc('action.cancel')}
				variant="destructive"
				loading={updateGroup.isPending}
				onConfirm={() => {
					if (pending) void changeStatus(pending);
				}}
			/>

			<GradingScaleDialog
				open={gradingScaleOpen}
				onOpenChange={setGradingScaleOpen}
				groupId={group.id}
			/>
		</>
	);
}
