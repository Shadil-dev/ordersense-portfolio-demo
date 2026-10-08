import { Children, cloneElement, isValidElement, useId, useState } from 'react';
import type { ReactElement, ReactNode, HTMLAttributes } from 'react';

type CellProps = HTMLAttributes<HTMLTableCellElement> & { children?: ReactNode; colSpan?: number };

/** One set of cells and handlers: desktop table, compact expandable phone record. */
export default function RecordDetails({ row, summaryColumns }: {
  row: ReactElement<HTMLAttributes<HTMLTableRowElement>>;
  summaryColumns: number[];
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const cells = Children.toArray(row.props.children);
  if (cells.some(cell => isValidElement<CellProps>(cell) && cell.props.colSpan)) return row;
  const detailsIds: string[] = [];
  const labeledCells = cells.map((cell, index) => {
    if (!isValidElement<CellProps>(cell) || cell.type !== 'td' || summaryColumns.includes(index)) return cell;
    const cellId = `${id}-${index}`;
    detailsIds.push(cellId);
    return cloneElement(cell, { id: cellId, className: `${cell.props.className || ''} record-secondary` });
  });
  return cloneElement(row, { className: `${row.props.className || ''} compact-record ${expanded ? 'is-expanded' : ''}` },
    labeledCells,
    detailsIds.length > 0 && <td key="disclosure" className="record-toggle"><button type="button" aria-expanded={expanded}
      aria-controls={detailsIds.join(' ')} onClick={() => setExpanded(value => !value)}>
      {expanded ? 'Less detail' : 'More details & actions'}<span aria-hidden="true">{expanded ? '−' : '+'}</span>
    </button></td>);
}
