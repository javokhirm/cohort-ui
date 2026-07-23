import type { TranslationsOf } from '@repo/i18n';

import type { uz } from './uz';

/** English translation of the teacher catalog. `uz` is the source of truth. */
export const en: TranslationsOf<typeof uz> = {
	shell: {
		logOut: 'Log out',
		settings: 'Settings',
		back: 'Back',
		backToSignIn: 'Back to sign in',
		tryAgain: 'Try again',
		genericErrorTitle: 'Something went wrong',
		genericErrorDescription: 'Something went wrong. Try again in a moment.',
		notTeacherTitle: 'This console is for teachers',
		notTeacherDescription:
			"Your account doesn't hold a teacher role. Sign in with a teacher account, or use the admin console instead.",
		toastForbidden: 'You do not have permission to do that.',
		toastGeneric: 'Something went wrong. Please try again.',
		prevWeek: 'Previous week',
		nextWeek: 'Next week',
		prevMonth: 'Previous month',
		nextMonth: 'Next month',
		thisMonth: 'This month',
		goToThisMonth: 'Go to this month',
		listView: 'List view',
		tableView: 'Table view',
	},

	schedule: {
		title: 'Today',
		today: 'Today',
		errorTitle: "Couldn't load your schedule",
		errorDescription:
			'Something went wrong fetching your sessions. Try again in a moment.',
		emptyBranch: 'No classes at this branch',
		emptyBranchDescription:
			'You do teach elsewhere — switch to "All branches" in the topbar to see those.',
		emptyDay: 'No classes {{when}}',
		emptyDayDescription:
			'Enjoy the break. Your next teaching day is dotted on the strip above.',
		attendanceAction: 'Attendance',
		marksAction: 'Marks',
		noSessionsTitle: 'No sessions scheduled',
		noSessionsDescription:
			"Sessions are generated from the group's weekly schedule once it has a start and end date.",
		noSessionsThisMonth: 'No sessions this month',
		noSessionsThisMonthDescription:
			'This group has no scheduled sessions in the selected month.',
		sessionErrorTitle: "Couldn't load this session",
		sessionsErrorDescription:
			"Something went wrong fetching this group's sessions. Try again in a moment.",
	},

	groups: {
		title: 'My groups',
		back: 'Back to groups',
		errorTitle: "Couldn't load your groups",
		errorDescription:
			'Something went wrong fetching the groups you teach. Try again in a moment.',
		notFoundTitle: "Couldn't load this group",
		notFoundDescription:
			'It may not exist, or it may not be one of the groups you teach.',
		rosterErrorTitle: "Couldn't load the roster",
		rosterErrorDescription:
			"Something went wrong fetching this group's students. Try again in a moment.",
		rosterEmptyTitle: 'No students enrolled',
		rosterEmptyDescription: 'Students enrolled in this group will appear here.',
		field: {
			course: 'Course',
			branch: 'Branch',
			room: 'Room',
			filled: 'Filled',
		},
	},

	attendance: {
		title: 'Attendance',
		saved: 'Attendance saved',
		save: 'Save attendance',
		allPresent: 'All present',
		markAllPresent: 'Mark all present',
		markedAllPresent: 'Marked everyone present',
		errorTitle: "Couldn't load attendance",
		emptyTitle: 'No attendance yet',
		cancelledTitle: 'This session is cancelled',
		cancelledDescription: "Attendance can't be taken for a cancelled session.",
		noStudentsDescription: 'This group has no active students to mark yet.',
	},

	marks: {
		title: 'Marks',
		saved: 'Marks saved',
		save: 'Save marks',
		errorTitle: "Couldn't load marks",
		cancelledDescription: "Marks can't be entered for a cancelled session.",
		gradingScale: 'Grading scale',
		saveGradingScale: 'Save grading scale',
		gradingScaleUpdated: 'Grading scale updated',
		gradingScaleErrorTitle: "Couldn't load the grading scale",
		gradingScaleErrorDescription:
			"Something went wrong fetching this group's grading configuration. Try again in a moment.",
		gradingScaleHint:
			'This scale controls how daily marks are entered and how averages are computed',
		type: {
			POINTS: 'Points',
			PERCENTAGE: 'Percentage',
			LETTER: 'Letter',
		},
		column: {
			student: 'Student',
			avg: 'Avg',
			rank: 'Rank',
			rate: 'Rate',
			attendance: 'Attendance',
			marks: 'Marks',
		},
		topBand: '90% and up',
	},

	payroll: {
		title: 'My pay',
		errorTitle: "Couldn't load your pay",
		errorDescription:
			'Something went wrong fetching your payroll. Try again in a moment.',
		emptyTitle: 'No pay to show yet',
		emptyDescription:
			'Your pay appears here once the office sets up your pay model and you have completed sessions.',
	},

	students: {
		profileTitle: 'Student profile',
		errorTitle: "Couldn't load this student",
		errorDescription:
			'They may not exist, or they may not be enrolled in one of the groups you teach.',
		guardiansErrorTitle: "Couldn't load guardians",
		guardiansErrorDescription:
			"Something went wrong fetching this student's guardians. Try again in a moment.",
		guardiansEmptyTitle: 'No guardians on file',
		guardiansEmptyDescription:
			'Ask the front desk to add a guardian for this student.',
		field: {
			dateOfBirth: 'Date of birth',
			gender: 'Gender',
			phone: 'Phone',
			email: 'Email',
		},
	},

	profile: {
		title: 'Profile',
		errorTitle: "Couldn't load your profile",
		errorDescription:
			'Something went wrong fetching your account. Try again in a moment.',
		staffId: 'Staff ID',
		branches: 'Branches',
	},
};
