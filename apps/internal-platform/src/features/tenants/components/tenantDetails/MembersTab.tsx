import {
	Avatar,
	AvatarFallback,
	Card,
	DataTable,
	StatusBadge,
	cn,
	type ColumnDef,
} from '@repo/ui';
import type { StatusTone } from '@repo/ui';

import type { TenantMemberView } from '@/api/tenants/types';
import { formatDate } from '@repo/utils';
import { avatarClass, getInitials } from '@/features/tenants/utils';
import { useAppT } from '@/locales';

const MEMBER_STATUS_TONE: Record<string, StatusTone> = {
	ACTIVE: 'green',
	INVITED: 'blue',
	INACTIVE: 'slate',
};

/** Localized member-status label — keeps the enum→key mapping type-safe. */
function memberStatusLabel(
	t: ReturnType<typeof useAppT<'tenants'>>,
	status: string,
): string {
	switch (status) {
		case 'ACTIVE':
			return t('memberStatus.active');
		case 'INVITED':
			return t('memberStatus.invited');
		case 'INACTIVE':
			return t('memberStatus.inactive');
		default:
			return status;
	}
}

/**
 * Built per render rather than held at module scope: the headers are
 * user-facing, so they must re-resolve when the language changes.
 */
function buildColumns(
	t: ReturnType<typeof useAppT<'tenants'>>,
	tu: ReturnType<typeof useAppT<'users'>>,
): ColumnDef<TenantMemberView>[] {
	return [
		{
			id: 'user',
			header: tu('column.user'),
			cell: ({ row }) => {
				const member = row.original;
				return (
					<div className="flex items-center gap-2.5">
						<Avatar className="size-7 shrink-0">
							<AvatarFallback
								className={cn(
									'text-xs font-semibold',
									avatarClass(member.user.id),
								)}
							>
								{getInitials(
									`${member.user.firstName} ${member.user.lastName}`,
								)}
							</AvatarFallback>
						</Avatar>
						<span className="font-medium">
							{member.user.firstName} {member.user.lastName}
						</span>
					</div>
				);
			},
		},
		{
			id: 'contact',
			header: t('column.contact'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.user.phone}
					{row.original.user.email && (
						<span className="ml-1 text-xs">· {row.original.user.email}</span>
					)}
				</span>
			),
		},
		{
			accessorKey: 'status',
			header: tu('column.status'),
			cell: ({ getValue }) => {
				const status = getValue<string>();
				return (
					<StatusBadge tone={MEMBER_STATUS_TONE[status] ?? 'slate'}>
						{memberStatusLabel(t, status)}
					</StatusBadge>
				);
			},
		},
		{
			id: 'lastLogin',
			header: tu('column.lastLogin'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.user.lastLoginAt
						? formatDate(row.original.user.lastLoginAt)
						: '—'}
				</span>
			),
		},
	];
}

export function MembersTab({ members }: { members: TenantMemberView[] }) {
	const t = useAppT('tenants');
	const tu = useAppT('users');
	return (
		<Card className="gap-0 overflow-hidden py-0">
			<DataTable
				columns={buildColumns(t, tu)}
				data={members}
				getRowId={(row) => String(row.userId)}
				emptyState={
					<div className="py-16 text-center text-sm text-muted-foreground">
						{t('membersEmpty')}
					</div>
				}
				className="rounded-none border-0"
			/>
		</Card>
	);
}
