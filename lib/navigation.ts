export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: string[];
}

export const navigationItems: NavItem[] = [
  // Dashboard - All roles
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['admin', 'agent', 'super_admin', 'solo_owner'] },

  // Super Admin - Full Platform Access
  { label: 'Platform Settings', href: '/system-config', icon: 'Settings', roles: ['super_admin'] },
  { label: 'Tenants', href: '/tenants', icon: 'Building2', roles: ['super_admin'] },
  { label: 'System Analytics', href: '/system-analytics', icon: 'BarChart3', roles: ['super_admin'] },
  { label: 'Billing & Plans', href: '/billing', icon: 'CreditCard', roles: ['super_admin'] },

  // Core Modules - Admin, Solo Owner, and Super Admin (for oversight)
  { label: 'Customers', href: '/customers', icon: 'Users', roles: ['admin', 'super_admin', 'solo_owner'] },
  { label: 'Loans', href: '/loans', icon: 'DollarSign', roles: ['admin', 'super_admin', 'solo_owner'] },
  { label: 'Lines', href: '/lines', icon: 'GitBranch', roles: ['admin', 'super_admin', 'solo_owner'] },

  // Team Management - Admin and Super Admin only
  { label: 'Agents', href: '/agents', icon: 'UserCheck', roles: ['admin', 'super_admin'] },

  // Analysis - Admin, Solo Owner, Super Admin
  { label: 'Risk', href: '/risk', icon: 'AlertTriangle', roles: ['admin', 'super_admin', 'solo_owner'] },
  { label: 'Reports', href: '/reports', icon: 'FileText', roles: ['admin', 'super_admin', 'solo_owner'] },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3', roles: ['admin', 'super_admin', 'solo_owner'] },
  { label: 'Map Analytics', href: '/map-analytics', icon: 'MapPin', roles: ['admin', 'super_admin', 'solo_owner'] },

  // Configuration
  { label: 'Settings', href: '/settings', icon: 'Sliders', roles: ['admin', 'super_admin', 'solo_owner'] },
  { label: 'Advanced Config', href: '/config', icon: 'Settings', roles: ['admin', 'super_admin', 'solo_owner'] },

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
