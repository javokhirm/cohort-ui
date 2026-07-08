import { z } from 'zod';

/** Room type — mirrors the backend `ROOM_TYPES` tuple (classroom/lab/online). */
const roomType = z.enum(['classroom', 'lab', 'online']);

const capacity = z
	.number({ error: 'Capacity is required' })
	.int('Capacity must be a whole number')
	.min(1, 'Capacity must be at least 1');

export const createRoomSchema = z.object({
	name: z.string().min(1, 'Room name is required'),
	branchId: z.number({ error: 'Branch is required' }).min(1, 'Branch is required'),
	capacity,
	type: roomType,
});

export const editRoomSchema = z.object({
	name: z.string().min(1, 'Room name is required'),
	branchId: z.number({ error: 'Branch is required' }).min(1, 'Branch is required'),
	capacity,
	type: roomType,
	status: z.enum(['active', 'inactive']),
});

export type CreateRoomFormValues = z.infer<typeof createRoomSchema>;
export type EditRoomFormValues = z.infer<typeof editRoomSchema>;
