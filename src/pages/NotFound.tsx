import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';
import { useT } from '../i18n';

export default function NotFound() {
  const t = useT();
  return (
    <main className="page" style={{ minHeight: '70dvh', justifyContent: 'center' }}>
      <EmptyState
        glyph="explore"
        title={t('social.notFound')}
        body={t('social.notFoundBody')}
        action={
          <div className="row" style={{ gap: 8, marginTop: 6 }}>
            <Link to="/" className="btn btn--primary">
              {t('nav.home')}
            </Link>
            <Link to="/explore" className="btn btn--soft">
              {t('nav.explore')}
            </Link>
          </div>
        }
      />
    </main>
  );
}
