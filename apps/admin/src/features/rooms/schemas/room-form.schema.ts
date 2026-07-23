import { z } from 'zod';

import type { Translator } from '@repo/i18n';

import type { useAppT } from '@/locales';

/**
 * Room form schemas. Factories rather than module constants because the
 * messages are user-facing — a literal captured at module load would never
 * re-translate on a language switch (conventions.md §7).
 */

type RoomT = ReturnType<typeof useAppT<'rooms'>>;

/** Room type — mirrors the backend `ROOM_TYPES` tuple (classroom/lab/online). */
const roomType = z.enum(['classroom', 'lab', 'online']);

function baseFields(t: Translator<'validation'>, tr: RoomT) {
	return {
		name: z.string().min(1, t('required')),
		branchId: z.number({ error: t('required') }).min(1, t('required')),
		capacity: z
			.number({ error: t('required') })
			.int(t('integerInvalid'))
			.min(1, tr('validation.capacityMin')),
		type: roomType,
	};
}

export function createRoomSchema(t: Translator<'validation'>, tr: RoomT) {
	return z.object(baseFields(t, tr));
}

export function editRoomSchema(t: Translator<'validation'>, tr: RoomT) {
	return z.object({
		...baseFields(t, tr),
		status: z.enum(['active', 'inactive']),
	});
}

export type CreateRoomFormValues = z.infer<ReturnType<typeof createRoomSchema>>;
export type EditRoomFormValues = z.infer<ReturnType<typeof editRoomSchema>>;
