import type { StatusTone } from '@repo/ui';

import type {
	PlatformTemplateModeration,
	PlatformTemplateModerationStatus,
} from '@/api/platformSms/types';

/**
 * The backend reports moderation per submitted **text**, not per template row —
 * two defaults with identical copy in different locales share one gateway
 * decision. Joining is therefore by the exact body a default renders to
 * (`sourceBody`), mirroring `apps/admin/.../lib/moderation.ts`'s tenant-side join.
 */
export function indexPlatformModeration(
	rows: PlatformTemplateModeration[] | undefined,
): Map<string, PlatformTemplateModeration> {
	return new Map((rows ?? []).map((row) => [row.sourceBody, row]));
}

/** Pill tone per status — `REJECTED` is the only one that needs the copy changed. */
export const PLATFORM_MODERATION_TONES: Record<
	PlatformTemplateModerationStatus,
	StatusTone
> = {
	PENDING: 'amber',
	MODERATION: 'blue',
	APPROVED: 'green',
	REJECTED: 'red',
};
