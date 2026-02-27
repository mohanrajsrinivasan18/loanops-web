# Web Admin Login Credentials

## Admin/Owner Login
- **Email**: `admin@loanops.com`
- **Password**: `admin123`
- **Role**: Admin
- **Access**: Full system access
- **Redirects to**: `/dashboard`

## Super Admin Login
- **Email**: `superadmin@loan.com`
- **Password**: `super123`
- **Role**: Super Admin
- **Access**: All tenants, pricing dashboard
- **Redirects to**: `/saas` (Super Admin Dashboard)

## Agent Login

### Agent 1 - Rajesh Kumar
- **Email**: `rajesh.agent@loan.com`
- **Password**: `3210`
- **Phone**: `9876500001`
- **Area**: T Nagar & Adyar
- **Status**: Active
- **Redirects to**: `/dashboard`

### Agent 2 - Priya Sharma
- **Email**: `priya.agent@loan.com`
- **Password**: `3210`
- **Phone**: `9876500002`
- **Area**: Velachery & Anna Nagar
- **Status**: Active

### Agent 3 - Vijay Anand
- **Email**: `vijay.agent@loan.com`
- **Password**: `3210`
- **Phone**: `9876500003`
- **Area**: Mylapore & Triplicane
- **Status**: Inactive

## Customer Login
- **Email**: `customer@loan.com`
- **Password**: `customer123`
- **Role**: Customer
- **Redirects to**: `/customers`

## Quick Login Buttons

The login page has 4 quick login buttons for demo purposes:

1. **Super Admin** (Red) - Access to all tenants and pricing dashboard
2. **Admin** (Blue) - Full system access for a single tenant
3. **Agent** (Green) - Agent dashboard with assigned customers
4. **Customer** (Purple) - Customer portal

## How to Login

### Manual Login:
1. Go to `http://localhost:3000/login`
2. Enter email and password
3. Click "Sign in to Dashboard"

### Quick Login (Demo):
1. Go to `http://localhost:3000/login`
2. Click one of the colored quick login buttons
3. Automatically logs in with preset credentials

## API Endpoints

### Login API
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@loanops.com",
  "password": "admin123"
}
```

### Response
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "admin@loanops.com",
    "name": "Admin User",
    "role": "admin",
    "tenantId": "tenant-id"
  }
}
```

## Testing Credentials

### Test Super Admin Dashboard:
```
Email: superadmin@loan.com
Password: super123
→ Should redirect to /saas
→ Should see all tenant statistics
```

### Test Admin Dashboard:
```
Email: admin@loanops.com
Password: admin123
→ Should redirect to /dashboard
→ Should see single tenant data
```

### Test Agent Dashboard:
```
Email: rajesh.agent@loan.com
Password: 3210
→ Should redirect to /dashboard
→ Should see only assigned customers
```

## Differences from Mobile App

| Feature | Mobile App | Web Admin |
|---------|-----------|-----------|
| Admin Email | `admin@loanops.com` | `admin@loanops.com` ✅ |
| Admin Password | `admin123` | `admin123` ✅ |
| Agent Email | `rajesh.agent@loan.com` | `rajesh.agent@loan.com` ✅ |
| Agent Password | `3210` | `3210` ✅ |
| Super Admin | N/A | `superadmin@loan.com` |
| Quick Login | Yes (4 buttons) | Yes (4 buttons) ✅ |

## Notes

- All credentials are synchronized with the mobile app
- Super admin is web-only for managing multiple tenants
- Agent credentials use the same email/password as mobile
- Quick login buttons are for demo/testing purposes only
- In production, remove quick login buttons and use proper authentication

## Security Recommendations

For production deployment:
1. Change all default passwords
2. Remove quick login buttons
3. Implement 2FA for admin accounts
4. Use strong password policies
5. Add rate limiting on login attempts
6. Implement session timeout
7. Add audit logging for all logins
