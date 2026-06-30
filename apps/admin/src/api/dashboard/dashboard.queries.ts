import { adminApi } from '@/lib/api';
import type { DashboardKpis } from './types';

export function getDashboard(): Promise<DashboardKpis> {
	return adminApi.get<DashboardKpis>('/dashboard');
}
