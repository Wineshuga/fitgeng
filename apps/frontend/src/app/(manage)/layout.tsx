import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Private, per-user area: never indexed.
export const metadata: Metadata = {
  title: 'Manage',
  robots: { index: false, follow: false },
};

export default function ManageGroupLayout({ children }: { children: ReactNode }) {
  return children;
}
