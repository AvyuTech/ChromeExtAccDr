import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ExploreMap } from '../components/ExploreMap';
import { PageHeader } from '../components/ui';
import type { PlaceCategory } from '../data/types';
import { FILTERS, matches, type Filter } from '../lib/exploreFilters';

/** The whole map, as big as the screen allows: roam the city and see what's around. */
export default function MapPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const wrap = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(560);
  const onMap = useCallback((p: { category: PlaceCategory }) => matches(filter, p.category, false), [filter]);

  // Fill the screen down to the tab bar, inside the phone frame or not.
  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current;
      if (!el) return;
      const scroller = document.getElementById('scroller');
      const framed = !!scroller && getComputedStyle(scroller).display !== 'contents';
      const bottom = framed ? scroller!.getBoundingClientRect().bottom : window.innerHeight;
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 70;
      setHeight(Math.max(360, Math.round(bottom - el.getBoundingClientRect().top - nav)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <>
      <PageHeader title="Map" sub="Businesses, public places and clubs around you" fallback="/explore" />
      <main className="page page--with-header map-page">
        <div className="chip-row explore-filters" role="group" aria-label="Show">
          {FILTERS.filter((f) => f.id !== 'trips').map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <div ref={wrap}>
          <ExploreMap full category={onMap} height={height} />
        </div>
      </main>
    </>
  );
}
