import { Input, Label, Switch, Tabs, TabsList, TabsTrigger } from '@repo/ui';

import type { GradingType } from '../api/grading-config.queries';
import { GRADING_TYPE_OPTIONS, gradingPreview } from '../lib/group-options';

interface GradingScaleControlProps {
	type: GradingType;
	/** Raw max-points input (string); ignored for LETTER. */
	maxPoints: string;
	allowHalf: boolean;
	onTypeChange: (type: GradingType) => void;
	onMaxPointsChange: (value: string) => void;
	onAllowHalfChange: (value: boolean) => void;
	/** Validation message for the max field. */
	maxError?: string;
	/** Unique prefix for input ids (a page may render more than one). */
	idPrefix: string;
}

/**
 * Presentational grading-scale editor shared by the create form and the group
 * detail's grading section: a segmented scale-type picker (Points / Percentage /
 * Letter), a bounded max for the numeric scales, a half-point toggle for POINTS,
 * and a live preview. Fully controlled — the parent owns the values and wiring
 * (React Hook Form on create, local state on the detail section).
 */
export function GradingScaleControl({
	type,
	maxPoints,
	allowHalf,
	onTypeChange,
	onMaxPointsChange,
	onAllowHalfChange,
	maxError,
	idPrefix,
}: GradingScaleControlProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">Scale type</span>
				<Tabs value={type} onValueChange={(v) => onTypeChange(v as GradingType)}>
					<TabsList className="w-full">
						{GRADING_TYPE_OPTIONS.map((o) => (
							<TabsTrigger key={o.value} value={o.value} className="flex-1">
								{o.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>

			{type === 'LETTER' ? (
				<p className="text-sm text-muted-foreground">
					Letter grades A–F are entered directly on the marks sheet.
				</p>
			) : (
				<div className="flex flex-col gap-1.5">
					<Label htmlFor={`${idPrefix}-grading-max`}>
						{type === 'PERCENTAGE' ? 'Maximum (%)' : 'Maximum points'}
					</Label>
					<Input
						id={`${idPrefix}-grading-max`}
						type="number"
						inputMode="numeric"
						min={1}
						value={maxPoints}
						onChange={(e) => onMaxPointsChange(e.target.value)}
						className="w-32 tabular-nums"
					/>
					{maxError && (
						<span className="text-sm text-destructive">{maxError}</span>
					)}
				</div>
			)}

			{type === 'POINTS' && (
				<div className="flex items-center justify-between">
					<Label htmlFor={`${idPrefix}-grading-half`}>
						Allow half-point scores
					</Label>
					<Switch
						id={`${idPrefix}-grading-half`}
						checked={allowHalf}
						onCheckedChange={onAllowHalfChange}
					/>
				</div>
			)}

			<div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
				Preview ·{' '}
				<span className="text-foreground">{gradingPreview(type, maxPoints)}</span>
			</div>
		</div>
	);
}
