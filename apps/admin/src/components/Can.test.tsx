import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { Can } from './Can';
import { useSessionStore } from '@/store/sessionStore';

function reset() {
	useSessionStore.setState({
		accessToken: null,
		user: null,
		status: 'unknown',
		permissions: [],
		permissionsLoaded: false,
	});
}

describe('<Can>', () => {
	beforeEach(reset);

	it('hides children when the permission is missing', () => {
		useSessionStore.getState().setPermissions(['student.read']);
		render(
			<Can permission="student.create">
				<button>Add student</button>
			</Can>,
		);
		expect(screen.queryByText('Add student')).not.toBeInTheDocument();
	});

	it('renders children when the permission is held', () => {
		useSessionStore.getState().setPermissions(['student.create']);
		render(
			<Can permission="student.create">
				<button>Add student</button>
			</Can>,
		);
		expect(screen.getByText('Add student')).toBeInTheDocument();
	});

	it('renders the fallback when denied', () => {
		useSessionStore.getState().setPermissions([]);
		render(
			<Can permission="invoice.void" fallback={<span>Not allowed</span>}>
				<button>Void</button>
			</Can>,
		);
		expect(screen.getByText('Not allowed')).toBeInTheDocument();
		expect(screen.queryByText('Void')).not.toBeInTheDocument();
	});

	it('passes an any-of list when one code is held', () => {
		useSessionStore.getState().setPermissions(['expense.update']);
		render(
			<Can permission={['expense.create', 'expense.update', 'expense.delete']}>
				<button>Expenses</button>
			</Can>,
		);
		expect(screen.getByText('Expenses')).toBeInTheDocument();
	});

	it('combines role and permission with AND', () => {
		useSessionStore.setState({
			user: {
				id: 1,
				firstName: 'M',
				lastName: 'M',
				roles: ['MANAGER'],
				branchScope: null,
			},
		});
		useSessionStore.getState().setPermissions(['payroll.finalize']);

		render(
			<Can role={['OWNER']} permission="payroll.finalize">
				<button>Approve</button>
			</Can>,
		);
		// Has the permission but not the role → hidden.
		expect(screen.queryByText('Approve')).not.toBeInTheDocument();
	});

	it('reacts to permissions loading after mount', () => {
		render(
			<Can permission="course.create">
				<button>New course</button>
			</Can>,
		);
		expect(screen.queryByText('New course')).not.toBeInTheDocument();

		act(() => {
			useSessionStore.getState().setPermissions(['course.create']);
		});
		expect(screen.getByText('New course')).toBeInTheDocument();
	});
});
