export function FieldRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex gap-4 border-b border-border py-3 last:border-0">
			<dt className="w-36 shrink-0 text-sm text-muted-foreground">{label}</dt>
			<dd className="flex-1 text-sm">{children}</dd>
		</div>
	);
}
