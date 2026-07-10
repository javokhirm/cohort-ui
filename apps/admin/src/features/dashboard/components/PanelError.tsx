import { AlertTriangle } from 'lucide-react';

import { Button } from '@repo/ui';

import { PanelCard } from './PanelCard';

/** A panel's error state: a short message and a retry button. */
export function PanelError({ title, onRetry }: { title: string; onRetry: () => void }) {
	return (
		<PanelCard title={title}>
			<div className="flex flex-col items-center gap-3 py-8 text-center">
				<span className="flex size-10 items-center justify-center rounded-xl bg-tone-red-bg text-tone-red-fg">
					<AlertTriangle className="size-5" />
				</span>
				<p className="text-sm text-muted-foreground">Couldn’t load this panel.</p>
				<Button variant="outline" size="sm" onClick={onRetry}>
					Retry
				</Button>
			</div>
		</PanelCard>
	);
}
