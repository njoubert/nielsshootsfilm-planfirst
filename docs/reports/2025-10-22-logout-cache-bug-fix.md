# Logout Cache Bug Fix

**Date:** October 22, 2025
**Time:** Afternoon PST
**Author:** GitHub Copilot

## Problem Description

A critical bug was identified where logging out of the admin panel did not properly clear cached data in the frontend. The symptoms were:

1. After logging out, the admin UI would still display previously loaded data (albums, settings, etc.)
2. The backend correctly rejected API requests (HTTP-only cookie was cleared)
3. The frontend continued to render stale data from component state
4. If a user navigated back using the browser's back button, they would briefly see cached admin data before being redirected to the login page

## Root Cause Analysis

The bug occurred because:

1. **Server-side logout was working correctly**: The backend properly cleared the session cookie when `/api/admin/logout` was called
2. **Client-side state was not cleared**: Each admin page component (AdminAlbumsPage, AdminDashboardPage, etc.) stored data in `@state()` properties using Lit's reactive state management
3. **No state clearing mechanism**: When `logout()` was called, it only hit the backend API and redirected to `/admin/login`, but did not clear any cached component state
4. **Component persistence**: LitElement components remain in memory with their state intact unless explicitly cleared

## Solution Implemented

### 1. Created Global Authentication State Manager (`auth-state.ts`)

A new utility module that provides:

- Event dispatching for login/logout events
- Subscription mechanism for components to listen to auth state changes
- Global coordination of authentication state across the application

```typescript
export const AUTH_LOGOUT_EVENT = 'auth:logout';
export const AUTH_LOGIN_EVENT = 'auth:login';

export function dispatchLogoutEvent(): void;
export function dispatchLoginEvent(): void;
export function onLogout(callback: () => void): () => void;
export function onLogin(callback: () => void): () => void;
```

### 2. Updated Admin API to Dispatch Events

Modified `admin-api.ts`:

- `login()` now dispatches `AUTH_LOGIN_EVENT` after successful authentication
- `logout()` now dispatches `AUTH_LOGOUT_EVENT` after clearing the session cookie

This ensures all components are notified when authentication state changes.

### 3. Added State Clearing to All Admin Pages

Updated the following components to listen for logout events and clear their cached state:

- `AdminAlbumsPage`
- `AdminDashboardPage`
- `AdminAlbumEditorPage`
- `AdminSettingsPage`

Each page now:

1. Subscribes to logout events in `connectedCallback()`
2. Implements a `clearState()` method that resets all `@state()` properties to their initial values
3. Unsubscribes in `disconnectedCallback()` to prevent memory leaks

Example pattern:

```typescript
private unsubscribeLogout?: () => void;

connectedCallback() {
  super.connectedCallback();
  this.unsubscribeLogout = onLogout(() => {
    this.clearState();
  });
}

disconnectedCallback() {
  super.disconnectedCallback();
  if (this.unsubscribeLogout) {
    this.unsubscribeLogout();
  }
}

private clearState() {
  this.albums = [];
  this.loading = false;
  this.error = '';
  // ... reset all state properties
}
```

### 4. Enhanced App Shell Logout Handling

Updated `app-shell.ts` to:

- Subscribe to logout events
- Force a full page redirect to `/admin/login` when logout occurs
- Clean up subscription on component disconnect

This ensures the entire application resets when the user logs out.

## Files Modified

1. **New file**: `frontend/src/utils/auth-state.ts` - Global auth state manager
2. `frontend/src/utils/admin-api.ts` - Added event dispatching to login/logout
3. `frontend/src/pages/admin-albums-page.ts` - Added logout handling and state clearing
4. `frontend/src/pages/admin-dashboard-page.ts` - Added logout handling and state clearing
5. `frontend/src/pages/admin-album-editor-page.ts` - Added logout handling and state clearing
6. `frontend/src/pages/admin-settings-page.ts` - Added logout handling and state clearing
7. `frontend/src/components/app-shell.ts` - Added logout event subscription

## Testing Instructions

To verify the fix works correctly:

1. **Login to admin panel**:

   - Navigate to `http://localhost:5173/admin/login`
   - Login with your credentials

2. **Load some data**:

   - View the albums page (`/admin/albums`)
   - View the dashboard (`/admin`)
   - View the settings page (`/admin/settings`)
   - Confirm data is displayed correctly

3. **Logout**:

   - Click the "Logout" button in the admin header
   - Verify you are redirected to `/admin/login`
   - Verify no admin data is visible

4. **Attempt to access admin pages**:

   - Try to navigate directly to `/admin/albums` (via URL)
   - Verify you are immediately redirected to `/admin/login`
   - Verify no cached data is displayed during the redirect

5. **Browser back button test**:

   - Login again
   - Navigate to an admin page with data
   - Logout
   - Use the browser back button
   - Verify you are redirected to login without showing stale data

6. **API protection verification**:
   - After logout, check the browser console Network tab
   - Attempt to manually call an admin API endpoint
   - Verify it returns 401 Unauthorized

## Technical Notes

### Event-Based Architecture

The solution uses a global event system (window events) rather than a centralized state store. This is lightweight and appropriate for the scale of this application. For larger applications, consider using a proper state management library like Redux or Zustand.

### Memory Management

All components properly clean up their event subscriptions in `disconnectedCallback()` to prevent memory leaks.

### Lit Reactive State

The `@state()` decorator in Lit automatically triggers re-renders when state changes. By resetting state properties to their initial values, we ensure the UI updates to show empty/loading states.

### Full Page Redirect

The app-shell performs a full page redirect (`window.location.href`) rather than router navigation. This ensures a complete reset of the application state, including any in-memory caches.

## Future Improvements

1. **Consider localStorage/sessionStorage clearing**: If the app uses any browser storage, ensure that's also cleared on logout
2. **Add automated tests**: Create E2E tests that verify logout behavior
3. **Visual feedback**: Consider adding a brief "Logging out..." message before redirect
4. **State management library**: For future scalability, consider adopting a proper state management solution

## Conclusion

The fix ensures that logging out properly clears all client-side cached data, providing a secure and clean logout experience. The implementation follows the principle of least surprise - after logout, no user data should be visible in the UI.
