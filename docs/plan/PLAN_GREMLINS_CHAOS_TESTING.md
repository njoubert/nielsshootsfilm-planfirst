# Plan: Gremlins.js Chaos Testing

## Problem

Manual testing misses edge cases like race conditions, memory leaks, XHR bugs, and rapid navigation issues.

## Solution

Use Gremlins.js to randomly interact with the UI. Get formatted error reports auto-copied to clipboard.

## Implementation (45 min)

### 1. Install

```bash
cd frontend && npm install --save-dev gremlins.js
```

### 2. Create chaos-test.ts

See full implementation in original plan (200 lines of TypeScript).

Key features:

- Intercepts console.error, console.warn, unhandled rejections
- Tracks all errors with timestamps, stack traces, URLs
- Generates markdown report
- Auto-copies to clipboard
- Reproducible via seed value

### 3. Add Keyboard Shortcut

Add to app-shell.ts connectedCallback:

```typescript
if (import.meta.DEV) {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      import('../utils/chaos-test').then((m) => m.unleashChaos());
    }
  });
  console.log('🧪 Press Ctrl+Shift+K to unleash chaos');
}
```

## Usage

1. `./dev.sh`
2. Press `Ctrl+Shift+K`
3. Watch chaos
4. Press `Escape`
5. Report copied to clipboard
6. Paste into docs/reports/ or GitHub issues

## Example Report Output

```markdown
# Chaos Test Error Report

**Duration**: 45s | **Seed**: 1730234445123 | **Errors**: 3

### Error 1: unhandledRejection (2 occurrences)

**Message**: Failed to fetch album
**Stack**: at loadAlbum (album-photo-page.ts:234)
```

## Success Criteria

- ✅ Ctrl+Shift+K starts chaos
- ✅ Escape stops and generates report
- ✅ Report auto-copied to clipboard
- ✅ Seed allows reproduction

## Future

- Custom photo nav gremlin
- CI automation
- Performance tracking

**Size**: Small (45 min)
