import { Checkbox, cn } from '@repo/ui';
import type { PermissionCatalog, RoleView } from '@/api/roles/types';

interface PermissionMatrixProps {
	roles: RoleView[];
	catalog: PermissionCatalog;
	onToggle: (roleName: string, permissionCode: string, checked: boolean) => void;
	savingRole: string | null;
}

export function PermissionMatrix({
	roles,
	catalog,
	onToggle,
	savingRole,
}: PermissionMatrixProps) {
	const permissionSet = new Map<string, Set<string>>();
	for (const role of roles) {
		permissionSet.set(role.name, new Set(role.permissions));
	}

	return (
		<div className="overflow-x-auto rounded-lg border border-border">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/40">
						<th className="sticky left-0 bg-muted/40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Permission
						</th>
						{roles.map((role) => (
							<th
								key={role.name}
								className="min-w-[88px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
							>
								{role.name}
								{!role.editable && (
									<span className="ml-1 text-[10px] font-normal normal-case text-muted-foreground/60">
										locked
									</span>
								)}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{catalog.groups.map((group) => (
						<>
							<tr key={`group-${group.domain}`} className="border-b border-border bg-muted/20">
								<td
									colSpan={roles.length + 1}
									className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
								>
									{group.domain}
								</td>
							</tr>
							{group.permissions.map((perm, idx) => (
								<tr
									key={perm.code}
									className={cn(
										'border-b border-border transition-colors hover:bg-muted/10',
										idx === group.permissions.length - 1 && 'border-b-0',
									)}
								>
									<td className="sticky left-0 bg-background px-4 py-3">
										<div className="flex flex-col">
											<span className="font-medium text-foreground">
												{perm.description}
											</span>
											<code className="mt-0.5 text-[11px] text-muted-foreground">
												{perm.code}
											</code>
										</div>
									</td>
									{roles.map((role) => {
										const granted = permissionSet.get(role.name)?.has(perm.code) ?? false;
										const isSaving = savingRole === role.name;
										return (
											<td key={role.name} className="px-4 py-3 text-center">
												<Checkbox
													checked={granted}
													disabled={!role.editable || isSaving}
													aria-label={`${role.name}: ${perm.description}`}
													onCheckedChange={(checked) =>
														onToggle(role.name, perm.code, checked === true)
													}
													className={cn(
														'mx-auto',
														!role.editable && 'cursor-not-allowed opacity-50',
													)}
												/>
											</td>
										);
									})}
								</tr>
							))}
						</>
					))}
				</tbody>
			</table>
		</div>
	);
}
