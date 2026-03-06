export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: string[];
}

export const navigationItems: NavItem[] = [
  // Dashboard - All roles
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['admin', 'agent', 'solo_owner'] },
  
  // Super Admin Dashboard
  { label: 'Platform Overview', href: '/super-admin', icon: 'LayoutDashboard', roles: ['super_admin'] },

  // Super Admin - Platform Management (Core Features)
  { label: 'Tenants', href: '/super-admin/tenants', icon: 'Building2', roles: ['super_admin'] },
  { label: 'Plans & Pricing', href: '/super-admin/plans', icon: 'CreditCard', roles: ['super_admin'] },
  { label: 'Billing & Revenue', href: '/super-admin/billing', icon: 'DollarSign', roles: ['super_admin'] },
  { label: 'Feature Flags', href: '/super-admin/features', icon: 'Sliders', roles: ['super_admin'] },
  { label: 'Analytics', href: '/super-admin/analytics', icon: 'BarChart3', roles: ['super_admin'] },

  // Core Modules - Admin and Solo Owner ONLY (NOT super_admin)
  { label: 'Customers', href: '/customers', icon: 'Users', roles: ['admin', 'solo_owner'] },
  { label: 'Loans', href: '/loans', icon: 'DollarSign', roles: ['admin', 'solo_owner'] },
  { label: 'Chit Funds', href: '/chits', icon: 'Users2', roles: ['admin', 'solo_owner'] },
  { label: 'Lines', href: '/lines', icon: 'GitBranch', roles: ['admin', 'solo_owner'] },

  // Team Management - Admin only
  { label: 'Agents', href: '/agents', icon: 'UserCheck', roles: ['admin'] },

  // Analysis - Admin and Solo Owner
  { label: 'Risk', href: '/risk', icon: 'AlertTriangle', roles: ['admin', 'solo_owner'] },
  { label: 'Reports', href: '/reports', icon: 'FileText', roles: ['admin', 'solo_owner'] },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3', roles: ['admin', 'solo_owner'] },
  { label: 'Map Analytics', href: '/map-analytics', icon: 'MapPin', roles: ['admin', 'solo_owner'] },

  // Configuration
  { label: 'Settings', href: '/settings', icon: 'Sliders', roles: ['admin', 'solo_owner'] },
  { label: 'Advanced Config', href: '/config', icon: 'Settings', roles: ['admin', 'solo_owner'] },

  // Agent Specific
  { label: 'My Collections', href: '/my-collections', icon: 'CheckSquare', roles: ['agent'] },
  { label: 'Alerts', href: '/alerts', icon: 'Bell', roles: ['agent'] },
  { label: 'Field Map', href: '/map', icon: 'Map', roles: ['agent'] },

  // Customer Specific
  { label: 'My Loans', href: '/my-loans', icon: 'DollarSign', roles: ['customer'] },
];

export function getNavigationForRole(role: string): NavItem[] {
  // Normalize roles
  const normalizedRole = role.toLowerCase();
  return navigationItems.filter(item => item.roles.includes(normalizedRole));
}
