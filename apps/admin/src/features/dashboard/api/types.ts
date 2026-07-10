/**
 * Response shapes for the staff dashboard (`GET /manage/dashboard/*`,
 * api-reference.md §3.21). Money is whole UZS; every rate is a 0–100 percentage
 * (one decimal) and is `null` when nothing was measured; every `*Pct` / rate
 * delta is a fraction (e.g. `0.1834` = +18.34%).
 */

export interface DashboardStats {
	currency: string;
	generatedAt: string;
	activeStudents: { total: number; newThisMonth: number };
	attendanceToday: {
		rate: number | null;
		ratePrevWeek: number | null;
		/** Difference in percentage points (e.g. `1.4`). */
		changePoints: number | null;
	};
	revenueThisMonth: {
		amount: number;
		amountPrevMonth: number;
		/** Fraction (4 dp); `null` when the previous month is zero. */
		changePct: number | null;
	};
	outstanding: { amount: number; overdueCount: number };
	newLeads: { thisWeek: number; prevWeek: number; change: number };
}

export interface RevenueTrendPoint {
	/** `YYYY-MM`. */
	month: string;
	revenue: number;
}

export interface RevenueTrendResponse {
	currency: string;
	months: number;
	changePct: number | null;
	points: RevenueTrendPoint[];
}

export interface EnrollmentTrendPoint {
	month: string;
	enrollments: number;
}

export interface EnrollmentTrendResponse {
	months: number;
	changePct: number | null;
	points: EnrollmentTrendPoint[];
}

export interface AttendanceTrendPoint {
	/** `YYYY-MM-DD`. */
	date: string;
	rate: number | null;
	attended: number;
	marked: number;
}

export interface AttendanceTrendResponse {
	days: number;
	rate: number | null;
	points: AttendanceTrendPoint[];
}

export type LeadFunnelStatus = 'NEW' | 'CONTACTED' | 'TRIAL_BOOKED' | 'ENROLLED' | 'LOST';

export interface LeadFunnelStage {
	status: LeadFunnelStatus;
	count: number;
}

export interface LeadFunnelResponse {
	from: string;
	to: string;
	stages: LeadFunnelStage[];
	/** Fraction (4 dp); `null` when no lead entered `NEW`. */
	conversionRate: number | null;
}
