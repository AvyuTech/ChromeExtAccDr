import { useState } from 'react';
import { PageHeader, SectionHead, Segmented, Switch } from '../components/ui';
import {
  AqiDial,
  aqiBand,
  BellGlyph,
  ChatGlyph,
  CityGlyph,
  CountdownRing,
  ExploreGlyph,
  GLYPHS,
  HeartGlyph,
  HomeGlyph,
  Logo,
  Wordmark,
  MeGlyph,
  NamedGlyph,
  PowerGlyph,
  SaveGlyph,
  SparkGlyph,
  StepRing,
  TRAFFIC_LABEL,
  TrafficGlyph,
  TrustRing,
  UpvoteGlyph,
  WaterGlyph,
  WeatherGlyph,
  type GlyphName,
  type TrafficLevel,
  type WeatherCondition,
} from '../icons';

const CATEGORY: GlyphName[] = [
  'food',
  'cafe',
  'events',
  'deals',
  'alert',
  'movies',
  'getaways',
  'groups',
  'services',
  'safety',
  'report',
  'music',
  'market',
  'mic',
  'heritage',
  'pottery',
  'sports',
  'kids',
  'nature',
];
const WEATHER: WeatherCondition[] = ['sunny', 'partly', 'cloudy', 'rain', 'storm', 'haze', 'night'];

