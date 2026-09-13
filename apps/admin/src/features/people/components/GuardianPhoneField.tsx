import { useEffect } from 'react';
import type {
	Control,
	FieldValues,
	Path,
	PathValue,
	UseFormSetValue,
} from 'react-hook-form';
import { Search } from 'lucide-react';

import { FieldGroup, FormInput, FormPhoneInput, FormSelect, Spinner } from '@repo/ui';
import { isValidUzPhone } from '@repo/utils';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppT } from '@/locales';

import { useGuardianLookup } from '../api/students.queries';
import type { GuardianLookupState } from '../schemas/student-form.schema';
import { GuardianMatchCard } from './GuardianMatchCard';

/** How long the operator must stop typing before the number goes to the server. */
const LOOKUP_DEBOUNCE_MS = 400;

/** Option table holds values only — labels resolve at render (conventions.md §7). */
const GUARDIAN_RELATION_OPTIONS = [
	{ value: 'father' },
	{ value: 'mother' },
	{ value: 'guardian' },
] as const;

/**
 * The form fields this component drives. Every host schema contributes them via
 * `guardianConnectFields`, so the generic below only has to know they exist.
 */
interface GuardianFormShape extends FieldValues {
	guardianPhone?: string;
	guardianName?: string;
	guardianRelation?: 'mother' | 'father' | 'guardian';
	guardianLookupState: GuardianLookupState;
	connectedGuardianUserId?: number;
}

interface GuardianPhoneFieldProps<T extends GuardianFormShape> {
	control: Control<T>;
	setValue: UseFormSetValue<T>;
	/** Live value of `guardianPhone` (the host already watches it). */
	phone: string;
	/** Live value of `guardianRelation`. */
	relation: 'mother' | 'father' | 'guardian' | undefined;
	/** Live value of `connectedGuardianUserId`. */
	connectedGuardianUserId: number | undefined;
	/**
	 * Confirm the match. On **create** this just records the choice — the link
	 * is written after the student exists. On **edit** it performs the link
	 * immediately, which is why it may be async.
	 */
	onConnect: (guardianUserId: number) => void | Promise<void>;
	connecting?: boolean;
	/**
	 * Guardian user ids already linked to the student being edited, so a number
	 * that resolves to one of them reads "already connected" instead of
	 * offering a link that would 409.
	 */
	linkedGuardianUserIds?: number[];
	/**
	 * Show the new-guardian fields even with the phone left blank.
	 *
	 * On the student form a blank number means "no guardian", so there is
	 * nothing to ask. The Add Guardian dialog exists only to add one, and the
	 * backend allows a guardian with no number at all (a parent reachable only
	 * through the other), so it opts in — there is no lookup to run, and such a
	 * guardian is always a new person.
	 */
	allowPhonelessGuardian?: boolean;
}

/**
 * **Parent / guardian phone** — the operator's fast path from a number to the
 * right guardian.
 *
 * One number, three outcomes: nobody here holds it (describe the new guardian),
 * somebody does (confirm and connect them), or they already cover this student
 * (nothing to do). The point is that a household of siblings resolves to ONE
 * guardian record instead of one per child, which is why the lookup runs before
 * a name is ever asked for.
 *
 * Reports what it learns into `guardianLookupState` so the host's Zod schema can
 * block a save that would link somebody off an unconfirmed phone match.
 */
