import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Check, ChevronDown } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import {
	Button,
	cn,
	ConfirmDialog,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	resolveStatus,
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Skeleton,
	StatusBadge,
	toast,
	TONE_ACCENT_CLASSES,
	TONE_CLASSES,
} from '@repo/ui';
import { formatDate, formatRelative } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';
import { useBranches } from '@/api/branches';

import { useConvertLead, useMoveLeadStatus } from '../api/leads.mutations';
import {
	LEAD_STATUSES,
	useLead,
	type LeadActivity,
	type LeadStatus,
} from '../api/leads.queries';
import { ACTIVITY_TONE, getInitials, leadFullName } from '../lib/lead-options';
import { LeadActivityForm } from './LeadActivityForm';

interface LeadDetailSheetProps {
	leadId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LeadDetailSheet({ leadId, open, onOpenChange }: LeadDetailSheetProps) {
	const t = useAppT('leads');
	const statusLabel = useStatusLabel();
	const navigate = useNavigate();
	const { data: lead, isLoading } = useLead(open ? leadId : null);
	const { data: branches = [] } = useBranches();

	const [activityOpen, setActivityOpen] = useState(false);
	const [markLostOpen, setMarkLostOpen] = useState(false);
	const [convertOpen, setConvertOpen] = useState(false);

	const moveStatus = useMoveLeadStatus();
	const convertLead = useConvertLead();

	const isTerminal =
		lead != null && (lead.status === 'ENROLLED' || lead.status === 'LOST');
	const branchName = lead
		? (branches.find((b) => b.id === lead.branchId)?.name ?? '—')
		: '—';

	function handleOpenChange(next: boolean) {
		if (!next) setActivityOpen(false);
		onOpenChange(next);
	}

	function handleMarkLost() {
		if (!lead) return;
		moveStatus.mutate(
			{ id: lead.id, status: 'LOST' },
			{
				onSuccess: () => {
					toast.success(t('toast.markedLost'));
					setMarkLostOpen(false);
				},
				onError: (err) =>
					toast.error(isApiError(err) ? err.message : t('toast.updateFailed')),
			},
		);
	}

	function handleConvert() {
		if (!lead) return;
		convertLead.mutate(
			{ id: lead.id },
			{
				onSuccess: (student) => {
					toast.success(t('toast.converted'));
					setConvertOpen(false);
					onOpenChange(false);
					void navigate({
						to: '/students/$id',
						params: { id: String(student.id) },
					});
				},
				onError: (err) =>
					toast.error(isApiError(err) ? err.message : t('toast.convertFailed')),
			},
		);
	}

	function handleStageChange(next: LeadStatus) {
		if (!lead || next === lead.status) return;
		moveStatus.mutate(
			{ id: lead.id, status: next },
			{
				onSuccess: () => toast.success(t('toast.stageUpdated')),
				onError: (err) =>
					toast.error(isApiError(err) ? err.message : t('toast.moveFailed')),
			},
		);
	}

	// Route each status choice to the correct backend operation: ENROLLED is
	// convert-only and LOST goes through the mark-as-lost confirm; the three open
	// stages move directly.
	function handleStatusSelect(next: LeadStatus) {
		if (!lead || next === lead.status) return;
		if (next === 'ENROLLED') {
			setConvertOpen(true);
			return;
		}
		if (next === 'LOST') {
			setMarkLostOpen(true);
			return;
		}
		handleStageChange(next);
	}

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
				<SheetHeader className="border-b px-6 py-4">
					<SheetTitle>{t('detail.title')}</SheetTitle>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto p-6">
					{isLoading || !lead ? (
						<div className="flex flex-col gap-3">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-24 w-full" />
							<Skeleton className="h-40 w-full" />
						</div>
					) : (
						<div className="flex flex-col gap-4">
							{/* Identity + status */}
							<div className="rounded-xl border bg-card p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="flex min-w-0 items-center gap-3">
										<div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
											{getInitials(lead.firstName, lead.lastName)}
										</div>
										<div className="min-w-0">
											<div className="truncate text-base font-bold">
												{leadFullName(
													lead.firstName,
													lead.lastName,
												)}
											</div>
											<div className="text-sm text-muted-foreground">
												{lead.phoneNumber}
											</div>
										</div>
									</div>

									{isTerminal ? (
										<StatusBadge
											kind="lead"
											status={lead.status}
											className="shrink-0"
										>
											{statusLabel('lead', lead.status)}
										</StatusBadge>
									) : (
										<Can
											permission="lead.update"
											fallback={
												<StatusBadge
													kind="lead"
													status={lead.status}
													className="shrink-0"
												>
													{statusLabel('lead', lead.status)}
												</StatusBadge>
											}
										>
											<DropdownMenu>
												<DropdownMenuTrigger
													disabled={moveStatus.isPending}
													className={cn(
														'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60',
														TONE_CLASSES[
															resolveStatus(
																'lead',
																lead.status,
															).tone
														],
													)}
												>
													{statusLabel('lead', lead.status)}
													<ChevronDown className="size-3" />
												</DropdownMenuTrigger>
												<DropdownMenuContent
													align="end"
													className="w-44"
												>
													{LEAD_STATUSES.map((s) => {
														const d = resolveStatus(
															'lead',
															s,
														);
														const current = s === lead.status;
														return (
															<DropdownMenuItem
																key={s}
																disabled={current}
																onClick={() =>
																	handleStatusSelect(s)
																}
																className="gap-2"
															>
																<span
																	className={cn(
																		'size-2 rounded-full',
																		TONE_ACCENT_CLASSES[
																			d.tone
																		].dot,
																	)}
																/>
																<span className="flex-1">
																	{statusLabel(
																		'lead',
																		s,
																	)}
																</span>
																{current && (
																	<Check className="size-4 text-muted-foreground" />
																)}
															</DropdownMenuItem>
														);
													})}
												</DropdownMenuContent>
											</DropdownMenu>
										</Can>
									)}
								</div>
								<div className="mt-3 flex items-center gap-2 border-t pt-3">
									<StatusBadge kind="lead_source" status={lead.source}>
										{statusLabel('lead_source', lead.source)}
									</StatusBadge>
								</div>
							</div>

							{/* Details */}
							<div className="rounded-xl border bg-card p-4">
								<div className="mb-3 text-[10.5px] font-semibold tracking-widest text-muted-foreground uppercase">
									{t('detail.sectionDetails')}
								</div>
								<div className="grid grid-cols-2 gap-x-4 gap-y-3">
									<DetailField
										label={t('detail.field.courseInterest')}
										value={lead.courseInterest?.name ?? '—'}
									/>
									<DetailField
										label={t('detail.field.branch')}
										value={branchName}
									/>
									<DetailField
										label={t('detail.field.assignedTo')}
										value={
											lead.assignedTo?.name ??
											t('detail.unassigned')
										}
									/>
									<DetailField
										label={t('detail.field.captured')}
										value={formatDate(lead.createdAt)}
									/>
									{lead.email && (
										<div className="col-span-2">
											<DetailField
												label={t('detail.field.email')}
												value={lead.email}
											/>
										</div>
									)}
								</div>
							</div>

							{/* Activity */}
							<div className="rounded-xl border bg-card p-4">
								<div className="mb-3 flex items-center justify-between">
									<span className="text-[10.5px] font-semibold tracking-widest text-muted-foreground uppercase">
										{t('detail.sectionActivity')}
									</span>
									{!activityOpen && (
										<Can permission="lead.activity.create">
											<Button
												variant="link"
												className="h-auto p-0 text-primary"
												onClick={() => setActivityOpen(true)}
											>
												{t('detail.logActivity')}
											</Button>
										</Can>
									)}
								</div>

								{activityOpen && (
									<LeadActivityForm
										leadId={lead.id}
										onDone={() => setActivityOpen(false)}
										onCancel={() => setActivityOpen(false)}
									/>
								)}

								{lead.activities.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										{t('detail.noActivity')}
									</p>
								) : (
									<ol className="flex flex-col">
										{lead.activities.map((activity, i) => (
											<TimelineItem
												key={activity.id}
												activity={activity}
												isLast={i === lead.activities.length - 1}
											/>
										))}
									</ol>
								)}
							</div>
						</div>
					)}
				</div>

