import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	FieldGroup,
	Form,
	FormInput,
	FormSelect,
	Spinner,
	toast,
} from '@repo/ui';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { useBranches } from '@/api/branches';
import { useBranchStore } from '@/store/branchStore';

import {
	createRoomSchema,
	editRoomSchema,
	type CreateRoomFormValues,
	type EditRoomFormValues,
} from '../schemas/room-form.schema';
import type { RoomResponse } from '../api/rooms.queries';
import { useCreateRoom, useUpdateRoom } from '../api/rooms.mutations';
import { ROOM_STATUS_OPTIONS, ROOM_TYPE_OPTIONS } from '../lib/room-type';

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	room: RoomResponse;
}

type RoomFormProps = CreateProps | EditProps;

function CreateRoomForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	// When exactly one branch is selected globally, pre-fill it (still editable).
	const activeBranchIds = useBranchStore((s) => s.activeBranchIds);
	const defaultBranchId =
		activeBranchIds?.length === 1 ? activeBranchIds[0] : undefined;

	const form = useForm<CreateRoomFormValues>({
		resolver: zodResolver(createRoomSchema),
		defaultValues: {
			name: '',
			type: 'classroom',
			branchId: defaultBranchId,
		},
	});

	const { data: branches = [] } = useBranches();
	const createRoom = useCreateRoom();

	useEffect(() => {
		onPendingChange(createRoom.isPending);
	}, [createRoom.isPending, onPendingChange]);

	async function onSubmit(values: CreateRoomFormValues) {
		await createRoom.mutateAsync({
			branchId: values.branchId,
			name: values.name.trim(),
			capacity: values.capacity,
			type: values.type,
		});
		toast.success('Room added');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-room-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label="Room name *"
							placeholder="e.g. Room 204"
						/>
						<FormSelect
							control={form.control}
							name="branchId"
							label="Branch *"
							valueAsNumber
							options={branches.map((b) => ({
								value: String(b.id),
								label: b.name,
							}))}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="capacity"
								label="Capacity *"
								type="number"
								min={1}
								placeholder="e.g. 20"
								onChange={(e) =>
									form.setValue(
										'capacity',
										e.target.value === ''
											? (undefined as unknown as number)
											: Number(e.target.value),
										{ shouldValidate: true },
									)
								}
							/>
							<FormSelect
								control={form.control}
								name="type"
								label="Type"
								options={ROOM_TYPE_OPTIONS}
							/>
						</div>
					</FieldGroup>
				</FormSection>
			</form>
		</Form>
	);
}

function EditRoomForm({
	room,
	onSuccess,
	onPendingChange,
}: {
	room: RoomResponse;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const toDefaults = (r: RoomResponse): EditRoomFormValues => ({
		name: r.name,
		branchId: r.branchId,
		capacity: r.capacity,
		type: r.type ?? 'classroom',
		status: r.isActive ? 'active' : 'inactive',
	});

	const form = useForm<EditRoomFormValues>({
		resolver: zodResolver(editRoomSchema),
		defaultValues: toDefaults(room),
	});

	useEffect(() => {
		form.reset(toDefaults(room));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [room]);

	const { data: branches = [] } = useBranches();
	const updateRoom = useUpdateRoom();

	useEffect(() => {
		onPendingChange(updateRoom.isPending);
	}, [updateRoom.isPending, onPendingChange]);

	async function onSubmit(values: EditRoomFormValues) {
		await updateRoom.mutateAsync({
			id: room.id,
			branchId: values.branchId,
			name: values.name.trim(),
			capacity: values.capacity,
			type: values.type,
			isActive: values.status === 'active',
		});
		toast.success('Room updated');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-room-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormSection>
					<FieldGroup>
						<FormInput
							control={form.control}
							name="name"
							label="Room name *"
							placeholder="e.g. Room 204"
						/>
						<FormSelect
							control={form.control}
							name="branchId"
							label="Branch *"
							valueAsNumber
							options={branches.map((b) => ({
								value: String(b.id),
								label: b.name,
							}))}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormInput
								control={form.control}
								name="capacity"
								label="Capacity *"
								type="number"
								min={1}
								placeholder="e.g. 20"
								onChange={(e) =>
									form.setValue(
										'capacity',
										e.target.value === ''
											? (undefined as unknown as number)
											: Number(e.target.value),
										{ shouldValidate: true },
									)
								}
							/>
							<FormSelect
								control={form.control}
								name="type"
								label="Type"
								options={ROOM_TYPE_OPTIONS}
							/>
						</div>
						<FormSelect
							control={form.control}
							name="status"
							label="Status"
							options={ROOM_STATUS_OPTIONS}
						/>
					</FieldGroup>
				</FormSection>
			</form>
		</Form>
	);
}

export function RoomForm(props: RoomFormProps) {
	const { open, onOpenChange, mode } = props;
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-room-form' : 'edit-room-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? 'Add room' : 'Edit room'}
			description="Fields marked * are required"
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						Save
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreateRoomForm onSuccess={handleClose} onPendingChange={setIsPending} />
			) : (
				<EditRoomForm
					room={(props as EditProps).room}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
