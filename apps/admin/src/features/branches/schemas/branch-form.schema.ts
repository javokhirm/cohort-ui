import { z } from 'zod';

import type { Translator } from '@repo/i18n';
import { UZ_PHONE_REGEX } from '@repo/utils';

import type { useAppT } from '@/locales';

/**
 * Branch form schemas. Mirrors the backend `CreateBranchDto` / `UpdateBranchDto`
 * (api-reference §3.1). Address and phone are optional on the backend but the
 * product design marks them required, so the FE validates them as required.
 * The backend doesn't constrain `phone`'s format, but it's entered via the
 * shared `PhoneInput`, so it's always a valid Uzbekistan number.
 * `code` is create-only (immutable on the backend, absent from `UpdateBranchDto`);
 * `isActive` is edit-only (branches are always created active).
 *
 * The schemas are factories rather than module constants because their messages
 * are user-facing: a literal captured at module load would never re-translate
 * when the language changes (conventions.md §7). Callers memoise on the
 * translator.
 */

type BranchT = ReturnType<typeof useAppT<'branches'>>;

export function createBranchSchema(t: Translator<'validation'>, tb: BranchT) {
	return z.object({
		name: z.string().trim().min(1, t('required')),
		code: z.string().trim().min(1, t('required')).max(20, tb('validation.codeMax')),
		address: z.string().trim().min(1, t('required')),
		phone: z.string().regex(UZ_PHONE_REGEX, t('phoneInvalid')),
		timezone: z.string().trim().min(1, t('required')),
		isMain: z.boolean(),
	});
}

export function editBranchSchema(t: Translator<'validation'>) {
	return z.object({
		name: z.string().trim().min(1, t('required')),
		address: z.string().trim().min(1, t('required')),
		phone: z.string().regex(UZ_PHONE_REGEX, t('phoneInvalid')),
		timezone: z.string().trim().min(1, t('required')),
		isMain: z.boolean(),
		isActive: z.boolean(),
	});
}

export type CreateBranchFormValues = z.infer<ReturnType<typeof createBranchSchema>>;
export type EditBranchFormValues = z.infer<ReturnType<typeof editBranchSchema>>;
