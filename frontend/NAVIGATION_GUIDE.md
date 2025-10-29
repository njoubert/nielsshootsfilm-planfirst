# Navigation Library Guide

Centralized, type-safe navigation for client-side routing.

## Quick Reference

```typescript
// ✅ Programmatic navigation
import { navigateTo, routes } from '../utils/navigation';
navigateTo(routes.album('my-album'));
navigateTo(routes.admin.editAlbum(albumId));

// ✅ Anchor tags in templates
import { handleNavClick, routes } from '../utils/navigation';
html`<a href=${routes.albums()} @click=${handleNavClick}>Albums</a>`;

// ✅ Semantic helpers
import { navigateToAlbum, navigateToPhoto } from '../utils/navigation';
navigateToAlbum(album.slug);
navigateToPhoto(albumSlug, photoId);

// ✅ Custom event handlers
import { handleAlbumClickEvent, createPhotoClickHandler } from '../utils/navigation';
html`<album-card @album-click=${handleAlbumClickEvent}></album-card>`;
```

## Available Routes

```typescript
routes.home(); // '/'
routes.albums(); // '/albums'
routes.album(slug); // '/albums/:slug'
routes.photo(slug, photoId); // '/albums/:slug/photo/:photoId'

routes.admin.login(); // '/admin/login'
routes.admin.dashboard(); // '/admin'
routes.admin.albums(); // '/admin/albums'
routes.admin.settings(); // '/admin/settings'
routes.admin.newAlbum(); // '/admin/albums/new'
routes.admin.editAlbum(id); // '/admin/albums/:id/edit'
```

## When to Use Each Pattern

### 1. Programmatic Navigation

**Use when**: Navigating after an action (save, submit, etc.)

```typescript
async handleSave() {
  await saveData();
  navigateTo(routes.admin.albums());
}
```

### 2. Anchor Tags

**Use when**: Links in templates (nav menus, buttons styled as links)

```typescript
html`<a href=${routes.album(slug)} @click=${handleNavClick}>View Album</a>`;
```

### 3. Semantic Helpers

**Use when**: Common patterns in domain logic

```typescript
navigateToPhoto(albumSlug, photoId); // Clearer than routes.photo()
```

### 4. Custom Event Handlers

**Use when**: Handling component events

```typescript
// For photo-grid component
private handlePhotoClick = createPhotoClickHandler(() => this.album?.slug);

// For album-card component (use directly, no factory needed)
html`<album-card @album-click=${handleAlbumClickEvent}></album-card>`;
```

## Key Rules

- ❌ **NEVER** use `window.location.href = ...` (causes full page reload)
- ❌ **NEVER** use string concatenation: `navigateTo('/albums/' + slug)`
- ✅ **ALWAYS** use `routes` object for type safety
- ✅ **ALWAYS** use `handleNavClick` on anchor tags

## Testing

```typescript
const pushStateSpy = vi.spyOn(window.history, 'pushState');
navigateTo(routes.album('test'));
expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/albums/test');
```

---

**Full API docs**: `frontend/src/utils/navigation.ts`
