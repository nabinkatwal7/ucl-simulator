import type { ReactNode } from 'react';

type UclCardProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function UclCard({ title, subtitle, rightSlot, children, className }: UclCardProps) {
  return (
    <section className={[
      'ucl-panel ucl-panel-border relative overflow-hidden p-5 md:p-6',
      className ?? '',
    ].join(' ').trim()}>
      {(title || subtitle || rightSlot) ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {subtitle ? <p className="ucl-heading mb-1">{subtitle}</p> : null}
            {title ? <h2 className="text-lg font-semibold text-white md:text-xl">{title}</h2> : null}
          </div>
          {rightSlot}
        </div>
      ) : null}
      {children}
    </section>
  );
}
