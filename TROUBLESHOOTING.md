# Troubleshooting Guide

## Common Issues and Solutions

### Build Errors

#### "Cannot find module './682.js'" or similar webpack errors

**Cause**: Stale Next.js build cache

**Solution**:
```bash
# Clean all caches
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

# Reinstall and rebuild
npm install
npm run build
```

#### "Module not found" errors

**Cause**: Missing dependencies or incorrect imports

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

### Development Server Issues

#### Port 3000 already in use

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

#### Hot reload not working

**Solution**:
```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

---

### TypeScript Errors

#### "Cannot find module" for custom imports

**Solution**: Check `tsconfig.json` paths configuration
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### Type errors in components

**Solution**: Ensure all props are properly typed
```typescript
interface Props {
  title: string;
  count?: number;
}

export default function Component({ title, count = 0 }: Props) {
  // ...
}
```

---

### Runtime Errors

#### "Hydration failed" errors

**Cause**: Mismatch between server and client rendering

**Solution**:
- Ensure no browser-only code in server components
- Use `'use client'` directive for client components
- Check for dynamic content that differs between server/client

#### "Cannot read property of undefined"

**Cause**: Accessing data before it's loaded

**Solution**:
```typescript
// Add loading state
if (!data) return <Loading />;

// Or use optional chaining
const value = data?.property?.nested;
```

---

### API Issues

#### 404 errors on API routes

**Cause**: Incorrect API route path or method

**Solution**:
- Check route file location: `app/api/[route]/route.ts`
- Verify HTTP method (GET, POST, PUT, DELETE)
- Check URL in fetch call

#### CORS errors

**Cause**: Cross-origin requests blocked

**Solution**: Add CORS headers in `next.config.js`
```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
      ],
    },
  ];
}
```

---

### Database Issues (When Integrated)

#### Connection timeout

**Solution**:
- Check DATABASE_URL in `.env.local`
- Verify database is running
- Check network connectivity
- Increase connection timeout

#### Migration errors

**Solution**:
```bash
# Reset database (development only!)
npm run db:reset

# Run migrations
npm run db:migrate
```

---

### Performance Issues

#### Slow page loads

**Solutions**:
1. Check bundle size: `npm run build`
2. Optimize images: Use Next.js Image component
3. Add loading states
4. Implement code splitting
5. Use React.memo for expensive components

#### Memory leaks

**Solutions**:
1. Clean up useEffect hooks
```typescript
useEffect(() => {
  const timer = setTimeout(() => {}, 1000);
  return () => clearTimeout(timer); // Cleanup
}, []);
```

2. Unsubscribe from events
3. Cancel pending requests on unmount

---

### Map Issues

#### Map not displaying

**Causes & Solutions**:

1. **Missing Mapbox token**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
   ```

2. **Mapbox GL CSS not loaded**
   ```typescript
   // Add to component
   import 'mapbox-gl/dist/mapbox-gl.css';
   ```

3. **Invalid coordinates**
   - Check lat/lng values are valid numbers
   - Latitude: -90 to 90
   - Longitude: -180 to 180

---

### Authentication Issues (When Implemented)

#### Session not persisting

**Solution**:
- Check cookie settings
- Verify NEXTAUTH_SECRET is set
- Check session expiry time

#### Redirect loops

**Solution**:
- Check middleware configuration
- Verify protected route logic
- Ensure login page is not protected

---

### Deployment Issues

#### Build fails on Vercel/Netlify

**Solutions**:
1. Check Node.js version matches local
2. Verify all environment variables are set
3. Check build logs for specific errors
4. Ensure all dependencies are in `package.json`

#### Environment variables not working

**Solution**:
- Prefix with `NEXT_PUBLIC_` for client-side access
- Restart dev server after adding variables
- Check `.env.local` is not committed to git

---

### Data Issues

#### Mock data resets on refresh

**Cause**: In-memory storage (expected behavior)

**Solution**: Integrate a real database for persistence
- PostgreSQL
- MongoDB
- MySQL

#### Data not updating

**Solutions**:
1. Check API route is being called
2. Verify state update logic
3. Check for stale closures in useEffect
4. Use React DevTools to inspect state

---

### Styling Issues

#### Tailwind classes not working

**Solutions**:
1. Check `tailwind.config.js` content paths
2. Restart dev server
3. Clear browser cache
4. Verify class names are correct

#### Styles not applying

**Solutions**:
1. Check CSS import order
2. Verify component is using correct classes
3. Check for CSS specificity issues
4. Use browser DevTools to inspect styles

---

### Browser Compatibility

#### Features not working in Safari

**Solutions**:
- Check for unsupported JavaScript features
- Add polyfills if needed
- Test in multiple browsers
- Use feature detection

#### Mobile issues

**Solutions**:
- Test on real devices
- Check viewport meta tag
- Verify touch events
- Test different screen sizes

---

## Debug Mode

### Enable verbose logging

```bash
# Development
DEBUG=* npm run dev

# Build
NEXT_DEBUG=1 npm run build
```

### Check Next.js info

```bash
npx next info
```

### Analyze bundle

```bash
npm run build
# Check output for bundle sizes
```

---

## Getting Help

### Before asking for help:

1. ✅ Check this troubleshooting guide
2. ✅ Read error messages carefully
3. ✅ Check browser console
4. ✅ Check terminal output
5. ✅ Try clearing caches
6. ✅ Search existing issues

### When asking for help, include:

- Error message (full text)
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, browser)
- Relevant code snippets
- What you've already tried

---

## Useful Commands

```bash
# Clean everything
rm -rf .next node_modules package-lock.json
npm install

# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Check for security issues
npm audit

# Fix security issues
npm audit fix

# Check TypeScript
npx tsc --noEmit

# Format code
npx prettier --write .

# Lint code
npm run lint
```

---

## Emergency Recovery

If everything is broken:

```bash
# 1. Backup your code
git commit -am "Backup before reset"

# 2. Clean everything
rm -rf .next node_modules package-lock.json

# 3. Clear npm cache
npm cache clean --force

# 4. Reinstall
npm install

# 5. Rebuild
npm run build

# 6. Test
npm run dev
```

---

## Performance Monitoring

### Check bundle size
```bash
npm run build
# Look for large chunks in output
```

### Analyze what's in the bundle
```bash
npm install -D @next/bundle-analyzer
# Add to next.config.js
```

### Monitor in production
- Use Vercel Analytics
- Add Sentry for error tracking
- Use Lighthouse for performance audits

---

## Logs Location

- **Development**: Terminal output
- **Build**: `.next/` directory
- **Production**: Check hosting platform logs
  - Vercel: Dashboard → Logs
  - Custom server: PM2 logs or system logs

---

## Still Having Issues?

1. Check [Next.js Documentation](https://nextjs.org/docs)
2. Search [Next.js GitHub Issues](https://github.com/vercel/next.js/issues)
3. Ask on [Next.js Discord](https://nextjs.org/discord)
4. Review project documentation in this repo

---

**Last Updated**: January 2024  
**Maintained By**: Development Team
