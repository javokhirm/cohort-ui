import {
	Button,
	Card,
	StatusBadge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@repo/ui';

import type { TenantBranchView } from '@/api/tenants/types';

export function BranchesTab({ branches }: { branches: TenantBranchView[] }) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button size="sm" disabled>
					+ Add branch
				</Button>
			</div>
			<Card className="gap-0 overflow-hidden py-0">
				{branches.length === 0 ? (
					<div className="py-16 text-center text-sm text-muted-foreground">
						No branches found.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Branch</TableHead>
								<TableHead>Code</TableHead>
								<TableHead>Contact</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{branches.map((branch) => (
								<TableRow key={branch.id}>
									<TableCell>
										<div className="flex items-center gap-1.5">
											<span className="font-medium">
												{branch.name}
											</span>
											{branch.isMain && (
												<span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
													Main
												</span>
											)}
										</div>
										{branch.address && (
											<p className="text-xs text-muted-foreground">
												{branch.address}
											</p>
										)}
									</TableCell>
									<TableCell className="font-mono text-sm text-muted-foreground">
										{branch.code}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{branch.phone ?? branch.email ?? '—'}
									</TableCell>
									<TableCell>
										<StatusBadge
											tone={branch.isActive ? 'green' : 'slate'}
										>
											{branch.isActive ? 'Active' : 'Inactive'}
										</StatusBadge>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>
		</div>
	);
}
