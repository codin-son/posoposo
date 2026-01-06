import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  UtensilsCrossed,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  Users,
  Clock,
  Settings,
  Menu,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Cashier', icon: ShoppingCart, roles: ['superadmin', 'boss', 'staff'] },
    { path: '/orders', label: 'Orders', icon: ClipboardList, roles: ['superadmin', 'boss', 'staff'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['superadmin', 'boss'] },
    { path: '/menu-management', label: 'Menu', icon: UtensilsCrossed, roles: ['superadmin', 'boss'] },
    { path: '/users', label: 'Users', icon: Users, roles: ['superadmin'] },
    { path: '/attendance', label: 'Attendance', icon: Clock, roles: ['superadmin', 'boss', 'staff'] },
    { path: '/settings', label: 'Settings', icon: Settings, roles: ['superadmin'] },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="min-h-screen bg-base-200 flex">
      {/* Compact sidebar for tablet (768px - 1080px) - icon only */}
      <aside className="sidebar-compact flex-col bg-base-100 w-20 min-h-screen shadow-xl z-40">
        {/* Logo */}
        <div className="p-3 border-b border-base-200 flex justify-center">
          <div className="bg-primary rounded-xl p-2.5">
            <UtensilsCrossed className="w-7 h-7 text-primary-content" />
          </div>
        </div>
        
        {/* Navigation - icons only */}
        <nav className="flex-1 py-4">
          <ul className="flex flex-col items-center gap-2">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-center w-14 h-14 rounded-xl transition-all tooltip tooltip-right ${
                    location.pathname === item.path 
                      ? 'bg-primary text-primary-content shadow-lg' 
                      : 'hover:bg-base-200 text-base-content'
                  }`}
                  data-tip={item.label}
                >
                  <item.icon size={26} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User section - compact */}
        <div className="p-3 border-t border-base-200 flex flex-col items-center gap-3">
          <div className="avatar placeholder tooltip tooltip-right" data-tip={user?.fullName}>
            <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 text-lg">
              <span>{user?.fullName?.charAt(0) || 'U'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-circle btn-outline btn-error tooltip tooltip-right"
            data-tip="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Full sidebar for large screens (>1080px) */}
      <aside className="sidebar-full flex-col bg-base-100 w-72 min-h-screen shadow-xl z-40">
        {/* Logo section */}
        <div className="p-5 border-b border-base-200">
          <div className="flex items-center gap-4">
            <div className="bg-primary rounded-xl p-3">
              <UtensilsCrossed className="w-8 h-8 text-primary-content" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Western Restaurant</h1>
              <p className="text-sm text-base-content/60">POS System</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="menu gap-2">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-4 py-4 px-5 text-lg rounded-xl transition-all ${
                    location.pathname === item.path 
                      ? 'active bg-primary text-primary-content font-semibold' 
                      : 'hover:bg-base-200'
                  }`}
                >
                  <item.icon size={24} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight size={18} className="opacity-50" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User section */}
        <div className="p-5 border-t border-base-200">
          <div className="flex items-center gap-4 mb-4 px-2">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 text-lg">
                <span>{user?.fullName?.charAt(0) || 'U'}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">{user?.fullName}</p>
              <p className="text-sm text-base-content/60 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-lg btn-outline btn-error w-full"
          >
            <LogOut size={22} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile drawer (below 768px) */}
      <div className="mobile-drawer flex-col">
        <div className="drawer flex-1">
          <input
            id="sidebar"
            type="checkbox"
            className="drawer-toggle"
            checked={sidebarOpen}
            onChange={() => setSidebarOpen(!sidebarOpen)}
          />
          
          <div className="drawer-content flex flex-col">
            {/* Mobile header */}
            <header className="navbar bg-base-100 shadow-sm px-4 min-h-16">
              <div className="flex-none">
                <label htmlFor="sidebar" className="btn btn-square btn-ghost btn-lg">
                  <Menu size={28} />
                </label>
              </div>
              <div className="flex-1 ml-2">
                <span className="text-xl font-bold">Western Restaurant</span>
              </div>
            </header>
            
            <main className="flex-1 p-4 overflow-auto">
              {children}
            </main>
          </div>
          
          {/* Mobile drawer sidebar */}
          <div className="drawer-side z-50">
            <label htmlFor="sidebar" className="drawer-overlay"></label>
            <aside className="bg-base-100 w-80 min-h-screen flex flex-col shadow-xl">
              {/* Logo section */}
              <div className="p-5 border-b border-base-200">
                <div className="flex items-center gap-4">
                  <div className="bg-primary rounded-xl p-3">
                    <UtensilsCrossed className="w-8 h-8 text-primary-content" />
                  </div>
                  <div>
                    <h1 className="font-bold text-xl">Western Restaurant</h1>
                    <p className="text-sm text-base-content/60">POS System</p>
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 p-4">
                <ul className="menu gap-2">
                  {filteredNavItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-4 py-4 px-5 text-lg rounded-xl transition-all ${
                          location.pathname === item.path 
                            ? 'active bg-primary text-primary-content font-semibold' 
                            : 'hover:bg-base-200'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon size={24} />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight size={18} className="opacity-50" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              
              {/* User section */}
              <div className="p-5 border-t border-base-200">
                <div className="flex items-center gap-4 mb-4 px-2">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 text-lg">
                      <span>{user?.fullName?.charAt(0) || 'U'}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg truncate">{user?.fullName}</p>
                    <p className="text-sm text-base-content/60 capitalize">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-lg btn-outline btn-error w-full"
                >
                  <LogOut size={22} />
                  Logout
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Main content for tablet/desktop (with sidebars) */}
      <main className="main-tablet-desktop flex-1 flex-col p-4 md:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
