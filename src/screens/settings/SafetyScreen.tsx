import { useNavigate } from 'react-router';
import { Screen, Section } from '../../components/layout';
import { IconButton, ListGroup, ListRow } from '../../components/ui';
import { REPORT_CATEGORY_LABELS } from '../../domain/profileOptions';
import { useAsync } from '../../hooks/useAsync';
import { useRepositories } from '../../repositories/RepositoryContext';
import './Settings.css';

/** Safety tips and your reports. Safety tools are free for everyone. */
export function SafetyScreen() {
  const navigate = useNavigate();
  const { safety, profiles } = useRepositories();
  const reports = useAsync(async () => {
    const list = await safety.listReports();
    return Promise.all(list.map(async (r) => ({ report: r, name: (await profiles.getProfileByUserId(r.reportedUserId))?.firstName ?? 'Someone' })));
  }, [safety, profiles]);

  return (
    <Screen title="Safety" leading={<IconButton icon="chevronLeft" label="Back" onClick={() => navigate(-1)} />}>
      <Section title="Meeting someone new">
        <ul className="settings__tips">
          <li><strong>Meet in public.</strong> Somewhere busy for the first few dates.</li>
          <li><strong>Tell a friend.</strong> Use Share date from the date card in your chat.</li>
          <li><strong>Get there your own way.</strong> Keep your own transport and phone charged.</li>
          <li><strong>Trust your instincts.</strong> You can leave at any point. You don't owe anyone an explanation.</li>
          <li><strong>Keep money out of it.</strong> Never send money or financial details to someone you haven't met.</li>
        </ul>
      </Section>
      <Section title="Report, block or unmatch" description="Open the ··· menu on any profile or conversation. Nobody is ever told who reported or blocked them.">
        <p className="settings__note">If you're in danger, contact local emergency services first.</p>
      </Section>
      <Section title="Your reports">
        {reports.status === 'success' && reports.data.length === 0 && <p className="settings__note">You haven't reported anyone.</p>}
        {reports.status === 'success' && reports.data.length > 0 && (
          <ListGroup label="Your reports">
            {reports.data.map(({ report, name }) => (
              <ListRow
                key={report.id}
                icon="flag"
                title={`${name} · ${REPORT_CATEGORY_LABELS[report.category]}`}
                subtitle={`Received ${new Date(report.createdAt).toLocaleDateString()}${report.alsoBlocked ? ' · Blocked' : ''}`}
              />
            ))}
          </ListGroup>
        )}
      </Section>
    </Screen>
  );
}
