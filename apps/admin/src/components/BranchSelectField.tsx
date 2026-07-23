import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { FormSelect } from '@repo/ui';

import { useBranches } from '@/api/branches';
import { SHARED_BRANCH_VALUE } from '@/lib/branch';

interface BranchSelectFieldProps<T extends FieldValues> {
	control: Control<T>;
	name: FieldPath<T>;
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	/**
	 * Coerce the selection to a number before it reaches the form value — for
	 * required `branchId: number` fields. Leave off for string-valued pickers,
	 * including the shared-branch variant (`SHARED_BRANCH_VALUE` isn't a number).
	 */
	valueAsNumber?: boolean;
	/**
	 * When set, prepend a "shared across all branches" option carrying
	 * {@link SHARED_BRANCH_VALUE}. Pass the already-translated label — the label
	 * is feature-specific, so the caller owns it. Omit for a required
	 * single-branch picker. See `@/lib/branch` for the value converters.
	 */
	sharedLabel?: string;
}

/**
 * Branch picker backed by `GET /manage/branches` — the per-user accessible set,
 * already scoped by the backend (docs/auth-and-rbac.md §6). Wraps `FormSelect`,
 * so it drops into any RHF form; the caller owns the field name, label, and —
 * via `sharedLabel` — whether "shared across all branches" is offered. The
 * `useBranches` query is shared (react-query dedupes by key), so multiple
 * pickers on one screen still trigger a single fetch.
 */
export function BranchSelectField<T extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	disabled,
	valueAsNumber,
	sharedLabel,
}: BranchSelectFieldProps<T>) {
	const { data: branches = [] } = useBranches();

	const options = [
		...(sharedLabel ? [{ value: SHARED_BRANCH_VALUE, label: sharedLabel }] : []),
		...branches.map((b) => ({ value: String(b.id), label: b.name })),
	];

	return (
		<FormSelect
			control={control}
			name={name}
			label={label}
			placeholder={placeholder}
			disabled={disabled}
			valueAsNumber={valueAsNumber}
			options={options}
		/>
	);
}
