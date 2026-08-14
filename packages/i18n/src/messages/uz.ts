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
			active: 'Faol',
			inactive: 'Nofaol',
		},
		field: {
			selectDate: 'Sanani tanlang',
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
			/** 403 — the server saw the request but refused it. */
			forbidden: 'Sizda bu amalni bajarish huquqi yoʻq.',
			requestFailed: 'Soʻrov bajarilmadi.',
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
		studentCode: 'Oʻquvchi kodi',
		studentCodePlaceholder: 'A1234567',
		password: 'Parol',
		staffConsole: 'Xodimlar paneli',
		teacherConsole: 'Oʻqituvchi paneli',
		studentConsole: 'Oʻquvchi paneli',
		platformConsole: 'Platforma paneli',
		teacherSignIn: 'Oʻqituvchi sifatida kirish',
		studentSignIn: 'Oʻquvchi sifatida kirish',
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
			invoices: 'Invoyslar',
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
			// student console
			home: 'Bosh sahifa',
			progress: 'Natijalar',
			leaderboard: 'Reyting',
			billing: 'Toʻlovlar',
			notifications: 'Bildirishnomalar',
		},
		shell: {
			expandSidebar: 'Yon panelni ochish',
			collapseSidebar: 'Yon panelni yigʻish',
			searchPlaceholder: 'Oʻquvchi, invoys, guruh qidirish…',
			searchPlatform: 'Tashkilot, foydalanuvchi, obuna qidirish…',
			notifications: 'Bildirishnomalar',
			moreOptions: 'Boshqa amallar',
			allBranches: 'Barcha filiallar',
			branches: 'Filiallar',
			collapse: 'Yigʻish',
		},
	},

	/**
	 * Domain enum labels, keyed exactly like `@repo/ui`'s `STATUS_MAPS` — one
	 * group per `StatusKind`, values normalized (lowercase, `_`-joined).
	 *
	 * `@repo/ui` owns the *tone* of a status pill; the *words* are content and
	 * belong here. `StatusBadge` takes the label as `children`, so nothing in
	 * `ui` needs to know this file exists (conventions.md §7 — presentational
	 * components take copy as props). Reach them through `useStatusLabel()`,
	 * which normalizes the raw backend value and falls back gracefully when the
	 * API grows a status the catalog hasn't caught up with.
	 */
	enums: {
		domain: {
			invoice: {
				draft: 'Qoralama',
				unpaid: 'Toʻlanmagan',
				partial: 'Qisman',
				paid: 'Toʻlangan',
				overdue: 'Muddati oʻtgan',
				void: 'Bekor qilingan',
			},
			payment: {
				success: 'Muvaffaqiyatli',
				succeeded: 'Muvaffaqiyatli',
				completed: 'Yakunlangan',
				pending: 'Kutilmoqda',
				failed: 'Xatolik',
				refunded: 'Qaytarilgan',
			},
			session: {
				scheduled: 'Rejalashtirilgan',
				completed: 'Yakunlangan',
				cancelled: 'Bekor qilingan',
				rescheduled: 'Koʻchirilgan',
				substitute: 'Oʻrinbosar',
			},
			attendance: {
				present: 'Kelgan',
				absent: 'Kelmagan',
				late: 'Kechikkan',
				excused: 'Sababli',
			},
			student: {
				active: 'Faol',
				inactive: 'Nofaol',
				graduated: 'Bitirgan',
				suspended: 'Toʻxtatilgan',
			},
			enrollment: {
				active: 'Faol',
				suspended: 'Toʻxtatilgan',
				dropped: 'Tark etgan',
				completed: 'Yakunlangan',
				transferred: 'Koʻchirilgan',
			},
			staff: {
				active: 'Faol',
				on_leave: 'Taʼtilda',
				inactive: 'Nofaol',
			},
			lead: {
				new: 'Yangi',
				contacted: 'Bogʻlanildi',
				trial_booked: 'Sinov darsi belgilandi',
				enrolled: 'Qabul qilindi',
				lost: 'Yoʻqotildi',
			},
			lead_source: {
				instagram: 'Instagram',
				telegram: 'Telegram',
				referral: 'Tavsiya',
				walk_in: 'Oʻzi kelgan',
				website: 'Veb-sayt',
				other: 'Boshqa',
			},
			assessment: {
				quiz: 'Test',
				midterm: 'Oraliq nazorat',
				final: 'Yakuniy nazorat',
				mock: 'Sinov imtihoni',
				homework: 'Uy vazifasi',
			},
			report_card: {
				draft: 'Qoralama',
				published: 'Chop etilgan',
			},
			payroll: {
				live: 'Joriy',
				finalized: 'Yakunlangan',
				paid: 'Toʻlangan',
			},
			payroll_rate: {
				fixed: 'Belgilangan',
				hourly: 'Soatbay',
				percent: 'Foizli',
			},
			notification: {
				queued: 'Navbatda',
				sent: 'Yuborilgan',
				delivered: 'Yetkazilgan',
				failed: 'Xatolik',
			},
			notification_type: {
				payment: 'Toʻlov',
				grade: 'Baho',
				schedule: 'Jadval',
				absence: 'Davomat',
				broadcast: 'Eʼlon',
			},
			material: {
				pdf: 'PDF',
				video: 'Video',
				homework: 'Uy vazifasi',
				link: 'Havola',
			},
			visibility: {
				group: 'Guruh',
				branch: 'Filial',
				tenant: 'Tashkilot',
			},
			room: {
				classroom: 'Sinfxona',
				lab: 'Laboratoriya',
				online: 'Onlayn',
			},
			channel: {
				sms: 'SMS',
				telegram: 'Telegram',
				email: 'Elektron pochta',
				push: 'Push',
			},
			fee_cycle: {
				monthly: 'Oylik',
				per_session: 'Har dars uchun',
			},
			invoice_line_item: {
				tuition: 'Oʻqish toʻlovi',
				late_fee: 'Kechikish jarimasi',
				adjustment: 'Tuzatish',
				package: 'Paket',
				other: 'Boshqa',
			},
			expense: {
				rent: 'Ijara',
				utilities: 'Kommunal xarajatlar',
				marketing: 'Marketing',
				salary: 'Ish haqi',
				other: 'Boshqa',
			},
			role: {
				owner: 'Egasi',
				admin: 'Administrator',
				manager: 'Menejer',
				teacher: 'Oʻqituvchi',
				student: 'Oʻquvchi',
				parent: 'Ota-ona',
				super_admin: 'Super admin',
			},
			tenant: {
				active: 'Faol',
				trialing: 'Sinov muddati',
				past_due: 'Muddati oʻtgan',
				suspended: 'Toʻxtatilgan',
				cancelled: 'Bekor qilingan',
			},
			system: {
				healthy: 'Sogʻlom',
				degraded: 'Sekinlashgan',
				down: 'Ishlamayapti',
			},
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
		integerInvalid: 'Butun son kiriting',
		dateInvalid: 'Sana notoʻgʻri',
		minValue: 'Qiymat kamida {{min}} boʻlishi kerak',
		maxValue: 'Qiymat koʻpi bilan {{max}} boʻlishi mumkin',
		amountPositive: 'Summa noldan katta boʻlishi kerak',
		amountMax: 'Summa {{max}} dan oshmasligi kerak',
		percentRange: '0 va 100 orasida qiymat kiriting',
		selectRequired: 'Tanlov qiling',
		selectOne: 'Kamida bitta variantni tanlang',
		dateRangeInvalid: 'Tugash sanasi boshlanish sanasidan keyin boʻlishi kerak',
		timeRangeInvalid: 'Tugash vaqti boshlanish vaqtidan keyin boʻlishi kerak',
		passwordMismatch: 'Parollar mos kelmadi',
	},

	/**
	 * The full-screen subscription-block state, shared by the read-only consoles
	 * (teacher, student). These roles cannot pay — only an OWNER on the admin
	 * console can — so the copy points to the center's administrator and offers no
	 * renew action. Rendered when access is lapsed (a 402 on any tenant route, or
	 * `subscription.hasAccess === false` from login/refresh).
	 */
	subscription: {
		expired: {
			title: 'Obuna muddati tugagan',
			description:
				'Markazingiz obunasi muddati tugagan. Kirishni tiklash uchun markaz administratori bilan bogʻlaning.',
			planLabel: 'Reja',
			expiredOnLabel: 'Tugagan sana',
		},
	},
} as const;
