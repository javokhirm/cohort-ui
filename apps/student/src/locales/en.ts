import type { TranslationsOf } from '@repo/i18n';

import type { uz } from './uz';

/** English translation of the student catalog. `uz` is the source of truth. */
export const en: TranslationsOf<typeof uz> = {
	shell: {
		notStudentTitle: 'This app is for students',
		notStudentDescription:
			'Your account does not have student access. Sign in with a different account.',
		backToSignIn: 'Back to sign in',
		scheduleSubtitle: 'Tap a day to see its classes',
		progressSubtitle: 'Results, feedback & attendance',
		billingSubtitle: 'Invoices & payments',
		openNotifications: 'Open notifications',
		openProfile: 'Open profile',
		profileSubtitle: '{{code}} · {{branch}}',
	},
	home: {
		greetingMorning: 'Good morning, {{name}}',
		greetingAfternoon: 'Good afternoon, {{name}}',
		greetingEvening: 'Good evening, {{name}}',
		todaySectionTitle: 'Today',
		todayEmptyTitle: 'No classes today',
		todayEmptyDescription: 'You have no sessions scheduled for today.',
		attendanceRate: 'Attendance',
		streak: 'Streak',
		streakHint: 'sessions',
		unread: 'Unread',
		balanceDue: '{{amount}} due',
		latestResult: 'Latest result',
		errorTitle: 'Could not load data',
		errorDescription: 'Try again or refresh the page.',
		retry: 'Retry',
	},
	profile: {
		contact: 'Contact',
		phoneNumber: 'Phone number',
		email: 'Email',
		preferredLanguage: 'Preferred language',
		preferences: 'Preferences',
		theme: 'Theme',
		helpAndContact: 'Help & contact',
		logOut: 'Log out',
		savedTitle: 'Profile saved',
		savedDescription: 'Your changes have been updated.',
		saveFailedTitle: 'Could not save',
		contactTitle: 'Contact the center',
		contactDescription: 'Front desk: {{phone}}',
		contactUnavailable: 'No phone number on file — ask at the center in person.',
		errorTitle: 'Could not load your profile',
		errorDescription: 'Try again or refresh the page.',
		retry: 'Retry',
	},
};
