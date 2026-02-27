export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: string[];
}

export const navigationItems: NavItem[] = [
  // Dashboard - All roles
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', roles: ['admin', 'agent', 'super_admin'] },
  
  // Super Admin Only - SaaS Level Management
  { label: 'Tenants', href: '/tenants', icon: 'Building2', roles: ['super_admin'] },
  { label: 'System Config', href: '/system-config', icon: 'Settings', roles: ['super_admin'] },
  { label: 'Analytics', href: '/system-analytics', icon: 'BarChart3', roles: ['super_admin'] },
  { label: 'Billing', href: '/billing', icon: 'CreditCard', roles: ['super_admin'] },
  
  // Admin Only - Tenant Level Management
  { label: 'Customers', href: '/customers', icon: 'Users', roles: ['admin'] },
  { label: 'Agents', href: '/agents', icon: 'UserCheck', roles: ['admin'] },
  { label: 'Loans', href: '/loans', icon: 'DollarSign', roles: ['admin'] },
  { label: 'Lines', href: '/lines', icon: 'GitBranch', roles: ['admin'] },
  { label: 'Risk', href: '/risk', icon: 'AlertTriangle', roles: ['admin'] },
  { label: 'Reports', href: '/reports', icon: 'FileText', roles: ['admin'] },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3', roles: ['admin'] },
  { label: 'Map Analytics', href: '/map-analytics', icon: 'MapPin', roles: ['admin'] },
  { label: 'Settings', href: '/settings', icon: 'Sliders', roles: ['admin'] },
  { label: 'Config', href: '/config', icon: 'Settings', roles: ['admin'] },
  
  // Agent Only - Field Operations
  { label: 'My Collections', href: '/my-collections', icon: 'CheckSquare', roles: ['agent'] },
  { label: 'Customers', href: '/customers', icon: 'Users', roles: ['agent'] },
  { label: 'Loans', href: '/loans', icon: 'DollarSign', roles: ['agent'] },
  { label: 'Alerts', href: '/alerts', icon: 'Bell', roles: ['agent'] },
  { label: 'Map', href: '/map', icon: 'Map', roles: ['agent'] },
  
  // Customer Only - Self Service
  { label: 'My Loans', href: '/my-loans', icon: 'DollarSign', roles: ['customer'] },
  { label: 'Payments', href: '/payments', icon: 'CreditCard', roles: ['customer'] },
  { label: 'Documents', href: '/documents', icon: 'FileText', roles: ['customer'] },
];

export function getNavigationForRole(role: string): NavItem[] {
  return navigationItems.filter(item => item.roles.includes(role));
}
