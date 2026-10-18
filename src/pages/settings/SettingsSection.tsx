import type { ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, PageHeader } from '../../components/ui';
import { useT } from '../../i18n';
import { SECTIONS, type SectionId } from './meta';
import { AccessibilitySection, AppearanceSection, LanguageSection } from './sectionsDisplay';
import { AboutSection, HelpSection, HumanSection, PhotoCreditsSection, SafetySection } from './sectionsSupport';
import { DataSection, PrivacySection, SourcesSection } from './sectionsTrust';
import { HelpfulSection } from './sectionsHelpful';
import { IdentitySection } from './sectionsIdentity';
import { AccountSection, AlertsSection, LocationSection, NotificationsSection } from './sectionsYou';

const BODIES: Record<SectionId, ComponentType> = {
  account: AccountSection,
  identity: IdentitySection,
  helpful: HelpfulSection,
  location: LocationSection,
  notifications: NotificationsSection,
  alerts: AlertsSection,
  appearance: AppearanceSection,
  language: LanguageSection,
  accessibility: AccessibilitySection,
  privacy: PrivacySection,
  sources: SourcesSection,
  data: DataSection,
  safety: SafetySection,
  help: HelpSection,
  about: AboutSection,
  human: HumanSection,
  credits: PhotoCreditsSection,
};

export default function SettingsSection() {
  const t = useT();
  const { section } = useParams();
  const meta = SECTIONS.find((s) => s.id === section);

  if (!meta) {
    return (
      <>
        <PageHeader title={t('settings.title')} fallback="/settings" />
        <main className="page page--with-header">
          <EmptyState
            glyph="question"
            title={t('settings.unknown')}
            action={
              <Link to="/settings" className="btn btn--soft btn--sm">
                {t('settings.backToSettings')}
              </Link>
            }
          />
        </main>
      </>
    );
  }

  const Body = BODIES[meta.id];
  return (
    <>
      <PageHeader title={t(meta.key)} fallback={meta.nested ? '/settings/about' : '/settings'} />
      <main className="page page--with-header settings-page">
        <Body />
      </main>
    </>
  );
}
