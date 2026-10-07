import { ONBOARDING_ROUTES } from '../../app/navigation';
import { brand } from '../../config/brand';
import { useBack } from '../onboarding/useStepNavigation';
import { AuthLayout, DemoNote } from './AuthLayout';

/**
 * Placeholders that show where the Terms and Privacy Policy live and what they must cover.
 * The real documents need to be written and reviewed (GDPR applies) before launch.
 */
function LegalPage({ title, sections }: { title: string; sections: Array<[string, string[]]> }) {
  const back = useBack();
  return (
    <AuthLayout title={title} subtitle={`${brand.name} · Draft outline`} onBack={() => back(ONBOARDING_ROUTES.welcome)}>
      <DemoNote>This is a placeholder outline, not the final text. It will be replaced before launch.</DemoNote>
      <div className="legal">
        {sections.map(([heading, points]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <ul>{points.map((p) => <li key={p}>{p}</li>)}</ul>
          </section>
        ))}
      </div>
    </AuthLayout>
  );
}

export function TermsScreen() {
  return (
    <LegalPage
      title="Terms"
      sections={[
        ['Who can use TurtleDoves', ['You must be 18 or older.', 'One account per person, with true information about yourself.']],
        ['How to treat people', ['No harassment, hate, threats, scams or sexual content without consent.', 'No asking for money, and no commercial use.']],
        ['Safety and moderation', ['Reports are reviewed, and accounts that break these rules can be limited or removed.', 'Verification badges don’t guarantee anyone is safe; meet in public.']],
        ['Premium', ['What Premium includes, how billing and cancelling work, and refunds.']],
        ['Your account', ['You can pause, download your data, or delete your account at any time.']],
      ]}
    />
  );
}

export function PrivacyScreen() {
  return (
    <LegalPage
      title="Privacy Policy"
      sections={[
        ['What we collect', ['Account details, your profile, approximate location, messages and safety reports.', 'Sensitive details (such as religion or what you’re looking for) only if you choose to add them.']],
        ['How it’s used', ['To show you to people who fit your preferences and to keep the community safe.', 'Never sold. Never used for advertising.']],
        ['Your choices', ['Hide any profile field, use incognito, pause, or delete your account.', 'Download everything we hold about you.']],
        ['Your rights (GDPR)', ['Access, correction, deletion, restriction and portability.', 'How to contact us and the supervisory authority (IMY in Sweden).']],
        ['Storage and retention', ['Where data is stored, for how long, and what happens after deletion.']],
      ]}
    />
  );
}
