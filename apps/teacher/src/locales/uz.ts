/**
 * Teacher console — **source-of-truth catalog** for this app's feature screens.
 *
 * Shell vocabulary (nav, auth, common actions, table states, enum labels,
 * validation) is NOT here — it lives in `@repo/i18n` and is reached with
 * `useT(...)`. This file holds only copy that belongs to the `/teach` surface,
 * so the admin and internal-platform bundles never carry it
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
		logOut: 'Chiqish',
		settings: 'Sozlamalar',
		back: 'Orqaga',
		backToSignIn: 'Kirish sahifasiga qaytish',
		tryAgain: 'Qayta urinish',
		genericErrorTitle: 'Xatolik yuz berdi',
		genericErrorDescription:
			'Nimadir xato ketdi. Bir ozdan keyin qayta urinib koʻring.',
		notTeacherTitle: 'Bu konsol oʻqituvchilar uchun',
		notTeacherDescription:
			'Hisobingizda oʻqituvchi roli yoʻq. Oʻqituvchi hisobi bilan kiring yoki admin konsolidan foydalaning.',
		toastForbidden: 'Sizda bu amalni bajarish huquqi yoʻq.',
		toastGeneric: 'Nimadir xato ketdi. Qayta urinib koʻring.',
		prevWeek: 'Oldingi hafta',
		nextWeek: 'Keyingi hafta',
		prevMonth: 'Oldingi oy',
		nextMonth: 'Keyingi oy',
		thisMonth: 'Shu oy',
		goToThisMonth: 'Shu oyga oʻtish',
		listView: 'Roʻyxat koʻrinishi',
		tableView: 'Jadval koʻrinishi',
	},

	schedule: {
		title: 'Bugun',
		today: 'Bugun',
		errorTitle: 'Dars jadvalini yuklab boʻlmadi',
		errorDescription:
			'Darslaringizni yuklashda xatolik yuz berdi. Bir ozdan keyin qayta urinib koʻring.',
		emptyBranch: 'Bu filialda darslar yoʻq',
		emptyBranchDescription:
			'Siz boshqa joyda dars berasiz — ularni koʻrish uchun yuqoridagi paneldan «Barcha filiallar»ni tanlang.',
		emptyDay: '{{when}} darslar yoʻq',
		emptyDayDescription:
			'Dam oling. Keyingi dars kuningiz yuqoridagi chiziqda belgilangan.',
		attendanceAction: 'Davomat',
		marksAction: 'Baholar',
		noSessionsTitle: 'Rejalashtirilgan darslar yoʻq',
		noSessionsDescription:
			'Darslar guruhning haftalik jadvalidan, unga boshlanish va tugash sanasi belgilangach yaratiladi.',
		noSessionsThisMonth: 'Bu oyda darslar yoʻq',
		noSessionsThisMonthDescription:
			'Bu guruhda tanlangan oyda rejalashtirilgan darslar yoʻq.',
		sessionErrorTitle: 'Bu darsni yuklab boʻlmadi',
		sessionsErrorDescription:
			'Bu guruh darslarini yuklashda xatolik yuz berdi. Bir ozdan keyin qayta urinib koʻring.',
	},

	groups: {
		title: 'Mening guruhlarim',
		back: 'Guruhlarga qaytish',
		errorTitle: 'Guruhlaringizni yuklab boʻlmadi',
		errorDescription:
			'Siz dars beradigan guruhlarni yuklashda xatolik yuz berdi. Bir ozdan keyin qayta urinib koʻring.',
		notFoundTitle: 'Bu guruhni yuklab boʻlmadi',
		notFoundDescription:
			'U mavjud boʻlmasligi yoki siz dars beradigan guruhlardan biri boʻlmasligi mumkin.',
		rosterErrorTitle: 'Roʻyxatni yuklab boʻlmadi',
		rosterErrorDescription:
			'Bu guruh oʻquvchilarini yuklashda xatolik yuz berdi. Bir ozdan keyin qayta urinib koʻring.',
		rosterEmptyTitle: 'Oʻquvchilar qabul qilinmagan',
		rosterEmptyDescription:
			'Bu guruhga qabul qilingan oʻquvchilar shu yerda koʻrinadi.',
		field: {
			course: 'Kurs',
			branch: 'Filial',
			room: 'Xona',
			filled: 'Toʻldirilgan',
		},
	},

	attendance: {
		title: 'Davomat',
		saved: 'Davomat saqlandi',
		save: 'Davomatni saqlash',
		allPresent: 'Barchasi bor',
		markAllPresent: 'Barchasini bor deb belgilash',
		markedAllPresent: 'Barchasi bor deb belgilandi',
		errorTitle: 'Davomatni yuklab boʻlmadi',
		emptyTitle: 'Hali davomat yoʻq',
		cancelledTitle: 'Bu dars bekor qilingan',
		cancelledDescription: 'Bekor qilingan dars uchun davomat olib boʻlmaydi.',
		noStudentsDescription: 'Bu guruhda hali belgilanadigan faol oʻquvchilar yoʻq.',
	},

	marks: {
		title: 'Baholar',
		saved: 'Baholar saqlandi',
		save: 'Baholarni saqlash',
		errorTitle: 'Baholarni yuklab boʻlmadi',
		cancelledDescription: 'Bekor qilingan dars uchun baho qoʻyib boʻlmaydi.',
		gradingScale: 'Baholash shkalasi',
		saveGradingScale: 'Baholash shkalasini saqlash',
		gradingScaleUpdated: 'Baholash shkalasi yangilandi',
		gradingScaleErrorTitle: 'Baholash shkalasini yuklab boʻlmadi',
		gradingScaleErrorDescription:
			'Bu guruh baholash sozlamalarini yuklashda xatolik yuz berdi. Bir ozdan keyin qayta urinib koʻring.',
		gradingScaleHint:
			'Bu shkala kundalik baholar qanday qoʻyilishi va oʻrtacha qiymat qanday hisoblanishini belgilaydi',
		type: {
			POINTS: 'Ball',
			PERCENTAGE: 'Foiz',
			LETTER: 'Harf',
		},
		column: {
			student: 'Oʻquvchi',
			avg: 'Oʻrtacha',
			rank: 'Oʻrin',
			rate: 'Koʻrsatkich',
			attendance: 'Davomat',
			marks: 'Baholar',
		},
		topBand: '90% va undan yuqori',
	},

	payroll: {
		title: 'Mening maoshim',
		errorTitle: 'Maoshingizni yuklab boʻlmadi',
		errorDescription:
			'Maosh maʼlumotlarini yuklashda xatolik yuz berdi. Bir ozdan keyin qayta urinib koʻring.',
		emptyTitle: 'Hali koʻrsatiladigan maosh yoʻq',
		emptyDescription:
			'Ofis maosh modelingizni sozlagach va yakunlangan darslaringiz boʻlgach, maoshingiz shu yerda koʻrinadi.',
	},

	students: {
		profileTitle: 'Oʻquvchi profili',
		errorTitle: 'Bu oʻquvchini yuklab boʻlmadi',
		errorDescription:
			'U mavjud boʻlmasligi yoki siz dars beradigan guruhlarga qabul qilinmagan boʻlishi mumkin.',
		guardiansErrorTitle: 'Vasiylarni yuklab boʻlmadi',
		guardiansErrorDescription:
			'Bu oʻquvchining vasiylarini yuklashda xatolik yuz berdi. Bir ozdan keyin qayta urinib koʻring.',
		guardiansEmptyTitle: 'Vasiylar qayd etilmagan',
		guardiansEmptyDescription:
			'Bu oʻquvchi uchun vasiy qoʻshishni qabul boʻlimidan soʻrang.',
		field: {
			dateOfBirth: 'Tugʻilgan sana',
			gender: 'Jinsi',
			phone: 'Telefon',
			email: 'Elektron pochta',
		},
	},

	profile: {
		title: 'Profil',
		errorTitle: 'Profilingizni yuklab boʻlmadi',
		errorDescription:
			'Hisobingiz maʼlumotlarini yuklashda xatolik yuz berdi. Bir ozdan keyin qayta urinib koʻring.',
		staffId: 'Xodim IDsi',
		branches: 'Filiallar',
	},
} as const;