				{lead && (
					<SheetFooter className="flex-row gap-2 border-t bg-card px-6 py-4 *:flex-1">
						<Can permission="lead.activity.create">
							<Button
								variant="outline"
								onClick={() => setActivityOpen(true)}
							>
								{t('detail.logActivity')}
							</Button>
						</Can>
						{!isTerminal && (
							<Can permission="lead.convert">
								<Button
									className="bg-tone-green-fg text-background hover:bg-tone-green-fg/90"
									onClick={() => setConvertOpen(true)}
								>
									<Check className="mr-1.5 size-4" />
									{t('detail.convert')}
								</Button>
							</Can>
						)}
					</SheetFooter>
				)}
			</SheetContent>

			<ConfirmDialog
				open={markLostOpen}
				onOpenChange={setMarkLostOpen}
				title={t('detail.markLost.title')}
				description={t('detail.markLost.description')}
				confirmLabel={t('detail.markLost.confirm')}
				variant="destructive"
				loading={moveStatus.isPending}
				onConfirm={handleMarkLost}
			/>
			<ConfirmDialog
				open={convertOpen}
				onOpenChange={setConvertOpen}
				title={t('detail.convertDialog.title')}
				description={t('detail.convertDialog.description')}
				confirmLabel={t('detail.convertDialog.confirm')}
				loading={convertLead.isPending}
				onConfirm={handleConvert}
			/>
		</Sheet>
	);
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<div className="text-[10.5px] font-semibold tracking-widest text-muted-foreground uppercase">
				{label}
			</div>
			<div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
		</div>
	);
}

function TimelineItem({ activity, isLast }: { activity: LeadActivity; isLast: boolean }) {
	const t = useAppT('leads');
	const descriptor = activity.status
		? resolveStatus('lead', activity.status).tone
		: ACTIVITY_TONE[activity.type];

	return (
		<li className="flex gap-4">
			<div className="flex flex-col items-center">
				<span
					className={cn(
						'mt-1.5 size-2.5 shrink-0 rounded-full',
						TONE_ACCENT_CLASSES[descriptor].dot,
					)}
				/>
				{!isLast && <span className="w-px flex-1 bg-border" />}
			</div>
			<div className="pb-3">
				<div className="flex flex-wrap items-center gap-x-1 text-sm">
					{activity.status ? (
						<div className="font-semibold">{activity.label}</div>
					) : (
						<span className="font-semibold">{activity.notes}</span>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-x-1.5 mt-0.5">
					<span className="text-xs text-muted-foreground">
						{activity.actorName ?? t('detail.system')}
					</span>
					<span className="text-muted-foreground">·</span>
					<span className="text-xs text-muted-foreground">
						{formatRelative(activity.createdAt)}
					</span>
				</div>
			</div>
		</li>
	);
}
