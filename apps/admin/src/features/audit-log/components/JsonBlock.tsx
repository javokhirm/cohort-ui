export function JsonBlock({ value }: { value: Record<string, unknown> | null }) {
	if (!value) {
		return <span className="text-sm text-muted-foreground">—</span>;
	}
	return (
		<pre className="overflow-x-auto rounded-md bg-muted px-4 py-3 text-xs leading-relaxed">
			{JSON.stringify(value, null, 2)}
		</pre>
	);
}