export function GuardianPhoneField<T extends GuardianFormShape>({
	control,
	setValue,
	phone,
	relation,
	connectedGuardianUserId,
	onConnect,
	connecting = false,
	linkedGuardianUserIds = [],
	allowPhonelessGuardian = false,
}: GuardianPhoneFieldProps<T>) {
	const t = useAppT('people');

	const set = <V,>(name: keyof GuardianFormShape, value: V) =>
		setValue(name as Path<T>, value as PathValue<T, Path<T>>);

	// Only a COMPLETE number is worth a request; a prefix cannot match anything.
	const debouncedPhone = useDebouncedValue(phone, LOOKUP_DEBOUNCE_MS);
	const lookupPhone = isValidUzPhone(debouncedPhone) ? debouncedPhone : '';
	const { data, isFetching } = useGuardianLookup(lookupPhone);

	// A result belongs to `lookupPhone` by construction (it is the query key),
	// but the debounce means the field may already have moved past it — so a
	// number still settling reads as "checking", never as somebody else's match.
	const settled = lookupPhone !== '' && lookupPhone === phone && !isFetching;
	const match = settled ? (data?.guardian ?? null) : null;

	const alreadyOnThisStudent =
		match != null && linkedGuardianUserIds.includes(match.user.id);

	const state: GuardianLookupState = !isValidUzPhone(phone)
		? 'idle'
		: !settled
			? 'checking'
			: !match
				? 'new'
				: alreadyOnThisStudent
					? 'linked'
					: 'found';

	const showNewGuardianFields = state === 'new' || (allowPhonelessGuardian && !phone);

	useEffect(() => {
		set('guardianLookupState', state);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]);

	// The number moving off a confirmed guardian drops the confirmation with it
	// — otherwise editing the phone after connecting would save the OLD person.
	//
	// Gated on `settled`, because an unsettled lookup has no match to compare
	// against: a background refetch (window focus, say) would otherwise read as
	// "this is somebody else now" and silently discard the operator's
	// confirmation while the number never changed.
	useEffect(() => {
		if (!settled || connectedGuardianUserId == null) return;
		if (match?.user.id === connectedGuardianUserId) return;
		set('connectedGuardianUserId', undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settled, match, connectedGuardianUserId]);

	// Seed the relation from how this guardian relates to their other children.
	// Connecting a sibling is the case this whole flow exists for, and a mother
	// of one child is almost always the mother of the next — so the operator
	// gets a sensible pre-fill they can still override.
	useEffect(() => {
		if (relation || !match || match.students.length === 0) return;
		set('guardianRelation', match.students[0].relation);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [match, relation]);

	const relationSelect = (
		<FormSelect
			control={control}
			name={'guardianRelation' as Path<T>}
			label={t('form.field.relationRequired')}
			options={GUARDIAN_RELATION_OPTIONS.map((o) => ({
				value: o.value,
				label: t(`relation.${o.value}`),
			}))}
		/>
	);

	return (
		<div className="flex flex-col gap-3">
			<FormPhoneInput
				control={control}
				name={'guardianPhone' as Path<T>}
				label={t('form.field.guardianPhone')}
			/>

			{state === 'checking' && (
				<p className="flex items-center gap-2 text-xs text-muted-foreground">
					<Spinner className="size-3.5" />
					{t('form.guardianLookup.checking')}
				</p>
			)}

			{(state === 'found' || state === 'linked') && match && (
				<>
					{/* The relation is per-link, not per-person: the same guardian
					    is a mother to one child and, after a re-marriage, a
					    guardian to another. Asked before the connect click
					    because on Edit that click writes the link immediately. */}
					{state === 'found' && relationSelect}
					<GuardianMatchCard
						match={match}
						connected={connectedGuardianUserId === match.user.id}
						alreadyOnThisStudent={state === 'linked'}
						connecting={connecting}
						onConnect={() => void onConnect(match.user.id)}
					/>
				</>
			)}

			{showNewGuardianFields && (
				<div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
					{state === 'new' && (
						<div className="flex items-center gap-2">
							<Search className="size-4 shrink-0 text-muted-foreground" />
							<span className="text-xs text-muted-foreground">
								{t('form.guardianLookup.notFound')}
							</span>
						</div>
					)}
					<span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
						{t('form.guardianLookup.newTitle')}
					</span>
					<FieldGroup>
						<FormInput
							control={control}
							name={'guardianName' as Path<T>}
							label={t('form.field.guardianName')}
							placeholder={t('form.field.guardianNamePlaceholder')}
						/>
						{relationSelect}
					</FieldGroup>
				</div>
			)}
		</div>
	);
}
