import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConnectionChip } from './ConnectionChip';

describe('ConnectionChip', () => {
  it('is honest when no API is configured', () => {
    render(<ConnectionChip status="unconfigured" rttMs={null} />);
    expect(screen.getByRole('status')).toHaveTextContent('No caption API yet');
  });

  it('shows measured round-trip time when live', () => {
    render(<ConnectionChip status="connected" rttMs={42} />);
    expect(screen.getByRole('status')).toHaveTextContent('Live · 42 ms');
  });

  it('signals reconnection attempts', () => {
    render(<ConnectionChip status="offline" rttMs={null} />);
    expect(screen.getByRole('status')).toHaveTextContent('Reconnecting…');
  });
});
