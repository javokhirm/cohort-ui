import type { TranslationsOf } from '@repo/i18n';

import type { uz } from './uz';

/** Russian translation of the teacher catalog. `uz` is the source of truth. */
export const ru: TranslationsOf<typeof uz> = {
	shell: {
		logOut: 'Выйти',
		settings: 'Настройки',
		back: 'Назад',
		backToSignIn: 'Назад ко входу',
		tryAgain: 'Повторить',
		genericErrorTitle: 'Что-то пошло не так',
		genericErrorDescription: 'Что-то пошло не так. Повторите через минуту.',
		notTeacherTitle: 'Эта консоль для преподавателей',
		notTeacherDescription:
			'У вашего аккаунта нет роли преподавателя. Войдите под учётной записью преподавателя или используйте консоль администратора.',
		toastForbidden: 'У вас нет прав на это действие.',
		toastGeneric: 'Что-то пошло не так. Попробуйте ещё раз.',
		prevWeek: 'Предыдущая неделя',
		nextWeek: 'Следующая неделя',
		prevMonth: 'Предыдущий месяц',
		nextMonth: 'Следующий месяц',
		thisMonth: 'Этот месяц',
		goToThisMonth: 'Перейти к этому месяцу',
		listView: 'Списком',
		tableView: 'Таблицей',
		unsavedChanges: 'Несохранённые изменения',
		savedState: 'Сохранено',
		myBranches: 'Мои филиалы',
	},

	schedule: {
		title: 'Сегодня',
		today: 'Сегодня',
		errorTitle: 'Не удалось загрузить расписание',
		errorDescription: 'Не удалось получить ваши занятия. Повторите через минуту.',
		emptyBranch: 'В этом филиале занятий нет',
		emptyBranchDescription:
			'Вы преподаёте и в других филиалах — выберите «Все филиалы» в верхней панели, чтобы увидеть их.',
		emptyDay: 'Занятий {{when}} нет',
		emptyDayDescription:
			'Отдыхайте. Ваш следующий учебный день отмечен точкой на полосе выше.',
		attendanceAction: 'Посещаемость',
		marksAction: 'Оценки',
		noSessionsTitle: 'Занятия не запланированы',
		noSessionsDescription:
			'Занятия создаются из недельного расписания группы, когда у неё заданы даты начала и окончания.',
		noSessionsThisMonth: 'В этом месяце занятий нет',
		noSessionsThisMonthDescription:
			'У этой группы нет запланированных занятий в выбранном месяце.',
		sessionErrorTitle: 'Не удалось загрузить занятие',
		sessionsErrorDescription:
			'Не удалось получить занятия этой группы. Повторите через минуту.',
		greetingMorning: 'Доброе утро',
		greetingAfternoon: 'Добрый день',
		greetingEvening: 'Добрый вечер',
		emptyWhenToday: 'сегодня',
		emptyWhenOnDate: '{{date}}',
		noRoom: 'Аудитория не указана',
	},

	groups: {
		title: 'Мои группы',
		back: 'Назад к группам',
		errorTitle: 'Не удалось загрузить ваши группы',
		errorDescription:
			'Не удалось получить группы, в которых вы преподаёте. Повторите через минуту.',
		notFoundTitle: 'Не удалось загрузить группу',
		notFoundDescription:
			'Она может не существовать или не входить в число групп, где вы преподаёте.',
		rosterErrorTitle: 'Не удалось загрузить состав',
		rosterErrorDescription:
			'Не удалось получить учеников этой группы. Повторите через минуту.',
		rosterEmptyTitle: 'Учеников нет',
		rosterEmptyDescription: 'Ученики, зачисленные в эту группу, появятся здесь.',
		field: {
			course: 'Курс',
			branch: 'Филиал',
			room: 'Аудитория',
			filled: 'Заполнено',
		},
		groupFallback: 'Группа',
		groupNumber: 'Группа №{{id}}',
		tabRoster: 'Состав',
		tabSchedule: 'Расписание',
		tabGrading: 'Оценивание',
		unnamedStudent: 'Без имени',
		unknownBranch: 'Неизвестный филиал',
		attendancePercent: '{{rate}}% посещаемости',
		attendanceRateShort: '{{rate}}% пос.',
		emptyBranch: 'В этом филиале групп нет',
		emptyBranchDescription:
			'Вы преподаёте и в других филиалах — выберите «Все филиалы» в верхней панели, чтобы увидеть эти группы.',
		emptyTitle: 'Групп пока нет',
		emptyDescription: 'Группы, которые вам назначены, появятся здесь.',
		groupCount_one: '{{count}} группа',
		groupCount_few: '{{count}} группы',
		groupCount_many: '{{count}} групп',
		groupCount_other: '{{count}} групп',
		hiddenSuffix: ' · {{count}} скрыто фильтром филиала',
	},

	attendance: {
		title: 'Посещаемость',
		saved: 'Посещаемость сохранена',
		save: 'Сохранить посещаемость',
		allPresent: 'Все присутствуют',
		markAllPresent: 'Отметить всех присутствующими',
		markedAllPresent: 'Все отмечены присутствующими',
		errorTitle: 'Не удалось загрузить посещаемость',
		emptyTitle: 'Посещаемости пока нет',
		cancelledTitle: 'Это занятие отменено',
		cancelledDescription: 'Для отменённого занятия посещаемость не отмечается.',
		noStudentsDescription: 'В этой группе пока нет активных учеников для отметки.',
		takeTitle: 'Отметить посещаемость',
		sessionNumber: 'Занятие №{{id}}',
		presentAbsent: '{{present}} присут. · {{absent}} отсут.',
		notMarked: 'не отмечено',
		studentFallback: 'Ученик',
		cellLabel: '{{name}}, {{date}} — {{status}}',
		dateCancelled: '{{date}} — отменено',
		onlyTodayEditable: 'Редактируется только сегодняшний столбец',
		markAllHintNoSession: 'На сегодня занятий нет',
		markAllHintCancelled: 'Сегодняшнее занятие отменено',
		markAllHintNoStudents: 'Учеников нет',
		markAllHintReady: 'Отметит всех учеников присутствующими на сегодняшнем занятии',
	},

	marks: {
		title: 'Оценки',
		saved: 'Оценки сохранены',
		save: 'Сохранить оценки',
		errorTitle: 'Не удалось загрузить оценки',
		cancelledDescription: 'Для отменённого занятия оценки не выставляются.',
		gradingScale: 'Шкала оценивания',
		saveGradingScale: 'Сохранить шкалу оценивания',
		gradingScaleUpdated: 'Шкала оценивания обновлена',
		gradingScaleErrorTitle: 'Не удалось загрузить шкалу оценивания',
		gradingScaleErrorDescription:
			'Не удалось получить настройки оценивания этой группы. Повторите через минуту.',
		gradingScaleHint:
			'Эта шкала определяет, как выставляются ежедневные оценки и как считается средний балл',
		type: {
			POINTS: 'Баллы',
			PERCENTAGE: 'Проценты',
			LETTER: 'Буквы',
		},
		column: {
			student: 'Ученик',
			avg: 'Средн.',
			rank: 'Место',
			rate: 'Показатель',
			attendance: 'Посещаемость',
			marks: 'Оценки',
		},
		topBand: '90% и выше',
		midBand: '{{low}}–89%',
		lowBand: 'ниже {{low}}%',
		enterTitle: 'Выставить оценки',
		sessionNumber: 'Занятие №{{id}}',
		notMarked: 'не оценено',
		score: 'оценка',
		cellLabel: '{{name}}, {{date}} — {{status}}',
		dateCancelled: '{{date}} — отменено',
		markedProgress: '{{marked}} из {{total}} оценено',
		markFor: 'Оценка для {{name}}',
		scalePoints: 'Баллы · максимум {{max}}',
		scalePercentage: 'Проценты · 0–{{max}}',
		scaleLetter: 'Буквенная оценка · A–F',
		scaleShortPoints: 'Баллы /{{max}}',
		scaleShortPercentage: 'Проценты /{{max}}',
		scaleShortLetter: 'Буквы A–F',
		scaleUsedFor: '{{scale}} · для ежедневных оценок',
		scaleNotSet: 'Ещё не задано · нажмите, чтобы выбрать',
		gradingScaleDescription: 'Как выставляются ежедневные оценки для этой группы.',
		scaleType: 'Тип шкалы',
		letterHint: 'Буквенные оценки A–F вводятся прямо в листе оценок.',
		maxPercent: 'Максимум (%)',
		maxPointsLabel: 'Максимум баллов',
		allowHalf: 'Разрешить половинные баллы',
		preview: 'Предпросмотр',
		previewPoints: 'Ежедневные баллы · максимум {{max}}',
	},

	payroll: {
		title: 'Моя зарплата',
		errorTitle: 'Не удалось загрузить зарплату',
		errorDescription:
			'Не удалось получить данные о зарплате. Повторите через минуту.',
		emptyTitle: 'Пока нечего показать',
		emptyDescription:
			'Зарплата появится здесь, когда офис настроит вашу модель оплаты и у вас будут проведённые занятия.',
		advancesTitle: 'Авансы',
		advancesHint:
			'Зарплата, взятая до расчёта — вычитается из вашей суммы к выплате.',
		advanceFallback: 'Аванс',
		studentsTitle: 'Ученики',
		noCompletedSessions:
			'В этом месяце нет проведённых занятий с зачисленными учениками.',
		breakdownSubtitle_one: '{{count}} ученик · проведено вами из общего числа',
		breakdownSubtitle_few: '{{count}} ученика · проведено вами из общего числа',
		breakdownSubtitle_many: '{{count}} учеников · проведено вами из общего числа',
		breakdownSubtitle_other: '{{count}} ученика · проведено вами из общего числа',
		sessionsCount: '{{taught}}/{{planned}} занятий',
		tuitionSuffix: ' · {{amount}} оплата обучения',
		revenueShareNote:
			'Оплата обучения каждого ученика делится на все занятия группы за месяц, и вы зарабатываете за те, что провели. Ещё не проведённые занятия не оплачиваются, отменённое занятие не оплачивается вовсе, а ученик, присоединившийся в середине месяца, считается только со дня зачисления.',
		referenceNote:
			'Приведено для справки. Вам платят на указанной выше основе, а не за каждого ученика.',
		netPayable: 'К выплате',
		computed: 'Начислено',
		liveNote:
			'В реальном времени — цифры обновляются по проведённым занятиям до закрытия периода.',
		advancesExceedNote:
			'Авансы превышают начисленную оплату — сумма к выплате за этот месяц удержана на нуле.',
		calcNote:
			'Рассчитано по {{sessions}} проведённым занятиям ({{hours}} ч). Точная сумма {{exact}}, округлено до {{rounded}}.',
	},

	students: {
		profileTitle: 'Профиль ученика',
		errorTitle: 'Не удалось загрузить ученика',
		errorDescription:
			'Он может не существовать или не быть зачислен в одну из ваших групп.',
		guardiansErrorTitle: 'Не удалось загрузить представителей',
		guardiansErrorDescription:
			'Не удалось получить представителей этого ученика. Повторите через минуту.',
		guardiansEmptyTitle: 'Представителей нет',
		guardiansEmptyDescription:
			'Попросите администратора добавить представителя для этого ученика.',
		field: {
			dateOfBirth: 'Дата рождения',
			gender: 'Пол',
			phone: 'Телефон',
			email: 'Эл. почта',
		},
		sectionContact: 'Контакты',
		sectionGuardians: 'Представители',
		unnamedContact: 'Без имени',
		unnamedStudent: 'Без имени',
		primary: 'Основной',
		gender: {
			M: 'Мужской',
			F: 'Женский',
			O: 'Другой',
		},
	},

	profile: {
		title: 'Профиль',
		errorTitle: 'Не удалось загрузить профиль',
		errorDescription:
			'Не удалось получить данные вашего аккаунта. Повторите через минуту.',
		staffId: 'Табельный номер',
		branches: 'Филиалы',
		phone: 'Телефон',
		email: 'Эл. почта',
		allBranches: 'Все филиалы',
		appearance: 'Оформление',
		darkMode: 'Тёмная тема',
		lightMode: 'Светлая тема',
	},
};
