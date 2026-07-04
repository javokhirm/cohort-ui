import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { LeadBoard } from './LeadBoard';
import type {
	LeadBoard as LeadBoardType,
	LeadCard,
	LeadStatus,
} from '../api/leads.queries';

const card: LeadCard = {
	id: 1,
	firstName: 'Bobur',
	lastName: 'Aliyev',
	phoneNumber: '+998912345678',
	source: 'TELEGRAM',
	status: 'NEW',
	branchId: 1,
	courseInterest: null,
	assignedTo: null,
	latestActivity: null,
	createdAt: '2026-07-04T09:00:00Z',
};

function makeBoard(newItems: LeadCard[]): LeadBoardType {
	const order: LeadStatus[] = ['NEW', 'CONTACTED', 'TRIAL_BOOKED', 'ENROLLED', 'LOST'];
	return {
		columns: order.map((status) => ({
			status,
			total: status === 'NEW' ? newItems.length : 0,
			items: status === 'NEW' ? newItems : [],
		})),
	};
}

function renderBoard(ui: ReactNode) {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('LeadBoard', () => {
	it('renders the five pipeline columns and their cards', () => {
		renderBoard(
			<LeadBoard
				board={makeBoard([card])}
				isLoading={false}
				isError={false}
				filters={{}}
				onOpenLead={vi.fn()}
			/>,
		);

		expect(screen.getByText('New')).toBeInTheDocument();
		expect(screen.getByText('Trial booked')).toBeInTheDocument();
		expect(screen.getByText('Lost')).toBeInTheDocument();
		expect(screen.getByText('Bobur Aliyev')).toBeInTheDocument();
	});

	it('shows an empty state when no leads match', () => {
		renderBoard(
			<LeadBoard
				board={makeBoard([])}
				isLoading={false}
				isError={false}
				filters={{}}
				onOpenLead={vi.fn()}
			/>,
		);

		expect(screen.getByText('No leads match your filters.')).toBeInTheDocument();
	});
});
