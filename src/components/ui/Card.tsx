import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'li';
  padded?: boolean;
  children: ReactNode;
}

export function Card({ as: Tag = 'div', padded = true, className, children, ...rest }: CardProps) {
  return (
    <Tag className={cx('card', padded && 'card--padded', className)} {...rest}>
      {children}
    </Tag>
  );
}
