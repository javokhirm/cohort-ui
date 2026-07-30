import type { TranslationsOf } from '@repo/i18n';

import type { uz } from './uz';

/** Russian translation of the student catalog. `uz` is the source of truth. */
export const ru: TranslationsOf<typeof uz> = {
	shell: {
		notStudentTitle: 'Это приложение только для учеников',
		notStudentDescription:
			'Ваш аккаунт не имеет доступа как у ученика. Войдите под другим аккаунтом.',
		backToSignIn: 'Вернуться на страницу входа',
		scheduleSubtitle: 'Выберите день, чтобы увидеть занятия',
		progressSubtitle: 'Результаты, отзывы и посещаемость',
		billingSubtitle: 'Счета и платежи',
		openNotifications: 'Открыть уведомления',
		openProfile: 'Открыть профиль',
		profileSubtitle: '{{code}} · {{branch}}',
	},
	home: {
		greetingMorning: 'Доброе утро, {{name}}',
		greetingAfternoon: 'Добрый день, {{name}}',
		greetingEvening: 'Добрый вечер, {{name}}',
		nextClass: 'Следующее занятие',
		classInProgress: 'Занятие идёт',
		allDoneToday: 'На сегодня всё',
		todaySectionTitle: 'Сегодня',
		fullSchedule: 'Полное расписание',
		todayEmptyTitle: 'На сегодня занятий нет',
		todayEmptyDescription: 'У вас нет запланированных занятий на сегодня.',
		attendanceRate: 'Посещаемость',
		streak: 'Подряд',
		streakHint: 'занятий',
		balanceDue: 'Срок оплаты {{amount}} наступил',
		latestResult: 'Последний результат',
		errorTitle: 'Не удалось загрузить данные',
		errorDescription: 'Повторите попытку или обновите страницу.',
		retry: 'Повторить',
	},
	profile: {
		contact: 'Контакты',
		phoneNumber: 'Номер телефона',
		email: 'Эл. почта',
		preferredLanguage: 'Предпочитаемый язык',
		preferences: 'Настройки',
		theme: 'Тема',
		helpAndContact: 'Помощь и контакты',
		logOut: 'Выйти',
		savedTitle: 'Профиль сохранён',
		savedDescription: 'Ваши изменения обновлены.',
		saveFailedTitle: 'Не удалось сохранить',
		contactTitle: 'Связаться с центром',
		contactDescription: 'Ресепшн: {{phone}}',
		contactUnavailable: 'Номер телефона не указан — обратитесь в центр лично.',
		errorTitle: 'Не удалось загрузить профиль',
		errorDescription: 'Повторите попытку или обновите страницу.',
		retry: 'Повторить',
	},
};
