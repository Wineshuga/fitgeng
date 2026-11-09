import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryState } from '../QueryState';

const renderList = (props: Partial<Parameters<typeof QueryState<string[]>>[0]>) =>
  render(
    <QueryState<string[]> isLoading={false} data={undefined} isEmpty={(d) => d.length === 0} {...props}>
      {(items) => (
        <ul>
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
    </QueryState>,
  );

describe('QueryState', () => {
  it('shows a spinner while loading', () => {
    renderList({ isLoading: true });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the API error message and retries', async () => {
    const onRetry = jest.fn();
    renderList({
      error: { status: 403, data: { error: { code: 'FORBIDDEN', message: 'Not your group' } } },
      onRetry,
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Not your group');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('explains network failures', () => {
    renderList({ error: { status: 'FETCH_ERROR', error: 'TypeError' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/unable to reach the server/i);
  });

  it('shows the empty state', () => {
    renderList({ data: [], empty: <p>No groups yet</p> });
    expect(screen.getByText('No groups yet')).toBeInTheDocument();
  });

  it('renders data on success', () => {
    renderList({ data: ['Ikoyi Tennis', 'Yaba Ballers'] });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
