# Plan: Add Sentry Error Monitoring

## Problem Statement

The app is experiencing crashes when zooming on mobile devices, but we cannot easily debug these issues without access to the user's device. We need real-time error tracking and performance monitoring to understand what's happening in production.

## Goals

1. Capture JavaScript errors and crashes in production
2. Get stack traces and context when errors occur
3. Monitor performance issues (slow page loads, memory leaks)
4. Track user sessions to reproduce issues
5. Get mobile device telemetry (OS, browser, viewport size)

## Solution: Sentry Error Monitoring

Sentry provides:

- **Error tracking**: Captures unhandled exceptions and console errors
- **Performance monitoring**: Tracks page load times and slow operations
- **Session replay**: Records user interactions leading to errors
- **Source maps**: Shows original TypeScript code in stack traces
- **Mobile context**: Browser, OS, device type, viewport size
- **Breadcrumbs**: Logs of user actions before crash

## Implementation Plan

### Phase 1: Setup (30 minutes)

1. **Create Sentry account** (if not exists)

   - Sign up at <https://sentry.io>
   - Create new project for "nielsshootsfilm"
   - Get DSN (Data Source Name) key

2. **Install Sentry SDK**

   ```bash
   cd frontend
   npm install @sentry/browser
   ```

3. **Store DSN securely**
   - Add to `.env` file: `VITE_SENTRY_DSN=your-dsn-here`
   - Add to `.env.example` with placeholder
   - Update `.gitignore` to ensure `.env` is ignored

### Phase 2: Integration (1 hour)

1. **Create Sentry initialization module**

   Create `frontend/src/utils/sentry.ts`:

   ```typescript
   import * as Sentry from '@sentry/browser';

   export function initSentry() {
     // Only initialize if DSN is provided
     const dsn = import.meta.env.VITE_SENTRY_DSN;
     if (!dsn) {
       console.warn('Sentry DSN not configured - error tracking disabled');
       return;
     }

     Sentry.init({
       dsn,
       environment: import.meta.env.MODE, // 'development' or 'production'

       // Performance Monitoring
       tracesSampleRate: 1.0, // 100% of transactions (adjust for production)

       // Session Replay (captures user interactions)
       replaysSessionSampleRate: 0.1, // 10% of sessions
       replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

       // Integrations
       integrations: [
         new Sentry.BrowserTracing({
           // Track page loads and navigation
           tracePropagationTargets: ['localhost', /^https:\/\/nielsshootsfilm\.com/],
         }),
         new Sentry.Replay({
           // Mask sensitive data
           maskAllText: false,
           blockAllMedia: false,
         }),
       ],

       // Custom error filtering
       beforeSend(event, hint) {
         // Don't send errors in development
         if (import.meta.env.DEV) {
           console.log('Sentry event (dev mode):', event);
           return null;
         }
         return event;
       },
     });
   }

   // Helper to capture custom errors
   export function captureError(error: Error, context?: Record<string, any>) {
     Sentry.captureException(error, {
       extra: context,
     });
   }

   // Helper to add breadcrumbs (user actions)
   export function addBreadcrumb(message: string, data?: Record<string, any>) {
     Sentry.addBreadcrumb({
       message,
       level: 'info',
       data,
     });
   }
   ```

2. **Initialize in app entry point**

   Modify `frontend/src/main.ts`:

   ```typescript
   import './styles/global.css';
   import './components/app-shell';
   import { initSentry } from './utils/sentry';

   // Initialize Sentry first to catch early errors
   initSentry();

   // Rest of app initialization...
   ```

3. **Add error boundaries to critical components**

   Update lifecycle methods to report errors:

   ```typescript
   // In app-shell.ts and major pages
   private async initialize() {
     try {
       // ... existing code ...
     } catch (error) {
       console.error('Failed to initialize:', error);
       captureError(error as Error, { component: 'app-shell' });
     }
   }
   ```

### Phase 3: Source Maps (30 minutes)

To see original TypeScript code in Sentry stack traces:

1. **Update vite.config.ts**

   ```typescript
   export default defineConfig({
     build: {
       sourcemap: true, // Enable source maps for production
     },
   });
   ```

