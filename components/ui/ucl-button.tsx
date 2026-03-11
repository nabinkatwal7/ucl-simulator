import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function UclButton({ className, variant = 'primary', ...props }: Props) {
  const variantClass = {
    primary: 'bg-cyan-400 text-slate-950 shadow-ucl-glow hover:scale-[1.02] hover:bg-cyan-300',
    secondary: 'bg-white/8 text-white ring-1 ring-white/12 hover:bg-white/12',
    ghost: 'bg-transparent text-ucl-silver hover:bg-white/6',
  }[variant];

  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-60',
        variantClass,
        className ?? '',
      ].join(' ').trim()}
      {...props}
    />
  );
}
