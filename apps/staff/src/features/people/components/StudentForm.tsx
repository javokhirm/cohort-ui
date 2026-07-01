import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@repo/ui';

import {
	Button,
	FieldGroup,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	Spinner,
} from '@repo/ui';

import {
	createStudentSchema,
	editStudentSchema,
	splitFullName,
	type CreateStudentFormValues,
	type EditStudentFormValues,
} from '../schemas/student-form.schema';
import {
	useBranches,
	useGroups,
	useFeePlans,
	type Student,
} from '../api/students.queries';
import {
	useCreateStudent,
	useUpdateStudent,
	useEnrollStudent,
	useAddGuardian,
} from '../api/students.mutations';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	student: Student;
}

type StudentFormProps = CreateProps | EditProps;

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
			{children}
		</p>
	);
}

// ─── Create form ──────────────────────────────────────────────────────────────

function CreateStudentForm({ onSuccess }: { onSuccess: () => void }) {
	const form = useForm<CreateStudentFormValues>({
		resolver: zodResolver(createStudentSchema),
		defaultValues: {
			fullName: '',
			dateOfBirth: '',
			phone: '+998',
			address: '',
			guardianName: '',
			guardianPhone: '+998',
			guardianRelation: 'father',
		},
	});

	const { data: branches = [] } = useBranches();
	const selectedBranchId = form.watch('branchId');
	const { data: groupsPage } = useGroups(
		selectedBranchId ? { branchId: selectedBranchId } : undefined,
	);
	const groups = groupsPage?.rows ?? [];
	const { data: feePlansPage } = useFeePlans();
	const feePlans = feePlansPage?.rows ?? [];

	const createStudent = useCreateStudent();
	const addGuardian = useAddGuardian();
	const enrollStudent = useEnrollStudent();

	async function onSubmit(values: CreateStudentFormValues) {
		const { firstName, lastName } = splitFullName(values.fullName);
		const { firstName: gFirst, lastName: gLast } = splitFullName(values.guardianName);

		let studentId: number;
		try {
			const result = await createStudent.mutateAsync({
				branchId: values.branchId,
				firstName,
				lastName,
				phone: values.phone,
				dateOfBirth: values.dateOfBirth || undefined,
				gender: values.gender,
				address: values.address || undefined,
			});
			studentId = result.id;
		} catch {
			return;
		}

		await addGuardian.mutateAsync({
			studentId,
			phone: values.guardianPhone,
			firstName: gFirst,
			lastName: gLast,
			relation: values.guardianRelation,
			isPrimary: true,
			canPickup: true,
		});

		if (values.groupId) {
			await enrollStudent.mutateAsync({
				groupId: values.groupId,
				studentId,
				feePlanId: values.feePlanId ?? null,
			});
		}

		toast.success('Student added successfully');
		onSuccess();
	}

	const isPending =
		createStudent.isPending || addGuardian.isPending || enrollStudent.isPending;

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-6"
			>
				{/* PERSONAL */}
				<div className="flex flex-col gap-4">
					<SectionHeading>Personal</SectionHeading>
					<FieldGroup>
						<FormField
							control={form.control}
							name="fullName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Full name *</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g. Diyorbek Rustamov"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="dateOfBirth"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Date of birth</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="gender"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Gender</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="M">Male</SelectItem>
												<SelectItem value="F">Female</SelectItem>
												<SelectItem value="O">Other</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</FieldGroup>
				</div>

				<Separator />

				{/* CONTACT */}
				<div className="flex flex-col gap-4">
					<SectionHeading>Contact</SectionHeading>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone *</FormLabel>
										<FormControl>
											<Input placeholder="+998" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="branchId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Branch *</FormLabel>
										<Select
											onValueChange={(v) =>
												field.onChange(Number(v))
											}
											value={field.value ? String(field.value) : ''}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{(
													branches as {
														id: number;
														name: string;
													}[]
												).map((b) => (
													<SelectItem
														key={b.id}
														value={String(b.id)}
													>
														{b.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="address"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Address</FormLabel>
									<FormControl>
										<Input
											placeholder="Street, district, city"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FieldGroup>
				</div>

				<Separator />

				{/* GUARDIAN */}
				<div className="flex flex-col gap-4">
					<SectionHeading>Guardian</SectionHeading>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="guardianName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Guardian name *</FormLabel>
										<FormControl>
											<Input
												placeholder="e.g. Rustam Olimov"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="guardianRelation"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Relation</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="father">
													Father
												</SelectItem>
												<SelectItem value="mother">
													Mother
												</SelectItem>
												<SelectItem value="guardian">
													Guardian
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="guardianPhone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Guardian phone *</FormLabel>
									<FormControl>
										<Input placeholder="+998" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FieldGroup>
				</div>

				{groups.length > 0 || feePlans.length > 0 ? (
					<>
						<Separator />
						{/* INITIAL ENROLLMENT */}
						<div className="flex flex-col gap-4">
							<SectionHeading>Initial enrollment</SectionHeading>
							<FieldGroup>
								<div className="grid grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="groupId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Group</FormLabel>
												<Select
													onValueChange={(v) =>
														field.onChange(
															v ? Number(v) : undefined,
														)
													}
													value={
														field.value
															? String(field.value)
															: ''
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select..." />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{groups.map((g) => (
															<SelectItem
																key={g.id}
																value={String(g.id)}
															>
																{g.code}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="feePlanId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Fee plan</FormLabel>
												<Select
													onValueChange={(v) =>
														field.onChange(
															v ? Number(v) : undefined,
														)
													}
													value={
														field.value
															? String(field.value)
															: ''
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select..." />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{feePlans.map((fp) => (
															<SelectItem
																key={fp.id}
																value={String(fp.id)}
															>
																{fp.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</FieldGroup>
						</div>
					</>
				) : null}

				<div className="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onClick={onSuccess}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						Save student
					</Button>
				</div>
			</form>
		</Form>
	);
}

// ─── Edit form ────────────────────────────────────────────────────────────────

function EditStudentForm({
	student,
	onSuccess,
}: {
	student: Student;
	onSuccess: () => void;
}) {
	const form = useForm<EditStudentFormValues>({
		resolver: zodResolver(editStudentSchema),
		defaultValues: {
			fullName: `${student.user.firstName} ${student.user.lastName}`,
			dateOfBirth: student.dateOfBirth ?? '',
			gender: student.gender ?? undefined,
			phone: student.user.phone,
			branchId: student.branchId,
			address: '',
			status: student.status,
		},
	});

	useEffect(() => {
		form.reset({
			fullName: `${student.user.firstName} ${student.user.lastName}`,
			dateOfBirth: student.dateOfBirth ?? '',
			gender: student.gender ?? undefined,
			phone: student.user.phone,
			branchId: student.branchId,
			address: '',
			status: student.status,
		});
	}, [student, form]);

	const { data: branches = [] } = useBranches();
	const updateStudent = useUpdateStudent();

	async function onSubmit(values: EditStudentFormValues) {
		await updateStudent.mutateAsync({
			id: student.id,
			branchId: values.branchId,
			dateOfBirth: values.dateOfBirth || undefined,
			gender: values.gender,
			address: values.address || undefined,
			status: values.status,
		});
		toast.success('Student updated');
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-6"
			>
				{/* PERSONAL */}
				<div className="flex flex-col gap-4">
					<SectionHeading>Personal</SectionHeading>
					<FieldGroup>
						<FormField
							control={form.control}
							name="fullName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Full name</FormLabel>
									<FormControl>
										<Input disabled {...field} />
									</FormControl>
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="dateOfBirth"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Date of birth</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="gender"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Gender</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="M">Male</SelectItem>
												<SelectItem value="F">Female</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</FieldGroup>
				</div>

				<Separator />

				{/* CONTACT */}
				<div className="flex flex-col gap-4">
					<SectionHeading>Contact</SectionHeading>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone</FormLabel>
										<FormControl>
											<Input disabled {...field} />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="branchId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Branch *</FormLabel>
										<Select
											onValueChange={(v) =>
												field.onChange(Number(v))
											}
											value={field.value ? String(field.value) : ''}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select..." />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{(
													branches as {
														id: number;
														name: string;
													}[]
												).map((b) => (
													<SelectItem
														key={b.id}
														value={String(b.id)}
													>
														{b.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="address"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Address</FormLabel>
									<FormControl>
										<Input
											placeholder="Street, district, city"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FieldGroup>
				</div>

				<Separator />

				{/* STATUS */}
				<div className="flex flex-col gap-4">
					<SectionHeading>Status</SectionHeading>
					<FormField
						control={form.control}
						name="status"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Student status</FormLabel>
								<Select
									onValueChange={field.onChange}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="ACTIVE">Active</SelectItem>
										<SelectItem value="INACTIVE">Inactive</SelectItem>
										<SelectItem value="GRADUATED">
											Graduated
										</SelectItem>
										<SelectItem value="SUSPENDED">
											Suspended
										</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onClick={onSuccess}>
						Cancel
					</Button>
					<Button type="submit" disabled={updateStudent.isPending}>
						{updateStudent.isPending && <Spinner className="mr-2 size-4" />}
						Save student
					</Button>
				</div>
			</form>
		</Form>
	);
}

// ─── Sheet wrapper ────────────────────────────────────────────────────────────

export function StudentForm(props: StudentFormProps) {
	const { open, onOpenChange, mode } = props;

	function handleSuccess() {
		onOpenChange(false);
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
				<SheetHeader className="px-6 pt-6">
					<SheetTitle>
						{mode === 'create' ? 'Add student' : 'Edit student'}
					</SheetTitle>
					<SheetDescription>Fields marked * are required</SheetDescription>
				</SheetHeader>
				<div className="px-6 py-6">
					{mode === 'create' ? (
						<CreateStudentForm onSuccess={handleSuccess} />
					) : (
						<EditStudentForm
							student={(props as EditProps).student}
							onSuccess={handleSuccess}
						/>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
