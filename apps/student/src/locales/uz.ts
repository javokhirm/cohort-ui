/**
 * Student app — **source-of-truth catalog** for this app's feature screens.
 *
 * Shell vocabulary (nav, auth, common actions, table states, enum labels,
 * validation) is NOT here — it lives in `@repo/i18n` and is reached with
 * `useT(...)`. This file holds only copy this app's screens say, so the admin,
 * teacher, parent and internal-platform bundles never carry it
 * (docs/folder-structure.md).
 *
 * One namespace per feature folder under `src/features/`. `ru.ts` and `en.ts`
 * annotate themselves against this file's shape, so a key added here without a
 * translation fails `check-types` there.
 *
 * Uses the modifier letter ʻ (U+02BB) for oʻ/gʻ — the correct character, and it
 * never collides with the surrounding JS quotes.
 */
export const uz = {
	shell: {
		notStudentTitle: 'Bu ilova oʻquvchilar uchun',
		notStudentDescription:
			'Bu hisobingiz oʻquvchi sifatida ruxsatga ega emas. Boshqa hisob bilan kiring.',
		backToSignIn: 'Kirish sahifasiga qaytish',
		scheduleSubtitle: 'Darslarni koʻrish uchun kunni tanlang',
		progressSubtitle: 'Natijalar, izohlar va davomat',
		billingSubtitle: 'Invoyslar va toʻlovlar',
		openNotifications: 'Bildirishnomalarni ochish',
		openProfile: 'Profilni ochish',
		profileSubtitle: '{{code}} · {{branch}}',
	},
	home: {
		greetingMorning: 'Xayrli tong, {{name}}',
		greetingAfternoon: 'Xayrli kun, {{name}}',
		greetingEvening: 'Xayrli kech, {{name}}',
		todaySectionTitle: 'Bugun',
		todayEmptyTitle: 'Bugun darslar yoʻq',
		todayEmptyDescription: 'Bugungi kunga rejalashtirilgan darsingiz yoʻq.',
		attendanceRate: 'Davomat',
		streak: 'Ketma-ketlik',
		streakHint: 'dars',
		unread: 'Oʻqilmagan',
		balanceDue: '{{amount}} toʻlov muddati yetib keldi',
		latestResult: 'Soʻnggi natija',
		errorTitle: 'Maʼlumotlarni yuklab boʻlmadi',
		errorDescription: 'Qayta urinib koʻring yoki sahifani yangilang.',
		retry: 'Qayta urinish',
	},
	profile: {
		contact: 'Aloqa',
		phoneNumber: 'Telefon raqami',
		email: 'Elektron pochta',
		preferredLanguage: 'Tanlangan til',
		preferences: 'Sozlamalar',
		theme: 'Mavzu',
		helpAndContact: 'Yordam va aloqa',
		logOut: 'Chiqish',
		savedTitle: 'Profil saqlandi',
		savedDescription: 'Oʻzgarishlaringiz yangilandi.',
		saveFailedTitle: 'Saqlab boʻlmadi',
		contactTitle: 'Markaz bilan bogʻlanish',
		contactDescription: 'Qabulxona: {{phone}}',
		contactUnavailable: 'Telefon raqami koʻrsatilmagan — markazga borib soʻrang.',
		errorTitle: 'Profilni yuklab boʻlmadi',
		errorDescription: 'Qayta urinib koʻring yoki sahifani yangilang.',
		retry: 'Qayta urinish',
	},
} as const;
