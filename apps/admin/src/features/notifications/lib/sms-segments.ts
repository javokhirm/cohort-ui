/**
 * Client-side SMS part accounting for the template editor's live counter.
 *
 * A deliberate mirror of the backend's `countSmsParts` (`cohort-be`
 * `src/infra/sms/phone.util.ts`): same GSM 03.38 charset, same
 * 160/153 (GSM-7) and 70/67 (UCS-2) part sizes, so the number staff see while
 * typing matches what the outbox will bill. The server stays authoritative — this
 * is a display estimate for instant feedback, computed on the *rendered* message
 * (never the raw `{{body}}`), since that is what actually goes on the wire.
 *
 * Cyrillic (`ru`) and the Uzbek `ʻ`/`ʼ` fall outside GSM-7, forcing the whole
 * message to UCS-2 at 70 chars per part instead of 160 — roughly triple the cost,
 * which is exactly what a center needs to see before saving.
 *
 * NOTE for the engineer: this duplicates a backend algorithm. If a second app
 * (teacher/student console) ever needs it, it's a candidate to promote into a
 * shared `@repo/*` package rather than copy again.
 */

/** The GSM 03.38 default alphabet plus its extension table (matches the backend). */
const GSM7_CHARS = new Set(
	Array.from(
		'@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
			'¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà' +
			'^{}\\[~]|€',
	),
);

export type SmsEncoding = 'GSM-7' | 'UCS-2';

export interface SmsAnalysis {
	/** Rendered character count (code points, so an emoji counts once). */
	chars: number;
	encoding: SmsEncoding;
	/** Billable parts. */
	segments: number;
	/** Characters per part for the encoding's single-part size (70 or 160). */
	perSegment: number;
}

function isGsm7(text: string): boolean {
	return Array.from(text).every((char) => GSM7_CHARS.has(char));
}

/** Analyze a (rendered) message for its encoding, length and billable parts. */
export function analyzeSms(text: string): SmsAnalysis {
	const unicode = !isGsm7(text);
	const single = unicode ? 70 : 160;
	const concatenated = unicode ? 67 : 153;
	const chars = Array.from(text).length;
	const segments =
		chars === 0 ? 0 : chars <= single ? 1 : Math.ceil(chars / concatenated);

	return {
		chars,
		encoding: unicode ? 'UCS-2' : 'GSM-7',
		segments,
		perSegment: single,
	};
}
