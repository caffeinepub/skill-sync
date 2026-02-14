import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SkillMatchPage from './pages/SkillMatchPage';
import LiveClassPage from './pages/LiveClassPage';
import LoginPage from './pages/LoginPage';
import SignupProfilePage from './pages/SignupProfilePage';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/auth/RequireAuth';
import RequireProfile from './components/auth/RequireProfile';
import { Toaster } from '@/components/ui/sonner';

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupProfilePage,
});

const skillMatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/skill-match',
  component: SkillMatchPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => (
    <RequireAuth>
      <RequireProfile>
        <DashboardPage />
      </RequireProfile>
    </RequireAuth>
  ),
});

const liveClassRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/live-class',
  component: () => (
    <RequireAuth>
      <RequireProfile>
        <LiveClassPage />
      </RequireProfile>
    </RequireAuth>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  skillMatchRoute,
  dashboardRoute,
  liveClassRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
