import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  UtensilsCrossed,
  ShoppingCart,
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
      <div className="drawer lg:drawer-open">
        <input
          id="sidebar"
          type="checkbox"
          className="drawer-toggle"
          checked={sidebarOpen}
          onChange={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <div className="drawer-content flex flex-col">
          <header className="navbar bg-base-100 shadow-sm lg:hidden">
            <div className="flex-none">
              <label htmlFor="sidebar" className="btn btn-square btn-ghost">
                <Menu size={24} />
              </label>
            </div>
            <div className="flex-1">
              <span className="text-xl font-bold">Western Restaurant</span>
            </div>
          </header>
          
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
        
        <div className="drawer-side z-50">
          <label htmlFor="sidebar" className="drawer-overlay"></label>
          <aside className="bg-base-100 w-72 min-h-screen flex flex-col">
            <div className="p-4 border-b border-base-200">
              <div className="flex items-center gap-3">
                <div className="bg-primary rounded-lg p-2">
                  <UtensilsCrossed className="w-8 h-8 text-primary-content" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Western Restaurant</h1>
                  <p className="text-xs text-base-content/60">POS System</p>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 p-4">
              <ul className="menu gap-1">
                {filteredNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 touch-target ${
                        location.pathname === item.path ? 'active' : ''
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon size={20} />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight size={16} className="opacity-50" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="p-4 border-t border-base-200">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-10">
                    <span>{user?.fullName?.charAt(0) || 'U'}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user?.fullName}</p>
                  <p className="text-xs text-base-content/60 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-error w-full touch-target"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
