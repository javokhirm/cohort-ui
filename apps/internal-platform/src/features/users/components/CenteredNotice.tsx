import { Link } from '@tanstack/react-router';

import { Button } from '@repo/ui';

import { useAppT } from '@/locales';

export function CenteredNotice({
	message,
	children,
}: {
	message: string;
	children?: React.ReactNode;
}) {
	const t = useAppT('users');
	return (
		<div className="flex flex-col items-center gap-4 py-24 text-center">
			<p className="text-muted-foreground">{message}</p>
			{children ?? (
				<Link to="/users">
					<Button variant="outline">← {t('backToList')}</Button>
				</Link>
			)}
		</div>
	);
}
