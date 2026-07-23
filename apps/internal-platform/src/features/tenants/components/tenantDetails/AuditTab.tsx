import { Card, CardContent } from '@repo/ui';

import { useAppT } from '@/locales';

export function AuditTab() {
	const t = useAppT('audit');
	return (
		<Card>
			<CardContent className="py-12 text-center text-sm text-muted-foreground">
				{t('perTenantSoon')}
			</CardContent>
		</Card>
	);
}
