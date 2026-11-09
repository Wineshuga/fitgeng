import { render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const ui = (
  <ThemeProvider>
    <ThemeToggle />
  </ThemeProvider>
);

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('follows the system theme by default (light in jsdom)', async () => {
    render(ui);
    const btn = screen.getByRole('button', { name: /toggle dark mode/i });
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'false'));
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('toggles dark mode and persists the choice', async () => {
    render(ui);
    const btn = screen.getByRole('button', { name: /toggle dark mode/i });
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed'));
    await userEvent.click(btn);
    expect(document.documentElement).toHaveClass('dark');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('fg:theme')).toBe('dark');
  });

  it('restores a stored preference after mount', async () => {
    localStorage.setItem('fg:theme', 'dark');
    render(ui);
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
  });

  it('still works when storage throws', async () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(ui);
    await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false'));
    spy.mockRestore();
  });

  it('renders on the server without touching browser storage (hydration-safe)', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem');
    const html = renderToString(ui);
    expect(spy).not.toHaveBeenCalled();
    // No aria-pressed before hydration, so server and first client render match.
    expect(html).not.toContain('aria-pressed');
    spy.mockRestore();
  });
});
