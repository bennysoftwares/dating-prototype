import { RouterProvider } from 'react-router';
import { ToastProvider } from '../components/ui/Toast';
import { RepositoryProvider } from '../repositories/RepositoryContext';
import { SessionProvider } from '../session/SessionProvider';
import { ThemeProvider } from '../theme/ThemeProvider';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <RepositoryProvider>
        <SessionProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </SessionProvider>
      </RepositoryProvider>
    </ThemeProvider>
  );
}
