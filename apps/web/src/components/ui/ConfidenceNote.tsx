import type { ReactNode } from 'react';
import { Card } from './Card';

/**
 * Low-confidence disclosure under a caption — honest about what was heard.
 * ("NOT FULLY SURE · Heard "puerta veintidós" — could be 22 or 32.")
 */
export function ConfidenceNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="px-[15px] py-[13px]" role="note">
      <div className="mb-1.5 text-[12px] leading-none font-extrabold text-warn uppercase">
        {title}
      </div>
      <div className="text-[15px] leading-[1.4] font-medium text-ink-2">{children}</div>
    </Card>
  );
}
