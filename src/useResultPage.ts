import { useState } from 'react';

const PAGE_SIZE = 8;

/** Only pages rendered records. Aggregates use the complete filtered dataset. */
export function useResultPage(scope: string, count: number) {
  const [selection, setSelection] = useState({ scope, page: 0 });
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = selection.scope === scope ? Math.min(selection.page, pages - 1) : 0;
  return { page, pages, count, start: page * PAGE_SIZE, end: (page + 1) * PAGE_SIZE,
    select: (next: number) => setSelection({ scope, page: Math.max(0, Math.min(next, pages - 1)) }) };
}
