import { RouterProvider } from 'react-router';
import { RepositoryProvider } from '../repositories/RepositoryContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <RepositoryProvider>
        <RouterProvider router={router} />
      </RepositoryProvider>
    </ThemeProvider>
  );
}
