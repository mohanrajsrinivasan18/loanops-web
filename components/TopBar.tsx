'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useDarkMode } from '@/lib/contexts/DarkModeContext';
import TenantSelector from './TenantSelector';
import { Search, Moon, Sun, ChevronDown, Settings, LogOut, User } from 'lucide-react';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 h-14">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-all"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 ml-4">
          <TenantSelector />

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-semibold text-xs">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-neutral-900 leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-neutral-400 capitalize">{user?.role?.replace('_', ' ') || 'Admin'}</p>
              </div>
              <ChevronDown size={14} className="text-neutral-400 hidden md:block" />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-neutral-200 z-50 overflow-hidden">
                  <div className="p-3 border-b border-neutral-100">
                    <p className="text-sm font-semibold text-neutral-900">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-neutral-400">{user?.email || ''}</p>
                  </div>
                  <div className="p-1.5">
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-50 transition text-left text-sm text-neutral-600">
                      <User size={15} /> Profile
                    </button>
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-50 transition text-left text-sm text-neutral-600">
                      <Settings size={15} /> Settings
                    </button>
                  </div>
                  <div className="p-1.5 border-t border-neutral-100">
                    <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-danger-50 transition text-left text-sm text-danger-600 font-medium">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
