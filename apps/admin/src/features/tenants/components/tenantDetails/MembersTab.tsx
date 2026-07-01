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
import { formatDate } from '@/lib/formatters/date';
import { avatarClass, getInitials } from '@/features/tenants/utils';

const MEMBER_STATUS_TONE: Record<string, StatusTone> = {
	ACTIVE: 'green',
	INVITED: 'blue',
	INACTIVE: 'slate',
};

const MEMBER_STATUS_LABEL: Record<string, string> = {
	ACTIVE: 'Active',
	INVITED: 'Invited',
	INACTIVE: 'Inactive',
};

const columns: ColumnDef<TenantMemberView>[] = [
	{
		id: 'user',
		header: 'User',
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
		header: 'Contact',
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
		header: 'Status',
		cell: ({ getValue }) => {
			const status = getValue<string>();
			return (
				<StatusBadge tone={MEMBER_STATUS_TONE[status] ?? 'slate'}>
					{MEMBER_STATUS_LABEL[status] ?? status}
				</StatusBadge>
			);
		},
	},
	{
		id: 'lastLogin',
		header: 'Last login',
		cell: ({ row }) => (
			<span className="text-sm text-muted-foreground">
				{row.original.user.lastLoginAt
					? formatDate(row.original.user.lastLoginAt)
					: '—'}
			</span>
		),
	},
];

export function MembersTab({ members }: { members: TenantMemberView[] }) {
	return (
		<Card className="gap-0 overflow-hidden py-0">
			<DataTable
				columns={columns}
				data={members}
				getRowId={(row) => String(row.userId)}
				emptyState={
					<div className="py-16 text-center text-sm text-muted-foreground">
						No members found.
					</div>
				}
				className="rounded-none border-0"
			/>
		</Card>
	);
}
