import { useState } from 'react';

import {
	Button,
	Input,
	Label,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Skeleton,
	Switch,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
} from '@repo/ui';

import type { GradingType } from '../api/marks.queries';
import { useGradingConfig, type GradingConfig } from '../api/grading-config.queries';
import {
	type SaveGradingConfigInput,
	useSetGradingConfig,
} from '../api/grading-config.mutations';

interface GradingScaleSheetProps {
	groupId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const TYPE_TABS: { value: GradingType; label: string }[] = [
	{ value: 'POINTS', label: 'Points' },
	{ value: 'PERCENTAGE', label: 'Percentage' },
	{ value: 'LETTER', label: 'Letter' },
];

/** The pending form's config, for the live preview line. */
function previewLabel(type: GradingType, maxPoints: string): string {
	switch (type) {
		case 'POINTS':
			return `Daily points · max ${maxPoints || '—'}`;
		case 'PERCENTAGE':
			return `Percentage · 0–${maxPoints || '100'}`;
		case 'LETTER':
			return 'Letter grade · A–F';
	}
}

/** A sensible default max when switching into a numeric scale. */
function defaultMax(type: GradingType): string {
	return type === 'PERCENTAGE' ? '100' : '10';
}

/**
 * The "Grading scale" bottom sheet (EduCore TEACH marks, §1.1) — pick a scale
 * type (Points / Percentage / Letter) and its options, then save. Switching the
 * scale is immutable on the backend: it inserts a new active config and leaves
 * marks already entered under the old one intact. The form seeds from the active
 * config; it is remounted (via `key`) whenever the config changes, so its state
 * initializes from props without a synchronizing effect.
 */
export function GradingScaleSheet({
	groupId,
	open,
	onOpenChange,
}: GradingScaleSheetProps) {
	const configQuery = useGradingConfig(groupId, open);
	const setConfig = useSetGradingConfig(groupId);
	const current = configQuery.data?.current ?? null;

	const onSave = (input: SaveGradingConfigInput) =>
		setConfig.mutate(input, {
			onSuccess: () => {
				toast.success('Grading scale updated');
				onOpenChange(false);
			},
		});

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
				<SheetHeader>
					<SheetTitle>Grading scale</SheetTitle>
					<SheetDescription>
						How daily marks are entered for this group.
					</SheetDescription>
				</SheetHeader>

				{configQuery.isPending ? (
					<div className="px-4 pb-4">
						<Skeleton className="h-40 w-full rounded-xl" />
					</div>
				) : (
					// `current` is null on a group that has never had a scale set. The
					// form seeds from the backend's default in that case and POSTs the
					// first config — before, this branch rendered a skeleton forever,
					// leaving such a group with no way to get a scale at all.
					<GradingScaleForm
						key={current?.id ?? 'new'}
						current={current}
						submitting={setConfig.isPending}
						onSave={onSave}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}

interface GradingScaleFormProps {
	/** The active config, or `null` on a group that has never had one set. */
	current: GradingConfig | null;
	submitting: boolean;
	onSave: (input: SaveGradingConfigInput) => void;
}

/**
 * The scale-picker form, seeded once at mount — from the active config, or from
 * the backend's default (Points, max 10) when the group has none yet.
 */
function GradingScaleForm({ current, submitting, onSave }: GradingScaleFormProps) {
	const seedType = current?.type ?? 'POINTS';
	const [type, setType] = useState<GradingType>(seedType);
	const [maxPoints, setMaxPoints] = useState(
		current?.maxPoints != null ? String(current.maxPoints) : defaultMax(seedType),
	);
	const [allowHalf, setAllowHalf] = useState(current?.allowHalf ?? false);

	const onSelectType = (next: GradingType) => {
		setType(next);
		if (next !== 'LETTER' && maxPoints.trim() === '') setMaxPoints(defaultMax(next));
		if (next !== 'POINTS') setAllowHalf(false);
	};

	const numericMax = Number(maxPoints);
	const numericInvalid = type !== 'LETTER' && !(numericMax > 0);

	const submit = () => {
		const input: SaveGradingConfigInput = { type };
		if (type !== 'LETTER') input.maxPoints = numericMax;
		if (type === 'POINTS') input.allowHalf = allowHalf;
		onSave(input);
	};

	return (
		<>
			<div className="flex flex-col gap-5 px-4">
				<div className="flex flex-col gap-2">
					<Label className="text-muted-foreground">Scale type</Label>
					<Tabs
						value={type}
						onValueChange={(v) => onSelectType(v as GradingType)}
					>
						<TabsList className="w-full">
							{TYPE_TABS.map((t) => (
								<TabsTrigger
									key={t.value}
									value={t.value}
									className="flex-1"
								>
									{t.label}
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
					<div className="flex flex-col gap-2">
						<Label htmlFor="grading-max" className="text-muted-foreground">
							{type === 'PERCENTAGE' ? 'Maximum (%)' : 'Maximum points'}
						</Label>
						<Input
							id="grading-max"
							type="number"
							inputMode="numeric"
							min={1}
							value={maxPoints}
							onChange={(e) => setMaxPoints(e.target.value)}
							className="w-32 tabular-nums"
						/>
					</div>
				)}

				{type === 'POINTS' && (
					<div className="flex items-center justify-between">
						<Label htmlFor="grading-half" className="text-foreground">
							Allow half-point scores
						</Label>
						<Switch
							id="grading-half"
							checked={allowHalf}
							onCheckedChange={setAllowHalf}
						/>
					</div>
				)}

				<div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
					Preview ·{' '}
					<span className="text-foreground">
						{previewLabel(type, maxPoints)}
					</span>
				</div>
			</div>

			<SheetFooter>
				<Button onClick={submit} disabled={numericInvalid || submitting}>
					Save grading scale
				</Button>
			</SheetFooter>
		</>
	);
}
