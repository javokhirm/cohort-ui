import { useMemo, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import {
	Button,
	Card,
	cn,
	ConfirmDialog,
	Input,
	Spinner,
	StatusBadge,
	Textarea,
	toast,
} from '@repo/ui';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';

import type {
	NotificationTemplate,
	NotificationTrigger,
	TemplateModeration,
} from '../api/notifications.queries';
import {
	useCreateNotificationTemplate,
	useDeleteNotificationTemplate,
	useUpdateNotificationTemplate,
} from '../api/notifications.mutations';
import { isModeratedChannel, moderationFor } from '../lib/moderation';
import { referencedVariables, renderWithSamples } from '../lib/sample-values';
import { analyzeSms } from '../lib/sms-segments';
import { TemplateModerationBadge } from './TemplateModerationBadge';

/** A demo SMS originator for the preview bubble — sample data, nothing is sent. */
const PREVIEW_SENDER = '4546';
const MAX_BODY_LENGTH = 4000;

interface TemplateEditorProps {
	template: NotificationTemplate;
	triggers: NotificationTrigger[] | undefined;
	/** How many rules reference this template's code (for the subtitle). */
	ruleCount: number;
	/** SMS moderation state, indexed by the body it was submitted from. */
	moderation: Map<string, TemplateModeration>;
}

/**
 * The detail pane: edit one template's body, watch its cost and preview it.
 *
 * The two-layer model surfaces here. When the selected row is a **`SYSTEM`**
 * default, saving `POST`s a tenant override (the copy becomes the center's own);
 * when it is already a **`TENANT`** row, saving `PATCH`es it, and "revert" deletes
 * it so the code-owned default takes over again. The list is keyed by
 * `(code, channel, locale)`, so the same row stays selected across that flip.
 *
 * The character/segment counter and the live preview both run on the **rendered**
 * message (sample values substituted), because UCS-2 vs GSM-7 and the part count
 * are properties of what actually goes on the wire — not the raw `{{body}}`.
 */
export function TemplateEditor({
	template,
	triggers,
	ruleCount,
	moderation,
}: TemplateEditorProps) {
	const tn = useAppT('notifications');

	const createTemplate = useCreateNotificationTemplate();
	const updateTemplate = useUpdateNotificationTemplate();
	const deleteTemplate = useDeleteNotificationTemplate();

	// Seeded once per mount. The page remounts this editor (via a `key` that
	// includes the row's source/id) whenever the selection changes or the row
	// flips SYSTEM↔TENANT after a save/revert, so local state always starts from
	// the server's current copy without an effect.
	const bodyRef = useRef<HTMLTextAreaElement | null>(null);
	const [body, setBody] = useState(template.body);
	const [subject, setSubject] = useState(template.subject ?? '');
	const [revertOpen, setRevertOpen] = useState(false);

	/**
	 * Variables this code may use: the union across every trigger that defaults to
	 * it. A code no trigger references (a
	 * center's own broadcast) has no declared set, so nothing is offered or checked.
	 */
	const { availableVariables, hasDeclaredSet } = useMemo(() => {
		const matching = (triggers ?? []).filter(
			(t) => t.defaultTemplateCode === template.code,
		);
		const vars = [...new Set(matching.flatMap((t) => t.variables))];
		return {
			availableVariables: [...new Set([...vars])].sort(),
			hasDeclaredSet: matching.length > 0,
		};
	}, [triggers, template.code]);

	// Variables the body references that the trigger cannot supply — the same body
	// the backend would reject with a 400, surfaced before the round-trip.
	const unknownVariables = useMemo(() => {
		if (!hasDeclaredSet) return [];
		const allowed = new Set(availableVariables);
		return referencedVariables(body).filter((name) => !allowed.has(name));
	}, [body, availableVariables, hasDeclaredSet]);

	const rendered = useMemo(() => renderWithSamples(body), [body]);
	const analysis = useMemo(() => analyzeSms(rendered), [rendered]);

	const isEmail = template.channel === 'EMAIL';
	const dirty =
		body !== template.body || (isEmail && subject !== (template.subject ?? ''));
	const isSaving = createTemplate.isPending || updateTemplate.isPending;

	/**
	 * The gateway's verdict on the **saved** copy — deliberately looked up by
	 * `template.body`, not the draft in the textarea. A body the user is still
	 * typing has never been submitted, so there is no verdict on it; showing the
	 * saved one plus {@link tn}`('moderation.dirtyNote')` is the honest reading.
	 */
	const templateModeration = moderationFor(moderation, template);
	const showModeration = isModeratedChannel(template.channel);

	const insertVariable = (name: string) => {
		const token = `{{${name}}}`;
		const textarea = bodyRef.current;
		if (!textarea) {
			setBody((current) => `${current}${token}`);
			return;
		}
		const start = textarea.selectionStart ?? body.length;
		const end = textarea.selectionEnd ?? body.length;
		setBody(`${body.slice(0, start)}${token}${body.slice(end)}`);
		requestAnimationFrame(() => {
			textarea.focus();
			const caret = start + token.length;
			textarea.setSelectionRange(caret, caret);
		});
	};

	const onSave = async () => {
		const trimmed = body.trim();
		if (!trimmed) return;
		const emailSubject = isEmail && subject.trim() ? subject.trim() : null;
		try {
			if (template.source === 'TENANT' && template.id != null) {
				await updateTemplate.mutateAsync({
					id: template.id,
					body: trimmed,
					subject: emailSubject,
				});
			} else {
				// Editing a code-owned default forks it into the center's own row.
				await createTemplate.mutateAsync({
					code: template.code,
					channel: template.channel,
					locale: template.locale,
					subject: emailSubject,
					body: trimmed,
					isActive: true,
				});
			}
			toast.success(tn('templates.updated'));
		} catch (err) {
			// Carries the backend's NOTIFICATION_TEMPLATE_UNKNOWN_VARIABLES message.
			toast.error(isApiError(err) ? err.message : tn('templates.saveFailed'));
		}
	};

	const onRevert = async () => {
		if (template.id == null) return;
		try {
			await deleteTemplate.mutateAsync(template.id);
			toast.success(tn('templates.reverted'));
			setRevertOpen(false);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tn('templates.deleteFailed'));
		}
	};

	const lastEdited =
		template.source === 'TENANT' && template.updatedAt
			? tn('templates.lastEdited', {
					date: new Date(template.updatedAt).toLocaleDateString(),
				})
			: null;

	return (
		<div className="flex flex-col gap-4">
			<Card className="gap-0 p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex min-w-0 flex-col gap-1">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-mono text-sm font-semibold text-primary">
								{template.code}
							</span>
							<StatusBadge kind="channel" status={template.channel}>
								{tn(`channel.${template.channel}`)}
							</StatusBadge>
							<span className="text-xs font-semibold uppercase text-muted-foreground">
								{template.locale}
							</span>
							<StatusBadge
								tone={template.isCustomized ? 'indigo' : 'slate'}
							>
								{tn(
									template.isCustomized
										? 'templates.sourceCustom'
										: 'templates.sourceDefault',
								)}
							</StatusBadge>
						</div>
						<span className="text-xs text-muted-foreground">
							{ruleCount > 0
								? tn('templates.usedBy', { count: ruleCount })
								: tn('templates.usedByNone')}
							{lastEdited ? ` · ${lastEdited}` : ''}
						</span>
					</div>

					<div className="flex shrink-0 items-center gap-2">
						{template.isCustomized && (
							<Can permission="notification-template.manage">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setRevertOpen(true)}
									disabled={isSaving || deleteTemplate.isPending}
									className="text-muted-foreground"
								>
									{tn('templates.revert')}
								</Button>
							</Can>
						)}
						<Can permission="notification-template.manage">
							<Button
								size="sm"
								onClick={() => void onSave()}
								disabled={!dirty || isSaving || !body.trim()}
							>
								{isSaving && <Spinner className="mr-1.5 size-4" />}
								{tn('templates.saveButton')}
							</Button>
						</Can>
					</div>
				</div>

				{isEmail && (
					<div className="mt-4">
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder={tn('templates.field.subject')}
							maxLength={255}
						/>
					</div>
				)}

				<Textarea
					ref={bodyRef}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					rows={4}
					maxLength={MAX_BODY_LENGTH}
					className="mt-4 font-mono text-sm"
				/>

				<div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
					<span>
						{tn('templates.charCount', {
							chars: analysis.chars,
							perSegment: analysis.perSegment,
							encoding: analysis.encoding,
							segments: analysis.segments,
						})}
					</span>
					<span aria-hidden>·</span>
					<span>{tn('templates.segmentsCounted')}</span>
				</div>

				{unknownVariables.length > 0 && (
					<p className="mt-2 text-xs text-destructive">
						{tn('templates.unknownVars', {
							vars: unknownVariables.map((v) => `{{${v}}}`).join(', '),
						})}
					</p>
				)}

				{availableVariables.length > 0 && (
					<div className="mt-4 flex flex-col gap-2">
						<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
							{tn('templates.variablesTitle')}
						</span>
						<div className="flex flex-wrap gap-1.5">
							{availableVariables.map((name) => (
								<Button
									key={name}
									type="button"
									variant="outline"
									size="sm"
									onClick={() => insertVariable(name)}
									aria-label={tn('templates.insertVariable', { name })}
									className="h-7 px-2 font-mono text-xs font-normal text-muted-foreground hover:text-primary"
								>
									{`{{${name}}}`}
								</Button>
							))}
						</div>
					</div>
				)}
			</Card>

			{/*
			 * Sits directly under the body it renders: the draft as a recipient
			 * would read it, sample values substituted, updating as you type. It
			 * deliberately precedes the moderation card, which shows the *saved*
			 * copy in the gateway's own syntax — draft first, then the verdict on
			 * what was already submitted.
			 */}
			<Card className="gap-3 p-4">
				<div className="flex items-center justify-between gap-2">
					<span className="text-sm font-semibold text-foreground">
						{tn('templates.livePreview')}
					</span>
				</div>

				<div className="flex items-start gap-3">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<MessageSquare className="size-4" />
					</span>
					<div className="flex min-w-0 flex-1 flex-col gap-1">
						<span className="text-xs text-muted-foreground">
							{tn('templates.previewFrom', { sender: PREVIEW_SENDER })}
						</span>
						<p
							className={cn(
								'whitespace-pre-wrap rounded-lg rounded-tl-none bg-muted p-3 text-sm',
								!rendered && 'text-muted-foreground',
							)}
						>
							{rendered || tn('templates.previewEmpty')}
						</p>
					</div>
				</div>
			</Card>

			{/*
			 * Between saving and approval, every message on this copy is rejected
			 * by the gateway — a gap that is otherwise invisible until it surfaces
			 * in the outbox as a Russian gateway error days later.
			 */}
			{showModeration && (
				<Card className="gap-3 p-4">
					<div className="flex items-center justify-between gap-2">
						<span className="text-sm font-semibold text-foreground">
							{tn('moderation.title')}
						</span>
						<TemplateModerationBadge
							moderation={templateModeration}
							withTooltip
						/>
					</div>

					{templateModeration ? (
						<>
							<p className="text-xs text-muted-foreground">
								{tn(`moderation.hint.${templateModeration.status}`)}
							</p>

							<div className="flex flex-col gap-1.5">
								<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
									{tn('moderation.submittedAs')}
								</span>
								<code className="whitespace-pre-wrap break-words rounded-lg bg-muted p-3 font-mono text-xs">
									{templateModeration.templateText}
								</code>
							</div>

							{templateModeration.error && (
								<p className="text-xs text-destructive">
									{`${tn('moderation.errorLabel')}: ${templateModeration.error}`}
								</p>
							)}
						</>
					) : (
						<div className="flex flex-col gap-1">
							<p className="text-xs text-muted-foreground">
								{tn('moderation.unavailable')}
							</p>
							<p className="text-xs text-muted-foreground">
								{tn('moderation.unavailableHint')}
							</p>
						</div>
					)}

					{dirty && (
						<p className="text-xs text-tone-amber-fg">
							{tn('moderation.dirtyNote')}
						</p>
					)}
				</Card>
			)}

			<ConfirmDialog
				open={revertOpen}
				onOpenChange={setRevertOpen}
				title={tn('templates.revertTitle')}
				description={tn('templates.revertDescription', {
					code: template.code,
					channel: template.channel,
					locale: template.locale,
				})}
				confirmLabel={tn('templates.revert')}
				variant="destructive"
				loading={deleteTemplate.isPending}
				onConfirm={() => void onRevert()}
			/>
		</div>
	);
}
