import { Children, cloneElement, isValidElement } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import RecordDetails from './RecordDetails';

type NodeProps = { children?: ReactNode; colSpan?: number; 'data-label'?: string };
const text = (node: ReactNode): string => Children.toArray(node).map(child =>
  isValidElement<NodeProps>(child) ? text(child.props.children) : typeof child === 'string' || typeof child === 'number' ? String(child) : ''
).join(' ').trim();

/** Keep the desktop table and attach its column names to mobile record cards. */
export default function ResponsiveTable({ children, className = '', summaryColumns, ...props }: HTMLAttributes<HTMLTableElement> & { summaryColumns?: number[] }) {
  const headers: string[] = [];
  function collect(node: ReactNode): void {
    Children.forEach(node, child => {
      if (!isValidElement<NodeProps>(child)) return;
      if (child.type === 'th') headers.push(text(child.props.children));
      else collect(child.props.children);
    });
  }
  Children.forEach(children, child => {
    if (isValidElement<NodeProps>(child) && child.type === 'thead') collect(child.props.children);
  });
  function label(node: ReactNode): ReactNode {
    return Children.map(node, child => {
      if (!isValidElement<NodeProps>(child)) return child;
      if (child.type === 'tr') {
        let column = 0;
        const cells = Children.map(child.props.children, cell => {
          if (!isValidElement<NodeProps>(cell)) return cell;
          const index = column;
          column += cell.props.colSpan || 1;
          return cell.type === 'td' && !cell.props.colSpan
            ? cloneElement(cell, { 'data-label': cell.props['data-label'] || headers[index] }) : cell;
        });
        const row = cloneElement(child, { children: cells });
        return summaryColumns && cells?.some(cell => isValidElement(cell) && cell.type === 'td')
          ? <RecordDetails key={child.key} row={row} summaryColumns={summaryColumns} /> : row;
      }
      return typeof child.type === 'string'
        ? cloneElement(child as ReactElement<NodeProps>, { children: label(child.props.children) }) : child;
    });
  }
  return <table {...props} className={`z-mobile-table ${className}`}>{label(children)}</table>;
}
