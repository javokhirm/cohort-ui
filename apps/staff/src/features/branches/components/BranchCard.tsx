import { MapPin, Pencil, Phone } from 'lucide-react';

import { Card, StatusBadge } from '@repo/ui';

import type { Branch } from '@/api/branches';

interface BranchCardProps {
	branch: Branch;
	onEdit: (branch: Branch) => void;
}

/** A short avatar-style code (first three letters of the short code, uppercased). */
function shortCode(code: string): string {
	return (
		code
			.replace(/[^a-z0-9]/gi, '')
			.slice(0, 3)
			.toUpperCase() || '—'
	);
}

export function BranchCard({ branch, onEdit }: BranchCardProps) {
	return (
		<Card className="gap-0 p-5">
			<div className="flex items-start gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold tracking-wide text-primary">
					{shortCode(branch.code)}
				</span>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h3 className="truncate font-semibold text-foreground">
							{branch.name}
						</h3>
						{branch.isMain && (
							<span className="rounded-md bg-tone-amber-bg px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-tone-amber-fg">
								Main
							</span>
						)}
					</div>
					{branch.timezone && (
						<p className="mt-0.5 font-mono text-xs text-muted-foreground">
							{branch.timezone}
						</p>
					)}
				</div>

				<div className="flex shrink-0 items-center gap-2">
					{branch.isActive ? (
						<StatusBadge tone="green">Active</StatusBadge>
					) : (
						<StatusBadge tone="slate">Inactive</StatusBadge>
					)}
					<button
						type="button"
						onClick={() => onEdit(branch)}
						aria-label={`Edit ${branch.name}`}
						className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<Pencil className="size-4" />
					</button>
				</div>
			</div>

			<div className="mt-4 flex flex-col gap-1.5 text-sm text-muted-foreground">
				<span className="flex items-center gap-2">
					<MapPin className="size-3.5 shrink-0" />
					<span className="truncate">{branch.address ?? '—'}</span>
				</span>
				<span className="flex items-center gap-2">
					<Phone className="size-3.5 shrink-0" />
					<span className="truncate">{branch.phone ?? '—'}</span>
				</span>
			</div>
		</Card>
	);
}
