import Link from 'next/link';
import { UclButton } from '@/components/ui/ucl-button';

export function UclHero() {
  return (
    <section className="ucl-starball-bg ucl-panel ucl-panel-border relative overflow-hidden rounded-ucl-lg px-6 py-8 md:px-8 md:py-10">
      <div className="ucl-stars" />

      <div className="relative z-10 max-w-3xl">
        <p className="ucl-heading mb-3">UEFA Champions League Simulator</p>
        <h1 className="ucl-title mb-4">
          Build dynasties, relive drama, and simulate the road to European glory
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-ucl-silver md:text-base">
          Advance one matchday at a time, track club and player records, and create a living multi-season competition history with authentic UCL-inspired presentation.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/tournament"><UclButton>Generate New Season</UclButton></Link>
          <Link href="/history"><UclButton variant="secondary">View History</UclButton></Link>
        </div>
      </div>
    </section>
  );
}
