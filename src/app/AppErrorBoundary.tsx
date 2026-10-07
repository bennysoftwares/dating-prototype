import { Component, type ReactNode } from 'react';
import { RecoveryScreen } from '../screens/system/RouteError';

/**
 * Last-resort boundary around providers that sit above the router.
 * Route-level errors are handled by RouteError; both offer the same recovery.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    return this.state.error ? <RecoveryScreen /> : this.props.children;
  }
}
