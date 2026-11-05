// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button.jsx';

afterEach(cleanup);

describe('Button', () => {
  it('renders and handles a click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Simpan</Button>);

    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
