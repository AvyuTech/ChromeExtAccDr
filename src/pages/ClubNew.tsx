import { PageHeader } from '../components/ui';

/** Start a club. Built out by the clubs work; a placeholder keeps the route alive meanwhile. */
export default function ClubNew() {
  return (
    <>
      <PageHeader title="Start a club" fallback="/clubs" />
      <main className="page page--with-header" />
    </>
  );
}
