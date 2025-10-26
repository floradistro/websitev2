import { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Grid({ children, cols = 4, gap = 'md', className = '' }: GridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-2 lg:grid-cols-6',
  };
  
  const gapClass = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };
  
  return (
    <div className={`grid ${colsClass[cols]} ${gapClass[gap]} ${className}`}>
      {children}
    </div>
  );
}

