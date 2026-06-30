import { CreditCard, Database, HardDrive, Mail, MessageSquare, Server } from 'lucide-react';

export const TOOLTIP_STYLE: React.CSSProperties = {
	backgroundColor: '#131c30',
	border: '1px solid #1e293b',
	borderRadius: '0.5rem',
	color: '#f1f5f9',
	fontSize: 12,
};

export const TENANT_STATUS_COLORS: Record<string, string> = {
	ACTIVE: '#22c55e',
	PENDING: '#60a5fa',
	SUSPENDED: '#f97316',
	CANCELLED: '#94a3b8',
};

export const SERVICES = [
	{ name: 'API', icon: Server },
	{ name: 'Database', icon: Database },
	{ name: 'Storage', icon: HardDrive },
	{ name: 'Email', icon: Mail },
	{ name: 'SMS', icon: MessageSquare },
	{ name: 'Payments', icon: CreditCard },
];
