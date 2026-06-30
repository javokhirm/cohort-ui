import {
	Avatar,
	AvatarFallback,
	Card,
	StatusBadge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	cn,
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

export function MembersTab({ members }: { members: TenantMemberView[] }) {
	return (
		<Card className="gap-0 overflow-hidden py-0">
			{members.length === 0 ? (
				<div className="py-16 text-center text-sm text-muted-foreground">
					No members found.
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Contact</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Last login</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{members.map((member) => (
							<TableRow key={member.userId}>
								<TableCell>
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
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{member.user.phone}
									{member.user.email && (
										<span className="ml-1 text-xs">
											· {member.user.email}
										</span>
									)}
								</TableCell>
								<TableCell>
									<StatusBadge
										tone={
											MEMBER_STATUS_TONE[member.status] ?? 'slate'
										}
									>
										{MEMBER_STATUS_LABEL[member.status] ??
											member.status}
									</StatusBadge>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{member.user.lastLoginAt
										? formatDate(member.user.lastLoginAt)
										: '—'}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</Card>
	);
}
