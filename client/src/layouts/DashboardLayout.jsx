import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/api';
import useNetworkStatus from '../hooks/useNetworkStatus';
import {
  LayoutDashboard,
  Layers,
  Container,
  Scale,
  Droplet,
  Skull,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  ThermometerSun,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  CloudSun,
  User,
  ClipboardList,
  UserCheck,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Active Batch', path: '/batches', icon: Layers },
  { name: 'Add Batch', path: '/add-batch', icon: PlusCircle },
  { name: 'Daily Farm Log', path: '/logs', icon: ClipboardList },
  { name: 'Weight Tracking', path: '/weight', icon: Scale },
  { name: 'Feed Management', path: '/feed', icon: Container },
  { name: 'Mortality', path: '/mortality', icon: Skull },
  { name: 'Environment', path: '/environment', icon: ThermometerSun },
  { name: 'Supervisor', path: '/supervisor', icon: UserCheck },
  { name: 'Reports', path: '/reports', icon: FileBarChart },
  { name: 'Batch Comparison', path: '/comparison', icon: Layers },
  { name: 'Settlement', path: '/settlement', icon: TrendingUp },
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, pendingCount, triggerSync } = useNetworkStatus();

  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerSync();
    setIsSyncing(false);
  };

  useEffect(() => {
    // Current date display
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-brand-primary text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-3">
            <img src="/logo.jpg" alt="M-CHICKS" className="w-10 h-10 rounded-full border border-white/20 object-cover" />
            <div>
              <h1 className="text-lg font-black tracking-wider">M-CHICKS</h1>
              <p className="text-[10px] text-white/70 font-semibold tracking-widest uppercase">Broiler Farm</p>
            </div>
          </div>
          {/* Close button mobile */}
          <button className="lg:hidden text-white/80 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'bg-brand-highlight text-white shadow-md shadow-brand-highlight/20'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 transition-transform duration-150 group-hover:scale-110 ${isActive ? 'text-white' : 'text-white/70'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
              location.pathname === '/settings' ? 'bg-brand-highlight text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="w-5 h-5 mr-3 text-white/70" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-semibold text-red-200 hover:text-white hover:bg-red-900/30 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-red-300" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-red-100 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center">
            {/* Hamburger menu mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Greeting / Subtitle */}
            <div className="min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-brand-primary leading-tight truncate">Good Morning, Madhan</h2>
              <p className="hidden sm:block text-xs text-gray-500 font-semibold truncate">M-CHICKS Farm Overview</p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-4">
            {/* Sync Indicator */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {isOnline ? (
                pendingCount > 0 ? (
                  <button onClick={handleManualSync} disabled={isSyncing} className="flex items-center text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-orange-200">
                    <RefreshCw className={`w-3 h-3 sm:mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Syncing...</span>
                  </button>
                ) : (
                  <span className="flex items-center text-[10px] sm:text-xs font-bold text-green-600 bg-green-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-green-200">
                    <Wifi className="w-3 h-3 sm:mr-1.5" />
                    <span className="hidden sm:inline">Online</span>
                  </span>
                )
              ) : (
                <Link to="/sync-queue" className="flex items-center text-[10px] sm:text-xs font-bold text-red-600 bg-red-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-red-200 hover:bg-red-200 transition-colors">
                  <WifiOff className="w-3 h-3 mr-1" />
                  <span>{pendingCount} <span className="hidden sm:inline">waiting</span></span>
                </Link>
              )}
            </div>

            {/* Date Display */}
            <span className="hidden md:inline-flex text-xs font-bold text-gray-500 bg-brand-bg px-3 py-1.5 rounded-full border border-red-50/50">
              {currentDate}
            </span>

            {/* Weather Widget */}
            <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-gray-600 bg-brand-bg px-3 py-1.5 rounded-full border border-red-50/50">
              <CloudSun className="w-4 h-4 text-brand-highlight" />
              <span>{isOnline ? '31°C, Chengalpattu' : 'Weather Unavailable'}</span>
            </div>

            {/* Profile Avatar / Dropdown */}
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-brand-highlight/10 border border-brand-highlight/20 flex items-center justify-center text-brand-primary">
                <User className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-gray-700 hidden lg:inline">Madhan</span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