2. **Upload source maps to Sentry** (optional but recommended)

   Install Sentry CLI:

   ```bash
   npm install --save-dev @sentry/vite-plugin
   ```

   Update `vite.config.ts`:

   ```typescript
   import { sentryVitePlugin } from '@sentry/vite-plugin';

   export default defineConfig({
     plugins: [
       sentryVitePlugin({
         org: 'your-org',
         project: 'nielsshootsfilm',
         authToken: process.env.SENTRY_AUTH_TOKEN,
       }),
     ],
   });
   ```

### Phase 4: Enhanced Tracking (1 hour)

Add custom instrumentation for the zoom crash issue:

1. **Track viewport changes**

   ```typescript
   // In app-shell or main.ts
   let resizeTimeout: number;
   window.addEventListener('resize', () => {
     clearTimeout(resizeTimeout);
     resizeTimeout = window.setTimeout(() => {
       addBreadcrumb('Viewport resized', {
         width: window.innerWidth,
         height: window.innerHeight,
         devicePixelRatio: window.devicePixelRatio,
       });
     }, 100);
   });
   ```

2. **Track navigation events**

   ```typescript
   // In router.ts or navigation.ts
   export function navigateTo(url: string) {
     addBreadcrumb('Navigation', { url });
     // ... existing navigation code ...
   }
   ```

3. **Track data loading**

   ```typescript
   // In api.ts
   export async function fetchSiteConfig(): Promise<SiteConfig> {
     addBreadcrumb('Fetching site config');
     try {
       const response = await fetch('/data/site_config.json');
       if (!response.ok) {
         throw new Error(`Failed to fetch: ${response.statusText}`);
       }
       return response.json();
     } catch (error) {
       captureError(error as Error, { api: 'fetchSiteConfig' });
       throw error;
     }
   }
   ```

### Phase 5: Testing (30 minutes)

1. **Test in development**

   - Trigger an error intentionally
   - Check console for Sentry logs (won't send in dev mode)
   - Verify breadcrumbs are being collected

2. **Test in production**

   - Build and deploy
   - Open site and trigger an error
   - Check Sentry dashboard for the error

3. **Test on mobile**
   - Open site on phone
   - Try zooming to trigger crash
   - Check Sentry for mobile-specific context

## Configuration

### Environment Variables

```bash
# .env (not committed)
VITE_SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx

# For source map uploads (CI/CD only)
SENTRY_AUTH_TOKEN=your-auth-token
```

### Sentry Dashboard Settings

1. **Alerts**: Set up email/Slack alerts for new errors
2. **Performance thresholds**: Alert on slow page loads (>3s)
3. **Error grouping**: Configure how similar errors are grouped
4. **Data scrubbing**: Ensure no sensitive data is sent

## Estimated Effort

- **Small**: ~3 hours total
- **Dependencies**: Sentry account, DSN key
- **Risk**: Low - can be disabled by removing DSN from env

## Benefits

1. **Immediate crash visibility**: See errors as they happen
2. **Mobile debugging**: Get full context from mobile devices
3. **Performance insights**: Identify slow pages and operations
4. **User impact**: See how many users are affected
5. **Fix verification**: Confirm fixes work in production

## Rollout Strategy

1. **Week 1**: Deploy to production with monitoring only
2. **Week 2**: Add custom breadcrumbs for zoom/viewport changes
3. **Week 3**: Enable session replay for error sessions
4. **Ongoing**: Review Sentry weekly, fix top errors

## Alternatives Considered

1. **LogRocket**: More expensive, includes video replay
2. **Custom logging**: Roll our own - too much work
3. **Browser DevTools**: Can't access user's mobile devices
4. **Google Analytics**: Not designed for error tracking

**Recommendation**: Use Sentry - it's the industry standard and has a generous free tier (5k errors/month).

## Next Steps

1. Create Sentry account and get DSN
2. Install `@sentry/browser` package
3. Create `sentry.ts` utility module
4. Initialize in `main.ts`
5. Deploy and monitor for crashes

## Success Metrics

- Zero untracked errors in production
- <5 minute time-to-notification for crashes
- Full stack traces with source maps
- Mobile device context for all errors
- Ability to reproduce crashes from breadcrumbs
