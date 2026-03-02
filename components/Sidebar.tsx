'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import { useBranding } from '@/lib/BrandingProvider';
import { getNavigationForRole } from '@/lib/navigation';
import * as Icons from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const branding = useBranding();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = getNavigationForRole(user.role);

  // Different grouping for super admin
  const groupedNav = user.role === 'super_admin' ? {
    platform: navItems.filter(item =>
      ['Platform Overview', 'Tenants'].includes(item.label)
    ),
    features: navItems.filter(item =>
      ['Plans & Pricing', 'Billing & Revenue', 'Feature Flags'].includes(item.label)
    ),
    analytics: navItems.filter(item =>
      ['Analytics'].includes(item.label)
    ),
  } : {
    main: navItems.filter(item =>
      ['Dashboard', 'Customers', 'Loans', 'Lines'].includes(item.label)
    ),
    management: navItems.filter(item =>
      ['Agents', 'Tenants'].includes(item.label)
    ),
    analytics: navItems.filter(item =>
      ['Reports', 'Analytics', 'Map Analytics', 'System Analytics', 'Risk'].includes(item.label)
    ),
    settings: navItems.filter(item =>
      ['Settings', 'Config', 'System Config', 'Billing'].includes(item.label)
    ),
  };

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileOpen]);

  const NavItem = ({ item }: { item: any }) => {
    const Icon = (Icons as any)[item.icon] || Icons.Circle;
    const isActive = pathname === item.href;

    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={`
          group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
          transition-all duration-150
          ${isActive
            ? 'bg-primary-50 text-primary-700 font-semibold'
            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
          }
          ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
        `}
      >
        <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
        <span className={isCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
        {isActive && !isCollapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
        )}
      </Link>
    );
  };

  const SectionTitle = ({ title }: { title: string }) => {
    if (isCollapsed) return <div className="hidden lg:block h-px bg-neutral-100 my-2 mx-3" />;
    return (
      <div className="px-3 pt-4 pb-1">
        <h3 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">{title}</h3>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <Icons.X size={22} /> : <Icons.Menu size={22} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen bg-white flex flex-col z-50
        transition-all duration-300 ease-out border-r border-neutral-200
        ${isCollapsed ? 'lg:w-[68px]' : 'lg:w-[260px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-[280px] shadow-xl lg:shadow-none
      `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
              <Icons.DollarSign size={16} className="text-white" strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-neutral-900 leading-tight">{branding.companyName}</span>
                <span className="text-[10px] text-neutral-400 font-medium">Loan Platform</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-md hover:bg-neutral-100 items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {isCollapsed ? <Icons.ChevronRight size={16} /> : <Icons.ChevronLeft size={16} />}
          </button>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden w-7 h-7 rounded-md hover:bg-neutral-100 flex items-center justify-center text-neutral-400">
            <Icons.X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-1 overflow-y-auto scrollbar-thin">
          {user.role === 'super_admin' ? (
            <>
              {groupedNav.platform && groupedNav.platform.length > 0 && (
                <div>
                  <SectionTitle title="Platform" />
                  <ul className="space-y-0.5">{groupedNav.platform.map(item => <li key={item.href}><NavItem item={item} /></li>)}</ul>
                </div>
              )}
              {groupedNav.features && groupedNav.features.length > 0 && (
                <div>
                  <SectionTitle title="Features" />
                  <ul className="space-y-0.5">{groupedNav.features.map(item => <li key={item.href}><NavItem item={item} /></li>)}</ul>
                </div>
              )}
              {groupedNav.analytics && groupedNav.analytics.length > 0 && (
                <div>
                  <SectionTitle title="Analytics" />
                  <ul className="space-y-0.5">{groupedNav.analytics.map(item => <li key={item.href}><NavItem item={item} /></li>)}</ul>
                </div>
              )}
            </>
          ) : (
            <>
              {groupedNav.main && groupedNav.main.length > 0 && (
                <div>
                  <SectionTitle title="Main" />
                  <ul className="space-y-0.5">{groupedNav.main.map(item => <li key={item.href}><NavItem item={item} /></li>)}</ul>
                </div>
              )}
              {groupedNav.management && groupedNav.management.length > 0 && (
                <div>
                  <SectionTitle title="Management" />
                  <ul className="space-y-0.5">{groupedNav.management.map(item => <li key={item.href}><NavItem item={item} /></li>)}</ul>
                </div>
              )}
              {groupedNav.analytics && groupedNav.analytics.length > 0 && (
                <div>
                  <SectionTitle title="Analytics" />
                  <ul className="space-y-0.5">{groupedNav.analytics.map(item => <li key={item.href}><NavItem item={item} /></li>)}</ul>
                </div>
              )}
              {groupedNav.settings && groupedNav.settings.length > 0 && (
                <div>
                  <SectionTitle title="Settings" />
                  <ul className="space-y-0.5">{groupedNav.settings.map(item => <li key={item.href}><NavItem item={item} /></li>)}</ul>
                </div>
              )}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-neutral-100">
          {!isCollapsed && (
            <div className="mb-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-neutral-400 truncate capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-500 hover:text-danger-600 hover:bg-danger-50 transition-all text-xs font-medium ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
          >
            <Icons.LogOut size={15} className="flex-shrink-0" />
            <span className={isCollapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
