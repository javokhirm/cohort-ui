import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui';

interface ProfileHeaderProps {
	fullName: string;
	initials: string;
	avatarUrl: string | null;
	studentCode: string;
}

/** The Profile screen's identity block: a large avatar over the name and student code. */
export function ProfileHeader({
	fullName,
	initials,
	avatarUrl,
	studentCode,
}: ProfileHeaderProps) {
	return (
		<div className="mb-4.5 flex flex-col items-center text-center">
			<Avatar className="size-18.5 rounded-[22px]">
				<AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
				<AvatarFallback className="rounded-[22px] text-[26px] font-bold">
					{initials}
				</AvatarFallback>
			</Avatar>
			<p className="mt-2.75 text-[18px] font-bold tracking-tight text-foreground">
				{fullName}
			</p>
			<p className="font-mono text-[12.5px] text-muted-foreground">{studentCode}</p>
		</div>
	);
}
