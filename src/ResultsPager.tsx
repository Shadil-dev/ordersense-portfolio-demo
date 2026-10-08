import type { useResultPage } from './useResultPage';

export default function ResultsPager({ paging }: { paging: ReturnType<typeof useResultPage> }) {
  if (paging.pages <= 1) return null;
  const select = (page: number) => {
    paging.select(page);
    document.querySelector('.results-summary')?.scrollIntoView?.({ block: 'start' });
  };
  return <nav className="results-pager" aria-label="Result pages">
    <button type="button" disabled={paging.page === 0} onClick={() => select(paging.page - 1)}>Previous</button>
    <span aria-live="polite">{paging.start + 1}–{Math.min(paging.end, paging.count)} of {paging.count}</span>
    <button type="button" disabled={paging.page + 1 >= paging.pages} onClick={() => select(paging.page + 1)}>Next</button>
  </nav>;
}
