import { Button, Card, CardContent, Input, Label } from '@repo/ui';

import type { OnboardFormData } from './types';

export function SubdomainStep({
	data,
	onChange,
	onBack,
	onNext,
}: {
	data: OnboardFormData;
	onChange: (patch: Partial<OnboardFormData>) => void;
	onBack: () => void;
	onNext: () => void;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">Choose a subdomain</p>
					<p className="text-sm text-muted-foreground">
						This is where the center's staff and students will sign in.
					</p>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="subdomain">Subdomain</Label>
					<div className="flex rounded-md shadow-sm">
						<Input
							id="subdomain"
							className="rounded-r-none"
							value={data.subdomain}
							onChange={(e) =>
								onChange({
									subdomain: e.target.value
										.toLowerCase()
										.replace(/[^a-z0-9-]/g, ''),
								})
							}
							placeholder="zabon"
						/>
						<span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
							.cohort.uz
						</span>
					</div>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						Back
					</Button>
					<Button onClick={onNext} disabled={!data.subdomain.trim()}>
						Continue
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
