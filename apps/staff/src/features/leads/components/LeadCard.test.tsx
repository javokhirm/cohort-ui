import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LeadCard } from './LeadCard';
import type { LeadCard as LeadCardType } from '../api/leads.queries';

const lead: LeadCardType = {
	id: 1,
	firstName: 'Bobur',
	lastName: 'Aliyev',
	phoneNumber: '+998912345678',
	source: 'TELEGRAM',
	status: 'NEW',
	branchId: 1,
	courseInterest: { id: 2, name: 'General English (A2)' },
	assignedTo: null,
	latestActivity: null,
	createdAt: '2026-07-04T09:00:00Z',
};

describe('LeadCard', () => {
	it('renders the lead summary and source badge', () => {
		render(
			<LeadCard
				lead={lead}
				draggable
				isDragging={false}
				onOpen={vi.fn()}
				onDragStart={vi.fn()}
				onDragEnd={vi.fn()}
			/>,
		);

		expect(screen.getByText('Bobur Aliyev')).toBeInTheDocument();
		expect(screen.getByText('+998912345678')).toBeInTheDocument();
		expect(screen.getByText('General English (A2)')).toBeInTheDocument();
		expect(screen.getByText('Telegram')).toBeInTheDocument();
	});

	it('opens the detail on click', async () => {
		const onOpen = vi.fn();
		render(
			<LeadCard
				lead={lead}
				draggable
				isDragging={false}
				onOpen={onOpen}
				onDragStart={vi.fn()}
				onDragEnd={vi.fn()}
			/>,
		);

		await userEvent.click(screen.getByText('Bobur Aliyev'));
		expect(onOpen).toHaveBeenCalledWith(1);
	});
});
