import Link from 'next/link';

const links = [
  { href: '/', label: 'Overview', icon: 'OVR' },
  { href: '/dashboard', label: 'Dashboard', icon: 'DSH' },
  { href: '/tournament', label: 'Tournament', icon: 'SIM' },
  { href: '/fixtures', label: 'Fixtures', icon: 'FIX' },
  { href: '/standings', label: 'Standings', icon: 'TAB' },
  { href: '/awards', label: 'Awards', icon: 'AWD' },
  { href: '/history', label: 'History', icon: 'HIS' },
  { href: '/records', label: 'Records', icon: 'REC' },
  { href: '/clubs', label: 'Clubs', icon: 'CLB' },
  { href: '/players', label: 'Players', icon: 'PLY' },
  { href: '/season-review', label: 'Season Review', icon: 'REV' },
] as const;

export function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-ucl-divider/40 bg-ucl-bg/90 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex items-center gap-4 text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-ucl-glow/30 bg-gradient-to-br from-ucl-card to-ucl-surface shadow-cyan">
              <BallIcon />
            </div>
            <div>
              <div className="panel-title">Living Universe</div>
              <div className="text-xl font-black tracking-tight text-ucl-heading">Champions League Simulator</div>
              <div className="mt-1 text-sm text-ucl-silver">Premium local-first tournament universe</div>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <div className="badge-soft border-ucl-blue/35 bg-ucl-blue/10 text-ucl-platinum">Server simulation</div>
            <div className="badge-soft border-ucl-accent/30 bg-ucl-accent/10 text-ucl-heading">Persistent history</div>
          </div>
        </div>
        <nav className="flex flex-wrap gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group inline-flex items-center gap-3 rounded-full border border-ucl-divider/50 bg-ucl-surface/70 px-4 py-2.5 text-sm font-semibold text-ucl-silver transition hover:border-ucl-glow/50 hover:bg-ucl-hover hover:text-ucl-heading"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-ucl-glow/25 bg-ucl-card text-[10px] font-black tracking-[0.18em] text-ucl-accent group-hover:shadow-cyan">
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function BallIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 text-ucl-accent" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="16" cy="16" r="11.5" />
      <path d="M16 6.5 10 10l2 6 4-2.5 4 2.5 2-6-6-3.5Z" />
      <path d="m12 16-4 3m16-3 4 3m-12 1.5-2.5 5m5 0 2.5-5" />
    </svg>
  );
}
