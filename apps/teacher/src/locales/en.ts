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
		unsavedChanges: 'Unsaved changes',
		savedState: 'Saved',
		myBranches: 'My branches',
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
		studentCount_one: '{{count}} student',
		studentCount_other: '{{count}} students',
		noSessionsTitle: 'No sessions scheduled',
		noSessionsDescription:
			"Sessions are generated from the group's weekly schedule once it has a start and end date.",
		noSessionsThisMonth: 'No sessions this month',
		noSessionsThisMonthDescription:
			'This group has no scheduled sessions in the selected month.',
		sessionErrorTitle: "Couldn't load this session",
		sessionsErrorDescription:
			"Something went wrong fetching this group's sessions. Try again in a moment.",
		greetingMorning: 'Good morning',
		greetingAfternoon: 'Good afternoon',
		greetingEvening: 'Good evening',
		emptyWhenToday: 'today',
		emptyWhenOnDate: 'on {{date}}',
		noRoom: 'No room set',
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
		groupFallback: 'Group',
		groupNumber: 'Group #{{id}}',
		tabRoster: 'Roster',
		tabSchedule: 'Schedule',
		tabGrading: 'Grading',
		unnamedStudent: 'Unnamed student',
		unknownBranch: 'Unknown branch',
		attendancePercent: '{{rate}}% attendance',
		attendanceRateShort: '{{rate}}% att.',
		emptyBranch: 'No groups at this branch',
		emptyBranchDescription:
			'You teach elsewhere — switch to "All branches" in the topbar to see those groups.',
		emptyTitle: 'No groups yet',
		emptyDescription: 'Groups you are assigned to teach will appear here.',
		groupCount_one: '{{count}} group',
		groupCount_other: '{{count}} groups',
		hiddenSuffix: ' · {{count}} hidden by the branch filter',
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
		takeTitle: 'Take attendance',
		sessionNumber: 'Session #{{id}}',
		presentAbsent: '{{present}} present · {{absent}} absent',
		notMarked: 'not marked',
		studentFallback: 'Student',
		cellLabel: '{{name}}, {{date}} — {{status}}',
		dateCancelled: '{{date}} — cancelled',
		pastAndTodayEditable: "Today's and past sessions can be edited",
		markAllHintNoSession: 'No session scheduled today',
		markAllHintCancelled: "Today's session is cancelled",
		markAllHintNoStudents: 'No students enrolled',
		markAllHintReady: "Sets every student to Present for today's session",
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
		midBand: '{{low}}–89%',
		lowBand: 'Below {{low}}%',
		enterTitle: 'Enter marks',
		sessionNumber: 'Session #{{id}}',
		notMarked: 'not marked',
		score: 'score',
		cellLabel: '{{name}}, {{date}} — {{status}}',
		dateCancelled: '{{date}} — cancelled',
		clearMark: 'Clear mark',
		markedProgress: '{{marked}} of {{total}} marked',
		markFor: 'Mark for {{name}}',
		scalePoints: 'Points · max {{max}}',
		scalePercentage: 'Percentage · 0–{{max}}',
		scaleLetter: 'Letter grade · A–F',
		scaleShortPoints: 'Points /{{max}}',
		scaleShortPercentage: 'Percentage /{{max}}',
		scaleShortLetter: 'Letter A–F',
		scaleUsedFor: '{{scale}} · used for daily marks',
		scaleNotSet: 'Not set yet · tap to choose one',
		gradingScaleDescription: 'How daily marks are entered for this group.',
		scaleType: 'Scale type',
		letterHint: 'Letter grades A–F are entered directly on the marks sheet.',
		maxPercent: 'Maximum (%)',
		maxPointsLabel: 'Maximum points',
		allowHalf: 'Allow half-point scores',
		preview: 'Preview',
		previewPoints: 'Daily points · max {{max}}',
	},

	payroll: {
		title: 'My pay',
		errorTitle: "Couldn't load your pay",
		errorDescription:
			'Something went wrong fetching your payroll. Try again in a moment.',
		emptyTitle: 'No pay to show yet',
		emptyDescription:
			'Your pay appears here once the office sets up your pay model and you have completed sessions.',
		advancesTitle: 'Advances',
		advancesHint: 'Salary drawn before the run — deducted from your net.',
		advanceFallback: 'Advance',
		studentsTitle: 'Students',
		noCompletedSessions: 'No completed sessions with enrolled students this month.',
		breakdownSubtitle_one: '{{count}} student · sessions you taught of their total',
		breakdownSubtitle_other:
			'{{count}} students · sessions you taught of their total',
		sessionsCount: '{{taught}}/{{planned}} sessions',
		tuitionSuffix: ' · {{amount}} tuition',
		revenueShareNote:
			"Each student's tuition is split across all of the group's classes for the month, and you earn the ones you taught. Classes still ahead of you are not paid yet, a cancelled class is not paid at all, and a student who joined mid-month counts only from the day they joined.",
		referenceNote:
			'Listed for reference. You are paid on the basis shown above, not per student.',
		netPayable: 'Net payable',
		computed: 'Computed',
		liveNote:
			'Live — figures update from completed sessions until the period is finalized.',
		advancesExceedNote:
			'Advances exceed the computed pay — net is held at zero for this month.',
		calcNote:
			'Computed from {{sessions}} completed sessions ({{hours}}h). Exact total {{exact}}, rounded to {{rounded}}.',
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
		sectionContact: 'Contact',
		sectionGuardians: 'Guardians',
		unnamedContact: 'Unnamed contact',
		unnamedStudent: 'Unnamed student',
		primary: 'Primary',
		gender: {
			M: 'Male',
			F: 'Female',
			O: 'Other',
		},
	},

	profile: {
		title: 'Profile',
		errorTitle: "Couldn't load your profile",
		errorDescription:
			'Something went wrong fetching your account. Try again in a moment.',
		staffId: 'Staff ID',
		branches: 'Branches',
		phone: 'Phone',
		email: 'Email',
		allBranches: 'All branches',
		appearance: 'Appearance',
		darkMode: 'Dark mode',
		lightMode: 'Light mode',
	},
};
