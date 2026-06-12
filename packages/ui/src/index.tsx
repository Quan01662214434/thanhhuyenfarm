import type { ReactNode } from 'react';

/** Placeholder shared UI — primary components live in `apps/frontend` (shadcn-style). */
export function FarmBrandMark({ className }: { className?: string }): ReactNode {
  return (
    <span className={className} aria-hidden>
      🌿
    </span>
  );
}
