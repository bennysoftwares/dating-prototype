import { Outlet, useLocation } from 'react-router';
import { useConnections } from '../../connections/ConnectionsProvider';
import { BottomNav } from './BottomNav';
import './AppShell.css';

/** Persistent frame: skip link, routed content and primary navigation. */
export function AppShell() {
  const location = useLocation();
  const { pendingLikeCount, unreadConversationCount } = useConnections();
  return (
    <div className="shell">
      <a href="#main" className="shell__skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <main id="main" tabIndex={-1} className="shell__main">
        {/* Keyed by path so each screen gets a subtle entrance. */}
        <div key={location.pathname} className="shell__page">
          <Outlet />
        </div>
      </main>
      <BottomNav badges={{ '/likes': pendingLikeCount, '/chats': unreadConversationCount }} />
    </div>
  );
}
