import { RouterProvider } from 'react-router';
import { RepositoryProvider } from '../repositories/RepositoryContext';
import { SessionProvider } from '../session/SessionProvider';
import { ThemeProvider } from '../theme/ThemeProvider';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <RepositoryProvider>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </RepositoryProvider>
    </ThemeProvider>
  );
}
