import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from './store/authStore';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import News from './pages/content/News';
import HeroBanners from './pages/content/HeroBanners';
import Announcements from './pages/content/Announcements';
import PressReleases from './pages/content/PressReleases';
import Events from './pages/content/Events';
import Leaders from './pages/content/Leaders';
import Services from './pages/content/Services';
import Projects from './pages/content/Projects';
import MDAs from './pages/content/MDAs';
import LGAs from './pages/content/LGAs';
import Media from './pages/content/Media';
import QuickLinks from './pages/content/QuickLinks';
import Pages from './pages/content/Pages';
import FAQs from './pages/content/FAQs';
import Contacts from './pages/content/Contacts';
import Subscribers from './pages/content/Subscribers';
import Users from './pages/content/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Content Management Routes */}
          <Route
            path="/content/news"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <News />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/hero-banners"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <HeroBanners />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/announcements"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Announcements />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/press-releases"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PressReleases />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/events"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Events />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/leaders"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Leaders />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/services"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Services />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/projects"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Projects />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/mdas"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MDAs />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/lgas"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LGAs />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/media"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Media />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/quick-links"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <QuickLinks />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/pages"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Pages />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/faqs"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <FAQs />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/contacts"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Contacts />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/subscribers"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Subscribers />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/users"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Users />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </QueryClientProvider>
  );
}

export default App