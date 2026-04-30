import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  LayoutDashboard, Package, Users, Router, Ticket, UserCheck,
  Activity, LogOut, Menu, X, ChevronDown, Wifi, Settings, Moon, Sun
} from 'lucide-react';

const navigation = {
  superadmin: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Paket', href: '/packages', icon: Package },
    { name: 'Pelanggan', href: '/clients', icon: Users },
    { name: 'Router', href: '/routers', icon: Router },
    { name: 'Voucher', href: '/vouchers', icon: Ticket },
    { name: 'Staff', href: '/staff', icon: UserCheck },
    { name: 'Monitoring', href: '/monitoring', icon: Activity },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ],
  noc: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Pelanggan', href: '/clients', icon: Users },
    { name: 'Router', href: '/routers', icon: Router },
    { name: 'Monitoring', href: '/monitoring', icon: Activity },
  ],
  reseller: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Voucher', href: '/vouchers', icon: Ticket },
  ],
  client: [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { settings, darkMode, toggleDarkMode } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = navigation[user?.role] || navigation.client;
  const appName = settings.app_name || 'RadiusBill';
  const logoUrl = settings.app_logo ? `/storage/${settings.app_logo}` : null;

  const handleLogout = async () => {
    const isClient = user?.role === 'client';
    await logout();
    navigate(isClient ? '/client-login' : '/login');
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-950 text-gray-100' : ''}`}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-gray-600/75" />
        </div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-6 border-b border-gray-800">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 min-w-0">
              {logoUrl ? (
                <div className="flex flex-col items-center gap-1 py-2">
                  <img src={logoUrl} alt={appName} className="h-10 w-10 object-contain rounded-lg" />
                  <span className="text-white font-bold text-sm truncate">{appName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wifi className="h-6 w-6 text-blue-400" />
                  <span className="text-white font-bold text-lg truncate">{appName}</span>
                </div>
              )}
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white ml-2">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="mt-6 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                `}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className={`h-16 border-b flex items-center justify-between px-4 lg:px-6 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <button onClick={() => setSidebarOpen(true)} className={`lg:hidden ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1" />

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg mr-2 transition-colors ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="hidden sm:block">{user?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {profileOpen && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-1 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : ''}`}>{user?.name}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 p-4 lg:p-6 overflow-auto ${darkMode ? 'bg-gray-950' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