/** A living spec sheet for the Nearhood glyph family. */
export default function Glyphs() {
  const [nav, setNav] = useState(0);
  const [live, setLive] = useState(true);
  const [aqi, setAqi] = useState(118);
  const [traffic, setTraffic] = useState<TrafficLevel>(2);
  const [water, setWater] = useState(0.6);
  const [power, setPower] = useState<'ok' | 'scheduled' | 'outage'>('scheduled');
  const [agree, setAgree] = useState(3);
  const [step, setStep] = useState(3);
  const [mins, setMins] = useState(4);
  const [up, setUp] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [logoKey, setLogoKey] = useState(0);

  const navGlyphs = [
    { label: 'Home', G: HomeGlyph },
    { label: 'Explore', G: ExploreGlyph },
    { label: 'City', G: CityGlyph },
    { label: 'Me', G: MeGlyph },
  ];

  return (
    <>
      <PageHeader title="Nearhood glyphs" fallback="/settings/about" sub="Hand-drawn, data-driven icon family" />
      <main className="page page--with-header">
        <section className="glyph-section stack" aria-labelledby="g-brand">
          <SectionHead id="g-brand" title="Brand mark" />
          <div className="brand-sheet">
            <span className="brand-sheet__cell">
              <Logo key={logoKey} size={52} title="Nearhood logo" />
            </span>
            <span className="brand-sheet__cell brand-sheet__cell--violet">
              <Logo key={`tile-${logoKey}`} size={52} tile title="Nearhood app icon" />
            </span>
            <span className="brand-sheet__word">
              <Wordmark size={30} />
              <span className="meta">A little closer to your city.</span>
            </span>
          </div>
          <p className="body-sm">The arch is a doorway and an "n"; the lime dot is "you are here". Every glyph below borrows that dot as its accent.</p>
          <button type="button" className="btn btn--soft btn--sm" style={{ alignSelf: 'flex-start' }} onClick={() => setLogoKey((k) => k + 1)}>
            Replay
          </button>
        </section>

        <section className="glyph-section stack" aria-labelledby="g-nav">
          <SectionHead id="g-nav" title="Tab bar" />
          <p className="body-sm muted">Tap a tab: the roof hops, the compass needle swings, the city's windows light up and its tower broadcasts, the neighbourhood ring turns.</p>
          <div className="glyph-grid glyph-grid--4" role="radiogroup" aria-label="Active tab">
            {navGlyphs.map(({ label, G }, i) => (
              <button key={label} type="button" role="radio" aria-checked={nav === i} className="glyph-cell nav-item" onClick={() => setNav(i)} style={{ color: nav === i ? 'var(--accent)' : 'var(--muted)' }}>
                <G size={30} active={nav === i} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="row" style={{ gap: 18 }}>
            <span className="row meta">
              <BellGlyph size={26} ringing /> New updates
            </span>
            <span className="row meta">
              <ChatGlyph size={26} typing /> Unread chat
            </span>
            <span className="row meta">
              <SparkGlyph size={26} thinking style={{ color: 'var(--accent)' }} /> Answering
            </span>
          </div>
        </section>

        <section className="glyph-section stack" aria-labelledby="g-cat">
          <div className="row row--between">
            <SectionHead id="g-cat" title="Categories" />
            <span className="row meta">
              Motion <Switch checked={live} onChange={setLive} label="Ambient motion" />
            </span>
          </div>
          <div className="glyph-grid">
            {CATEGORY.map((name) => (
              <span key={name} className="glyph-cell">
                <span className="tile tile--lg tone-violet">
                  <NamedGlyph name={name} size={26} duo live={live} />
                </span>
                <span>{name}</span>
              </span>
            ))}
          </div>
        </section>

        <section className="glyph-section stack" aria-labelledby="g-weather">
          <SectionHead id="g-weather" title="Weather" />
          <div className="glyph-grid">
            {WEATHER.map((c) => (
              <span key={c} className="glyph-cell">
                <WeatherGlyph condition={c} size={40} />
                <span>{c}</span>
              </span>
            ))}
          </div>
        </section>

        <section className="glyph-section stack" aria-labelledby="g-aqi">
          <SectionHead id="g-aqi" title="Air quality dial" />
          <div className="row" style={{ justifyContent: 'center' }}>
            <AqiDial value={aqi} size={200} />
          </div>
          <label className="field">
            <span className="field__label">
              AQI {aqi} · {aqiBand(aqi).label}
            </span>
            <input className="range" type="range" min={0} max={500} value={aqi} onChange={(e) => setAqi(Number(e.target.value))} />
          </label>
        </section>

        <section className="glyph-section stack" aria-labelledby="g-live">
          <SectionHead id="g-live" title="Live city signals" />
          <div className="grid-2">
            <div className="glyph-demo">
              <span className={`tile tile--xl tone-${traffic === 0 ? 'mint' : traffic === 1 ? 'amber' : 'peach'}`}>
                <TrafficGlyph level={traffic} size={40} />
              </span>
              <Segmented label="Traffic" value={traffic} onChange={setTraffic} options={[0, 1, 2, 3].map((v) => ({ value: v as TrafficLevel, label: String(v) }))} />
              <span className="meta">{TRAFFIC_LABEL[traffic]}: lane markings stream at the speed traffic moves</span>
            </div>
            <div className="glyph-demo">
              <span className="tile tile--xl tone-blue">
                <WaterGlyph level={water} size={40} />
              </span>
              <input className="range" type="range" min={0} max={1} step={0.05} value={water} aria-label="Water level" onChange={(e) => setWater(Number(e.target.value))} />
              <span className="meta">Supply level {Math.round(water * 100)}%</span>
            </div>
            <div className="glyph-demo">
              <span className="tile tile--xl tone-yellow">
                <PowerGlyph status={power} size={40} />
              </span>
              <Segmented
                label="Power"
                value={power}
                onChange={setPower}
                options={[
                  { value: 'ok', label: 'On' },
                  { value: 'scheduled', label: 'Plan' },
                  { value: 'outage', label: 'Out' },
                ]}
              />
              <span className="meta">Steady, planned cut, or flickering outage</span>
            </div>
            <div className="glyph-demo">
              <span className="tile tile--xl tone-mint">
                <TrustRing agree={agree} size={44} key={agree} />
              </span>
              <Segmented label="Sources agreeing" value={agree} onChange={setAgree} options={[1, 2, 3, 4].map((v) => ({ value: v, label: String(v) }))} />
              <span className="meta">{agree === 1 ? 'Single source: shown as unconfirmed' : `${agree} sources agree`}</span>
            </div>
            <div className="glyph-demo">
              <span className="tile tile--xl tone-blue">
                <CountdownRing value={mins} max={10} size={52} />
              </span>
              <input className="range" type="range" min={0} max={10} value={mins} aria-label="Minutes left" onChange={(e) => setMins(Number(e.target.value))} />
              <span className="meta">Countdown to a plan or a deal ending</span>
            </div>
            <div className="glyph-demo">
              <StepRing step={step} size={64} key={step}>
                <NamedGlyph name="pothole" size={26} duo />
              </StepRing>
              <input className="range" type="range" min={0} max={4} value={step} aria-label="Report status" onChange={(e) => setStep(Number(e.target.value))} />
              <span className="meta">Civic report progress</span>
            </div>
          </div>
        </section>

        <section className="glyph-section stack" aria-labelledby="g-react">
          <SectionHead id="g-react" title="Reactions" />
          <div className="row row--wrap" style={{ gap: 8 }}>
            <button type="button" className="btn btn--sm btn--outline" aria-pressed={up} onClick={() => setUp((v) => !v)} style={{ color: up ? 'var(--accent)' : undefined }}>
              <UpvoteGlyph size={20} active={up} /> Upvote
            </button>
            <button type="button" className="btn btn--sm btn--outline" aria-pressed={saved} onClick={() => setSaved((v) => !v)} style={{ color: saved ? 'var(--accent)' : undefined }}>
              <SaveGlyph size={20} active={saved} /> Save
            </button>
            <button type="button" className="btn btn--sm btn--outline" aria-pressed={liked} onClick={() => setLiked((v) => !v)} style={{ color: liked ? 'var(--red)' : undefined }}>
              <HeartGlyph size={20} active={liked} /> Love
            </button>
          </div>
        </section>

        <section className="glyph-section stack" aria-labelledby="g-all">
          <SectionHead id="g-all" title={`Full set · ${Object.keys(GLYPHS).length}`} />
          <div className="glyph-grid">
            {(Object.keys(GLYPHS) as GlyphName[]).map((name) => (
              <span key={name} className="glyph-cell glyph-host">
                <NamedGlyph name={name} size={26} duo />
                <span>{name}</span>
              </span>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
