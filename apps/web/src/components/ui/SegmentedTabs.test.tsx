import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SegmentedTabs } from './SegmentedTabs';

const ITEMS = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'around-me', label: 'Around me' },
  { id: 'one-person', label: 'One person' },
];

function Harness() {
  const [value, setValue] = useState('announcements');
  return <SegmentedTabs items={ITEMS} value={value} onChange={setValue} label="Listen focus" />;
}

describe('SegmentedTabs', () => {
  it('marks the active tab and switches on click', () => {
    render(<Harness />);
    const announcements = screen.getByRole('tab', { name: 'Announcements' });
    const onePerson = screen.getByRole('tab', { name: 'One person' });

    expect(announcements).toHaveAttribute('aria-selected', 'true');
    expect(onePerson).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(onePerson);
    expect(onePerson).toHaveAttribute('aria-selected', 'true');
    expect(announcements).toHaveAttribute('aria-selected', 'false');
  });
});
