// Application constants

export const APP_NAME = 'LoanOps';
export const APP_VERSION = '1.0.0';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Date formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// Status options
export const CUSTOMER_STATUS = {
  ACTIVE: 'active',
  RISK: 'risk',
  DEFAULT: 'default',
} as const;

export const LOAN_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  DEFAULTED: 'defaulted',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  UPI: 'upi',
  BANK: 'bank',
} as const;

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  AGENT: 'agent',
  VIEWER: 'viewer',
} as const;

// Validation rules
export const VALIDATION = {
  MIN_LOAN_AMOUNT: 1000,
  MAX_LOAN_AMOUNT: 10000000,
  MIN_INTEREST_RATE: 0.1,
  MAX_INTEREST_RATE: 50,
  MIN_TENURE: 1,
  MAX_TENURE: 120,
  PHONE_LENGTH: 10,
};

// Default values
export const DEFAULTS = {
  INTEREST_RATE: 2.0,
  TENURE: 10,
  GRACE_PERIOD: 3,
  LATE_FEE: 100,
  DEFAULT_THRESHOLD: 30,
};

// API endpoints
export const API_ENDPOINTS = {
  CUSTOMERS: '/api/customers',
  LOANS: '/api/loans',
  COLLECTIONS: '/api/collections',
  BRANDING: '/api/branding',
  REPORTS: '/api/reports',
  ALERTS: '/api/alerts',
};

// Map configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [80.27, 13.07] as [number, number], // Chennai
  DEFAULT_ZOOM: 11,
  MARKER_COLORS: {
    active: '#10b981',
    risk: '#f59e0b',
    default: '#ef4444',
  },
};

// Chart colors
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
};

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Alert priorities
export const ALERT_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
} as const;

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic',
    maxUsers: 5,
    features: ['customers', 'loans', 'collections'],
    price: 999,
  },
  PRO: {
    name: 'Pro',
    maxUsers: 50,
    features: ['all'],
    price: 4999,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxUsers: -1, // unlimited
    features: ['all', 'custom'],
    price: 'custom',
  },
};

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_AMOUNT: 'Please enter a valid amount',
  INVALID_DATE: 'Please enter a valid date',
  NETWORK_ERROR: 'Network error. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Server error. Please try again later.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  SAVED: 'Saved successfully',
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Regex patterns
export const REGEX_PATTERNS = {
  PHONE: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^[0-9]+$/,
};
