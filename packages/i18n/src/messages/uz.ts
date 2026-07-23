/**
 * Uzbek — the **source-of-truth catalog**. `ru` and `en` must carry exactly the
 * same keys; the typed `resources` declaration in `../types.ts` derives `t()`'s
 * key union from this file, so a key missing here is a key no app can use, and a
 * key missing from `ru`/`en` falls back to the Uzbek string at runtime.
 *
 * Scope is **Phase 1**: the shell (nav, topbar, auth) plus cross-cutting
 * vocabulary (actions, table states, validation, enum labels). Feature screens
 * keep their own namespaces under `apps/<app>/src/locales/`.
 *
 * Backend error text is NOT duplicated here — the API already returns
 * `error.message` translated into the requested language (we send `x-lang`), so
 * screens surface that string directly. Only client-side failures the server
 * never sees (offline, unparseable response) live in `common.error.*`.
 *
 * Uses the modifier letter ʻ (U+02BB) for oʻ/gʻ rather than a typewriter
 * apostrophe — it is the correct character and it never collides with the
 * surrounding JS quotes.
 */
export const uz = {
	common: {
		action: {
			save: 'Saqlash',
			cancel: 'Bekor qilish',
			delete: 'Oʻchirish',
			edit: 'Tahrirlash',
			create: 'Yaratish',
			add: 'Qoʻshish',
			search: 'Qidirish',
			filter: 'Filtr',
			reset: 'Tozalash',
			close: 'Yopish',
			confirm: 'Tasdiqlash',
			back: 'Orqaga',
			next: 'Keyingi',
			previous: 'Oldingi',
			apply: 'Qoʻllash',
			export: 'Eksport',
			refresh: 'Yangilash',
			view: 'Koʻrish',
			copy: 'Nusxalash',
			submit: 'Yuborish',
			retry: 'Qayta urinish',
			more: 'Yana',
		},
		state: {
			loading: 'Yuklanmoqda…',
			saving: 'Saqlanmoqda…',
			all: 'Barchasi',
			none: 'Yoʻq',
			yes: 'Ha',
			no: 'Yoʻq',
			optional: 'Ixtiyoriy',
		},
		table: {
			empty: 'Bu yerda hali maʼlumot yoʻq',
			emptyFiltered: 'Tanlangan filtrlarga mos natija topilmadi',
			error: 'Maʼlumotlarni yuklab boʻlmadi',
			errorHint: 'Qayta urinib koʻring yoki sahifani yangilang.',
			noResults: 'Natija topilmadi',
		},
		pagination: {
			showing: '{{from}}–{{to}} / {{total}}',
			page: '{{page}}-sahifa, jami {{total}}',
			perPage: 'Sahifada',
			first: 'Birinchi sahifa',
			last: 'Oxirgi sahifa',
			next: 'Keyingi sahifa',
			previous: 'Oldingi sahifa',
		},
		error: {
			/** Only for failures the backend never saw — otherwise show `error.message`. */
			network: 'Serverga ulanib boʻlmadi. Internet aloqasini tekshiring.',
			unknown: 'Nimadir xato ketdi. Qayta urinib koʻring.',
		},
		language: {
			label: 'Til',
			/** Endonyms — deliberately identical in every catalog, never translated. */
			uz: 'Oʻzbekcha',
			ru: 'Русский',
			en: 'English',
		},
		theme: {
			label: 'Koʻrinish',
			light: 'Yorugʻ',
			dark: 'Tungi',
		},
	},

	auth: {
		signIn: 'Kirish',
		signingIn: 'Kirilmoqda…',
		signOut: 'Chiqish',
		phone: 'Telefon raqami',
		password: 'Parol',
		staffConsole: 'Xodimlar paneli',
		teacherConsole: 'Oʻqituvchi paneli',
		platformConsole: 'Platforma paneli',
		teacherSignIn: 'Oʻqituvchi sifatida kirish',
		poweredBy: 'Ishlab chiquvchi',
		invalidCredentials: 'Telefon raqami yoki parol notoʻgʻri.',
		continue: 'Davom etish',
		workEmail: 'Ish elektron pochtasi',
		couldNotSignIn: 'Tizimga kirib boʻlmadi.',
		otp: {
			title: 'Tasdiqlash kodi',
			hint: 'Kod elektron pochtangizga yuborildi.',
			code: 'Kod',
			verify: 'Tasdiqlash',
			resend: 'Kodni qayta yuborish',
		},
		/** Super-admin (internal-platform) two-step sign-in + its marketing rail. */
		operator: {
			badge: 'Operator sifatida kirish',
			title: 'Konsolga kiring',
			subtitle: 'Faqat Cohort platforma xodimlari uchun.',
			twoFactorTitle: 'Ikki bosqichli autentifikatsiya',
			otpSentTo: '{{email}} manziliga yuborilgan 6 xonali kodni kiriting.',
			verifyAndContinue: 'Tasdiqlash va davom etish',
			noCode: 'Kod kelmadimi?',
			invalidCode: 'Kod notoʻgʻri.',
			invalidOrExpired: 'Kod notoʻgʻri yoki muddati oʻtgan.',
			oneTimeCode: 'Bir martalik kod',
			railKicker: 'Platforma konsoli',
			railHeadline: 'Cohort tarmogʻi uchun boshqaruv markazi.',
			railBody:
				'Taʼlim markazlarini ulang, obunalar va funksiya bayroqlarini boshqaring hamda barcha ijarachilar boʻyicha platforma holatini kuzating.',
			twoFactorEnforced: '2FA majburiy',
			auditedAccess: 'Audit qilingan kirish',
		},
	},

	nav: {
		group: {
			overview: 'Umumiy',
			crm: 'CRM',
			people: 'Odamlar',
			academics: 'Oʻquv jarayoni',
			finance: 'Moliya',
			administration: 'Boshqaruv',
			platform: 'Platforma',
			customers: 'Mijozlar',
			revenue: 'Daromad',
		},
		item: {
			// admin console
			dashboard: 'Boshqaruv paneli',
			leads: 'Lidlar / Voronka',
			students: 'Oʻquvchilar',
			staff: 'Xodimlar va HR',
			courses: 'Kurslar',
			rooms: 'Xonalar',
			groups: 'Guruhlar',
			schedule: 'Dars jadvali',
			invoices: 'Hisob-fakturalar',
			payments: 'Toʻlovlar',
			feePlans: 'Toʻlov rejalari',
			billingPolicy: 'Billing siyosati',
			discounts: 'Chegirmalar',
			expenses: 'Xarajatlar',
			payroll: 'Ish haqi',
			branches: 'Filiallar',
			// internal platform console
			platformDashboard: 'Platforma paneli',
			tenants: 'Tashkilotlar',
			userDirectory: 'Foydalanuvchilar',
			subscriptionPlans: 'Obuna rejalari',
			subscriptions: 'Obunalar',
			roleTemplates: 'Rol shablonlari',
			auditLog: 'Audit jurnali',
			settings: 'Sozlamalar',
			profileSecurity: 'Profil va xavfsizlik',
			consoleSettings: 'Konsol sozlamalari',
			// teacher console
			today: 'Bugun',
			pay: 'Maosh',
			profile: 'Profil',
			myGroups: 'Mening guruhlarim',
			myPay: 'Mening maoshim',
		},
		shell: {
			expandSidebar: 'Yon panelni ochish',
			collapseSidebar: 'Yon panelni yigʻish',
			searchPlaceholder: 'Oʻquvchi, hisob-faktura, guruh qidirish…',
			searchPlatform: 'Tashkilot, foydalanuvchi, obuna qidirish…',
			notifications: 'Bildirishnomalar',
			moreOptions: 'Boshqa amallar',
			allBranches: 'Barcha filiallar',
			branches: 'Filiallar',
			collapse: 'Yigʻish',
		},
	},

	enums: {
		role: {
			OWNER: 'Egasi',
			ADMIN: 'Administrator',
			MANAGER: 'Menejer',
			TEACHER: 'Oʻqituvchi',
			SUPER_ADMIN: 'Super admin',
			STUDENT: 'Oʻquvchi',
			PARENT: 'Ota-ona',
		},
		status: {
			ACTIVE: 'Faol',
			INACTIVE: 'Nofaol',
			PENDING: 'Kutilmoqda',
			SUSPENDED: 'Toʻxtatilgan',
			CANCELLED: 'Bekor qilingan',
			COMPLETED: 'Yakunlangan',
			SCHEDULED: 'Rejalashtirilgan',
			DRAFT: 'Qoralama',
			APPROVED: 'Tasdiqlangan',
			PAID: 'Toʻlangan',
			UNPAID: 'Toʻlanmagan',
			PARTIAL: 'Qisman toʻlangan',
			OVERDUE: 'Muddati oʻtgan',
			VOID: 'Bekor qilingan',
		},
	},

	validation: {
		required: 'Bu maydon toʻldirilishi shart',
		phoneInvalid: 'Telefon raqami notoʻgʻri (+998 XX XXX XX XX)',
		emailInvalid: 'Elektron pochta manzili notoʻgʻri',
		minLength: 'Kamida {{count}} ta belgi boʻlishi kerak',
		maxLength: 'Koʻpi bilan {{count}} ta belgi boʻlishi mumkin',
		passwordMin: 'Parol kamida {{count}} ta belgidan iborat boʻlishi kerak',
		numberInvalid: 'Son kiriting',
		numberPositive: 'Musbat son kiriting',
		dateInvalid: 'Sana notoʻgʻri',
	},
} as const;
