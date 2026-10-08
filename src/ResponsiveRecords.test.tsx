import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResponsiveTable from './ResponsiveTable';
import ResultsPager from './ResultsPager';
import { useResultPage } from './useResultPage';

describe('compact records', () => {
  it('preserves record actions and labels when details expand, including after rerender', async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const table = (name: string) => <ResponsiveTable summaryColumns={[0]}><thead><tr><th>Customer</th><th>Action</th></tr></thead>
      <tbody><tr key="a"><td>{name}</td><td><button onClick={action}>Open account</button></td></tr></tbody></ResponsiveTable>;
    const view = render(table('Sample customer'));
    const toggle = screen.getByRole('button', { name: /More details/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    view.rerender(table('Renamed sample customer'));
    expect(screen.getByRole('button', { name: /Less detail/ })).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(toggle.getAttribute('aria-controls')!)).toHaveAttribute('data-label', 'Action');
    await user.click(screen.getByRole('button', { name: 'Open account' }));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.getByText('Renamed sample customer').closest('tr')).toHaveClass('is-expanded');
  });

  it('leaves spanning empty and total rows intact', () => {
    render(<ResponsiveTable summaryColumns={[0]}><tbody><tr><td colSpan={5}>No matching records</td></tr></tbody></ResponsiveTable>);
    expect(screen.getByText('No matching records')).toHaveAttribute('colspan', '5');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

function PagedList({ scope = 'all', count = 19 }) {
  const paging = useResultPage(scope, count);
  return <><output>{paging.start}</output><ResultsPager paging={paging} /></>;
}

it('resets pagination after filtering and clamps it when records disappear', async () => {
  const user = userEvent.setup();
  const view = render(<PagedList />);
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('17–19 of 19')).toBeInTheDocument();
  view.rerender(<PagedList count={10} />);
  expect(screen.getByText('9–10 of 10')).toBeInTheDocument();
  view.rerender(<PagedList scope="search" count={9} />);
  expect(screen.getByText('1–8 of 9')).toBeInTheDocument();
  expect(within(screen.getByRole('navigation')).getByRole('button', { name: 'Previous' })).toBeDisabled();
});
