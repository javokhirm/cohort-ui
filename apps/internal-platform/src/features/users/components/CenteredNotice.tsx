import { Link } from '@tanstack/react-router';

import { Button } from '@repo/ui';

export function CenteredNotice({
	message,
	children,
}: {
	message: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center gap-4 py-24 text-center">
			<p className="text-muted-foreground">{message}</p>
			{children ?? (
				<Link to="/users">
					<Button variant="outline">← User directory</Button>
				</Link>
			)}
		</div>
	);
}
