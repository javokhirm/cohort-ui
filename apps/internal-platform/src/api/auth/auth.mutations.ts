import { publicApi } from '@/api/apiClient';
import type { AuthResult, OtpChallenge } from '@/lib/auth/types';

/** Step 1 — verify email + password; the backend emails a 6-digit OTP. */
export function requestOtp(input: {
	email: string;
	password: string;
}): Promise<OtpChallenge> {
	return publicApi.post<OtpChallenge>('/super-admin/auth/login', input);
}

/** Step 2 — verify the OTP; returns the JWT pair + operator summary. */
export function verifyOtp(input: { email: string; code: string }): Promise<AuthResult> {
	return publicApi.post<AuthResult>('/super-admin/auth/verify-otp', input);
}
