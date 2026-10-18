import { PageHeader } from '../components/ui';

export default function NotFound() {
  return (
    <>
      <PageHeader title="Not found" />
      <main className="page page--with-header">
        <p className="muted">Coming together…</p>
      </main>
    </>
  );
}
