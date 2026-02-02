import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  FiHome,
  FiFileText,
  FiImage,
  FiBell,
  FiFileText as FiPressRelease,
  FiCalendar,
  FiUsers,
  FiGrid,
  FiFolder,
  FiMapPin,
  FiFilm,
  FiLink,
  FiFile,
  FiHelpCircle,
  FiMail,
  FiUserPlus,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronDown,
} from 'react-icons/fi';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: FiHome },
  { name: 'News', path: '/content/news', icon: FiFileText },
  { name: 'Hero Banners', path: '/content/hero-banners', icon: FiImage },
  { name: 'Announcements', path: '/content/announcements', icon: FiBell },
  { name: 'Press Releases', path: '/content/press-releases', icon: FiPressRelease },
  { name: 'Events', path: '/content/events', icon: FiCalendar },
  { name: 'Leaders', path: '/content/leaders', icon: FiUsers },
  { name: 'Services', path: '/content/services', icon: FiGrid },
  { name: 'Projects', path: '/content/projects', icon: FiFolder },
  { name: 'MDAs', path: '/content/mdas', icon: FiFolder },
  { name: 'LGAs', path: '/content/lgas', icon: FiMapPin },
  { name: 'Media', path: '/content/media', icon: FiFilm },
  { name: 'Quick Links', path: '/content/quick-links', icon: FiLink },
  { name: 'Pages', path: '/content/pages', icon: FiFile },
  { name: 'FAQs', path: '/content/faqs', icon: FiHelpCircle },
  { name: 'Contacts', path: '/content/contacts', icon: FiMail },
  { name: 'Subscribers', path: '/content/subscribers', icon: FiUserPlus },
  { name: 'Users', path: '/content/users', icon: FiSettings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b bg-[#006838] flex-shrink-0">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <span className="text-xl font-bold text-[#006838]">G</span>
            </div>
            <span className="text-xl font-bold text-white">Ganuwa CMS</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-[#006838] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-10 h-16 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <FiMenu className="w-6 h-6" />
            </button>

            {/* Page Title */}
            <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
              {navItems.find((item) => isActive(item.path))?.name || 'Dashboard'}
            </h1>

            {/* User Menu */}
            <div className="relative ml-auto">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                  <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#006838] flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                    <div className="p-3 border-b">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
