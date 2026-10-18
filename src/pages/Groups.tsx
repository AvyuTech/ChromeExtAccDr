import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CityMap, type MapPin } from '../components/CityMap';
import { allClubs, buysOf, CLUB_KINDS, ClubPickerSheet, ClubRow, ClubTile, clubPhoto, KIND_META, meetupsOf, memberCount, MeetupRow, BuyRow, PlanSheet, type PlanMode } from '../components/clubs';
import { EmptyState } from '../components/ui';
import { NEIGHBOURHOOD_POS } from '../data/mapPositions';
import type { ClubKind, Group } from '../data/types';
import { useT } from '../i18n';
import { NamedGlyph, PlusGlyph, SearchGlyph } from '../icons';
import { compact } from '../lib/format';
import { useAppData } from '../state/appData';
import { useSettings } from '../state/settings';

type KindFilter = 'all' | ClubKind;

/** Several clubs can meet around one neighbourhood; fan their pins out so all stay tappable. */
const FAN: Array<[number, number]> = [
  [24, -10],
  [-26, 12],
  [18, 30],
  [-22, -24],
  [44, 16],
  [-44, -4],
];

const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export default function Groups() {
  const t = useT();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { settings } = useSettings();
  const { data, has } = useAppData();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [planMode, setPlanMode] = useState<PlanMode | null>(null);
  const [planClub, setPlanClub] = useState<Group | undefined>();

  // "Plan a meetup" and "Buy something together" from the + sheet land here.
  useEffect(() => {
    const create = params.get('create');
    if (create === 'meetup' || create === 'buy') {
      setPlanMode(create);
      setPlanClub(undefined);
      params.delete('create');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const home = NEIGHBOURHOOD_POS[settings.location.home] ?? NEIGHBOURHOOD_POS.bodakdev;
  const clubs = allClubs(data);
  const q = query.trim().toLowerCase();
  const filtered = clubs.filter((c) => (kind === 'all' || c.kind === kind) && (!q || `${c.name} ${c.description} ${c.area} ${t(`clubs.kind.${c.kind}`)}`.toLowerCase().includes(q)));
  const searching = !!q || kind !== 'all';

  const mine = clubs.filter((c) => has('joinedGroups', c.id));
  const near = clubs
    .filter((c) => !has('joinedGroups', c.id))
    .sort((a, b) => dist(NEIGHBOURHOOD_POS[a.areaId] ?? home, home) - dist(NEIGHBOURHOOD_POS[b.areaId] ?? home, home));
  // Meetups in your clubs, plus any you said you're in elsewhere (a friend's cricket match).
  const meetups = clubs.flatMap((c) => meetupsOf(c, data).map((m) => ({ m, c }))).filter(({ m, c }) => has('joinedGroups', c.id) || data.joinedMeetups.includes(m.id));
  const buys = mine.flatMap((c) => buysOf(c, data).map((b) => ({ b, c })));

  const seen: Record<string, number> = {};
  const pins: MapPin[] = filtered
      .filter((c) => NEIGHBOURHOOD_POS[c.areaId])
      .map((c) => {
        const n = seen[c.areaId] ?? 0;
        seen[c.areaId] = n + 1;
        const [dx, dy] = FAN[n % FAN.length];
        const [x, y] = NEIGHBOURHOOD_POS[c.areaId];
        return {
          id: c.id,
          x: x + dx,
          y: y + dy,
          glyph: c.glyph,
          title: c.name,
          meta: `${t('clubs.members', { n: compact(memberCount(c, has('joinedGroups', c.id))) })} · ${c.area}`,
          to: `/clubs/${c.id}`,
          photo: clubPhoto(c),
        };
      });

  return (
    <>
      <main className="page clubs">
        <header className="clubs-head">
          <div className="stack" style={{ gap: 6, minWidth: 0 }}>
            <span className="eyebrow muted">{t('clubs.eyebrow', { city: settings.location.city })}</span>
            <h1 className="hero-title">{t('clubs.headline')}</h1>
          </div>
          <Link to="/clubs/new" className="icon-btn icon-btn--square icon-btn--accent" aria-label={t('clubs.start')}>
            <PlusGlyph size={20} />
          </Link>
        </header>

        <label htmlFor="club-q" className="search-field">
          <SearchGlyph size={19} />
          <input id="club-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('clubs.search')} autoComplete="off" enterKeyHint="search" />
        </label>

        <div className="chip-row" role="group" aria-label={t('clubs.kinds')}>
          <button type="button" className="chip chip--icon" aria-pressed={kind === 'all'} onClick={() => setKind('all')}>
            <NamedGlyph name="groups" size={16} />
            {t('clubs.kind.all')}
          </button>
          {CLUB_KINDS.map((k) => (
            <button key={k} type="button" className="chip chip--icon" aria-pressed={kind === k} onClick={() => setKind(k)}>
              <NamedGlyph name={KIND_META[k].glyph} size={16} />
              {t(`clubs.kind.${k}`)}
            </button>
          ))}
        </div>

        <div className="clubs-map">
          <CityMap pins={pins} home={home} radiusKm={settings.location.radiusKm} />
          <p className="clubs-map__note">{t('clubs.mapNote')}</p>
        </div>

        {searching ? (
          <section className="clubs-sec" aria-labelledby="club-results">
            <h2 className="section__title" id="club-results">
              {t('clubs.results', { n: filtered.length })}
            </h2>
            {filtered.length ? (
              <div>
                {filtered.map((c, i) => (
                  <ClubRow key={c.id} club={c} last={i === filtered.length - 1} />
                ))}
              </div>
            ) : (
              <EmptyState
                glyph="groups"
                title={t('clubs.none')}
                action={
                  <Link to="/clubs/new" className="btn btn--soft btn--sm">
                    {t('clubs.start')}
                  </Link>
                }
              />
            )}
          </section>
        ) : (
          <>
            <section className="clubs-sec" aria-labelledby="club-mine">
              <h2 className="section__title" id="club-mine">
                {t('clubs.yours')}
              </h2>
              {mine.length ? (
                <div>
                  {mine.map((c, i) => (
                    <ClubRow key={c.id} club={c} last={i === mine.length - 1} />
                  ))}
                </div>
              ) : (
                <p className="meta">{t('clubs.yoursEmpty')}</p>
              )}
            </section>

            <section className="clubs-sec" aria-labelledby="club-week">
              <div className="section__head">
                <h2 className="section__title" id="club-week">
                  {t('clubs.thisWeek')}
                </h2>
                <button type="button" className="section__link clubs-link" onClick={() => setPlanMode('meetup')}>
                  {t('clubs.form.meetup')}
                </button>
              </div>
              {meetups.length ? (
                <div>
                  {meetups.map(({ m, c }) => (
                    <MeetupRow key={m.id} meetup={m} club={c} showClub />
                  ))}
                </div>
              ) : (
                <p className="meta">{t('clubs.thisWeekEmpty')}</p>
              )}
            </section>

            <section className="clubs-sec" aria-labelledby="club-buys">
              <div className="section__head">
                <h2 className="section__title" id="club-buys">
                  {t('clubs.buying')}
                </h2>
                <button type="button" className="section__link clubs-link" onClick={() => setPlanMode('buy')}>
                  {t('clubs.action.buy')}
                </button>
              </div>
              <p className="clubs-note">{t('clubs.buyingNote')}</p>
              {buys.length ? (
                <div>
                  {buys.map(({ b, c }) => (
                    <BuyRow key={b.id} buy={b} club={c} showClub />
                  ))}
                </div>
              ) : (
                <p className="meta">{t('clubs.buysEmpty')}</p>
              )}
            </section>

            {near.length ? (
              <section className="clubs-sec" aria-labelledby="club-near">
                <h2 className="section__title" id="club-near">
                  {t('clubs.near')}
                </h2>
                <div className="hscroll">
                  {near.map((c) => (
                    <ClubTile key={c.id} club={c} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>

      <ClubPickerSheet
        mode={planMode ?? 'meetup'}
        open={planMode !== null && !planClub}
        onClose={() => setPlanMode(null)}
        onPick={(c) => setPlanClub(c)}
      />
      <PlanSheet
        mode={planMode ?? 'meetup'}
        club={planClub}
        open={planMode !== null && !!planClub}
        onClose={() => {
          setPlanMode(null);
          setPlanClub(undefined);
        }}
        onDone={(c) => navigate(`/clubs/${c.id}`)}
      />
    </>
  );
}
