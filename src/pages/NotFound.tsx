import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { Logo, PinGlyph, SparkleMark } from '../icons';

export default function NotFound() {
  const t = useT();
  return (
    <main className="page lost-page">
      <div className="lost-art" aria-hidden="true">
        <span className="lost-art__ring" />
        <span className="lost-art__ring lost-art__ring--2" />
        <span className="lost-art__logo">
          <Logo size={84} tile animated={false} />
        </span>
        <span className="lost-art__pin lost-art__pin--a">
          <PinGlyph size={18} />
        </span>
        <span className="lost-art__pin lost-art__pin--b">
          <PinGlyph size={16} />
        </span>
        <span className="lost-art__spark">
          <SparkleMark size={24} />
        </span>
      </div>
      <span className="eyebrow muted">404</span>
      <h1 className="hero-title">{t('social.lostTitle')}</h1>
      <p className="body muted" style={{ margin: 0, maxWidth: 300 }}>
        {t('social.notFoundBody')}
      </p>
      <div className="row" style={{ gap: 10, marginTop: 6 }}>
        <Link to="/" className="btn btn--primary">
          {t('nav.home')}
        </Link>
        <Link to="/explore" className="btn btn--soft">
          {t('nav.explore')}
        </Link>
      </div>
    </main>
  );
}
