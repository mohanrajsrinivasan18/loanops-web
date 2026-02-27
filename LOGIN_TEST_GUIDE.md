# Login Test Guide

## How the Quick Login Works

The quick login buttons work exactly like the mobile app:

1. **Click a quick login button** (Super Admin, Admin, Agent, or Customer)
2. **Email and password fields auto-populate** with the credentials
3. **Review the credentials** (you can see them in the input fields)
4. **Click "Sign in to Dashboard"** button to actually log in

## Testing Steps

### Test 1: Super Admin Quick Login
1. Go to `http://localhost:3000/login`
2. Click the **"Super Admin"** button (red/danger colored)
3. ✅ Email field should show: `superadmin@loan.com`
4. ✅ Password field should show: `super123` (hidden by default)
5. Click **"Sign in to Dashboard"** button
6. ✅ Should redirect to `/saas` (Super Admin Dashboard)

### Test 2: Admin Quick Login
1. Go to `http://localhost:3000/login`
2. Click the **"Admin"** button (blue/primary colored)
3. ✅ Email field should show: `admin@loanops.com`
4. ✅ Password field should show: `admin123`
5. Click **"Sign in to Dashboard"** button
6. ✅ Should redirect to `/dashboard`

### Test 3: Agent Quick Login
1. Go to `http://localhost:3000/login`
2. Click the **"Agent (Rajesh)"** button (green/success colored)
3. ✅ Email field should show: `rajesh.agent@loan.com`
4. ✅ Password field should show: `3210`
5. Click **"Sign in to Dashboard"** button
6. ✅ Should redirect to `/dashboard`

### Test 4: Customer Quick Login
1. Go to `http://localhost:3000/login`
2. Click the **"Customer"** button (purple/secondary colored)
3. ✅ Email field should show: `customer@loan.com`
4. ✅ Password field should show: `customer123`
5. Click **"Sign in to Dashboard"** button
6. ✅ Should redirect to `/customers`

## Visual Verification

### Button Display
Each button should show:
- **Top line**: Role name (bold)
- **Bottom line**: Email address (smaller, lighter)

Example:
```
┌─────────────────────┐
│   Super Admin       │  ← Bold
│ superadmin@loan.com │  ← Small, light
└─────────────────────┘
```

### Button Colors
- **Super Admin**: Red/Danger gradient
- **Admin**: Blue/Primary gradient
- **Agent (Rajesh)**: Green/Success gradient
- **Customer**: Purple/Secondary gradient

## Troubleshooting

### Issue: Fields don't populate
**Solution**: Check browser console for errors. The `quickLogin` function should be called.

### Issue: Auto-submits instead of populating
**Solution**: Verify the `quickLogin` function only sets state:
```typescript
const quickLogin = (role) => {
  const creds = credentials[role];
  setEmail(creds.email);
  setPassword(creds.password);
  setError('');
  // Should NOT call login() here
};
```

### Issue: Wrong credentials
**Solution**: Verify credentials match:
- Super Admin: `superadmin@loan.com` / `super123`
- Admin: `admin@loanops.com` / `admin123`
- Agent: `rajesh.agent@loan.com` / `3210`
- Customer: `customer@loan.com` / `customer123`

### Issue: Wrong redirect after login
**Solution**: Check the `handleSubmit` function redirects:
- `super_admin` → `/saas`
- `customer` → `/customers`
- Others → `/dashboard`

## Expected Behavior

✅ **Correct**: Click button → Fields populate → User reviews → User clicks "Sign in" → Login happens

❌ **Incorrect**: Click button → Immediately logs in (no chance to review)

## Comparison with Mobile App

| Feature | Mobile App | Web Admin | Status |
|---------|-----------|-----------|--------|
| Quick login buttons | ✅ 4 buttons | ✅ 4 buttons | ✅ Match |
| Auto-populate fields | ✅ Yes | ✅ Yes | ✅ Match |
| Auto-submit | ❌ No | ❌ No | ✅ Match |
| Show credentials | ✅ Yes | ✅ Yes | ✅ Match |
| Admin email | `admin@loanops.com` | `admin@loanops.com` | ✅ Match |
| Agent email | `rajesh.agent@loan.com` | `rajesh.agent@loan.com` | ✅ Match |
| Agent password | `3210` | `3210` | ✅ Match |

## Success Criteria

All tests pass when:
1. ✅ Clicking button populates fields (doesn't auto-submit)
2. ✅ Credentials are visible in input fields
3. ✅ User can modify credentials before submitting
4. ✅ Clicking "Sign in to Dashboard" performs login
5. ✅ Redirects to correct page based on role
6. ✅ Button labels show role name and email
7. ✅ Credentials match mobile app exactly

## Current Status

✅ **WORKING CORRECTLY**

The web admin login now works exactly like the mobile app:
- Quick login buttons populate fields
- User can review credentials
- User must click "Sign in" to actually log in
- All credentials match mobile app
