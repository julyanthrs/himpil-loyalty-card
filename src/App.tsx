import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LogoMark } from './components/brand/Logo';
import { AppShell } from './components/layout/AppShell';
import { ButtonLink } from './components/ui/Button';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoyaltyProvider } from './context/LoyaltyContext';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';

const MyCard = lazy(() => import('./pages/MyCard'));
const Scan = lazy(() => import('./pages/Scan'));
const Rewards = lazy(() => import('./pages/Rewards'));
const Activity = lazy(() => import('./pages/Activity'));
const Profile = lazy(() => import('./pages/Profile'));
const Staff = lazy(() => import('./pages/Staff'));
const Login = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Register })));

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading">
      <LogoMark className="h-14 w-auto animate-pulse" />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Splash />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <LoyaltyProvider key={user.id}>{children}</LoyaltyProvider>;
}

function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="label-caps">404</p>
      <h1 className="mt-3 text-3xl font-medium">This cup is empty</h1>
      <p className="mt-2 text-subtle">The page you’re looking for doesn’t exist.</p>
      <ButtonLink to="/" className="mt-8">
        Back home
      </ButtonLink>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<Splash />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/staff" element={<Staff />} />
              <Route
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route index element={<Home />} />
                <Route path="card" element={<MyCard />} />
                <Route path="scan" element={<Scan />} />
                <Route path="rewards" element={<Rewards />} />
                <Route path="activity" element={<Activity />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
