# Touch Gesture Handling - Research & Plan

**Date**: 2025-10-29
**Status**: Research
**Size**: Small-Medium
**Priority**: Enhancement (current implementation works, but maintenance burden)

## Current State

We have ~200 lines of custom touch handling code in `album-photo-page.ts` that implements:

- Pinch-to-zoom (2-finger)
- Swipe navigation (1-finger horizontal)
- Double-tap to reset zoom
- Pan while zoomed
- Velocity-based swipe detection

**Problems with current approach:**

- High maintenance burden (edge cases, browser differences)
- Not battle-tested across all devices
- Missing accessibility features
- Reinventing the wheel
- Hard to extend with new gestures

## Research Findings

### Option 1: Native Pointer Events API (Modern Standard)

**What it is**: Modern W3C standard that unifies mouse, touch, and pen input.

**Pros:**

- Native browser support (no dependencies)
- Better performance than touch events
- Handles pointer capture automatically
- Works across all input types (touch, mouse, pen)
- Built-in velocity tracking via `movementX/Y`
- Supported by all modern browsers (IE11+)

**Cons:**

- Still requires custom gesture recognition logic
- More low-level than touch events
- Need to handle gesture state ourselves

**Effort**: Medium (rewrite existing code)

**Example:**

```typescript
element.addEventListener('pointerdown', (e) => {
  element.setPointerCapture(e.pointerId);
});
element.addEventListener('pointermove', (e) => {
  // Handle movement
});
```

### Option 2: Hammer.js (Industry Standard)

**What it is**: Popular gesture library (24k+ GitHub stars), battle-tested since 2014.

**Pros:**

- Recognizes common gestures out-of-box (pinch, swipe, pan, tap, doubletap)
- Very well tested across devices
- Simple declarative API
- Touch, mouse, and pointer event support
- Velocity and direction detection built-in
- Can customize gesture recognition thresholds

**Cons:**

- 7.3KB minified+gzipped (not huge but adds weight)
- Last major release 2019 (still maintained but slow updates)
- May be overkill for our simple needs
- Not specifically designed for web components

**Effort**: Small (drop-in replacement)

**Example:**

```typescript
import Hammer from 'hammerjs';

const hammer = new Hammer(element);
hammer.get('pinch').set({ enable: true });
hammer.on('pinch', (e) => {
  this.imageScale = e.scale;
});
hammer.on('swipeleft', () => this.handleNext());
hammer.on('swiperight', () => this.handlePrev());
```

### Option 3: ZingTouch (Lightweight Alternative)

**What it is**: Modern gesture library specifically designed for web (1.5k stars).

**Pros:**

- Only 5KB minified+gzipped (smaller than Hammer)
- Built for modern web standards
- Clean API for common gestures
- Active development (2023)
- Good documentation

**Cons:**

- Less battle-tested than Hammer
- Smaller community
- Fewer Stack Overflow answers

**Effort**: Small (similar to Hammer)

**Example:**

```typescript
import ZingTouch from 'zingtouch';

const region = new ZingTouch.Region(element);
region.bind(element, 'swipe', (e) => {
  if (e.detail.data[0].currentDirection > 90) {
    this.handlePrev();
  }
});
region.bind(element, 'distance', (e) => {
  this.imageScale = e.detail.distance / 100;
});
```

### Option 4: Use-Gesture (React Ecosystem)

**What it is**: Modern gesture library from react-spring team.

**Pros:**

- Very modern and actively maintained
- Excellent TypeScript support
- Sophisticated gesture recognition
- Used in production by many apps

**Cons:**

- Designed for React (not ideal for Lit)
- Would need adapter layer
- Larger bundle size

**Effort**: Medium-High (integration complexity)

**Not Recommended**: Framework mismatch

### Option 5: Pointer Events + Interaction Observer Pattern

**What it is**: Use native Pointer Events with a custom Interaction Observer pattern.

**Pros:**

- Zero dependencies
- Full control
- Optimal performance
- Can be made very Lit-friendly

**Cons:**

- Still need to write gesture recognition
- Medium effort to build correctly

**Effort**: Medium

### Option 6: Keep Current Touch Events (Status Quo)

**Pros:**

- Already works
- No migration needed
- Known behavior
- Zero bundle size increase

**Cons:**

- Maintenance burden
- Missing edge cases
- Not as sophisticated as libraries

**Effort**: Zero (but ongoing maintenance cost)

## Recommendation

**Go with Option 2: Hammer.js** for these reasons:

1. **Battle-tested**: Used in production by thousands of apps since 2014
2. **Small effort**: Drop-in replacement, ~50 lines of code vs our current 200
3. **Reasonable size**: 7.3KB is acceptable for the value it provides
4. **Reduces maintenance**: Let the library handle edge cases
5. **Better UX**: More sophisticated gesture recognition than our custom code
6. **Extensible**: Easy to add more gestures later (rotate, press-hold, etc.)

**Alternative recommendation**: If bundle size is critical, use **Option 3: ZingTouch** (5KB, still well-maintained).

**Long-term consideration**: Once we're on Hammer.js, we could consider migrating to Pointer Events API in the future if we want to reduce dependencies, but only after Hammer.js proves its value.

## Implementation Plan

### Phase 1: Proof of Concept (1 hour)

- [ ] Install Hammer.js: `npm install hammerjs @types/hammerjs`
- [ ] Create branch: `feature/hammer-gestures`
- [ ] Implement gestures in `album-photo-page.ts`
- [ ] Test on desktop browser with DevTools mobile emulation

### Phase 2: Testing (2 hours)

- [ ] Test on real iOS device (iPhone)
- [ ] Test on real Android device
- [ ] Test on tablet
- [ ] Verify all gesture combinations work:
  - Single-tap (no action)
  - Double-tap (reset zoom)
  - Swipe left/right (navigation)
  - Pinch zoom
  - Pan while zoomed
  - Keyboard shortcuts still work

### Phase 3: Refinement (1 hour)

- [ ] Adjust gesture thresholds if needed
- [ ] Add touch feedback (haptics on supported devices)
- [ ] Update tests if needed
- [ ] Document new approach

### Phase 4: Deployment

- [ ] Create PR
- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to production
- [ ] Monitor for issues

**Total Effort**: ~4 hours

## Code Comparison

### Current (Custom Touch Events)

```typescript
// ~200 lines of touch handling code
private handleTouchStart(e: TouchEvent) { /* 30 lines */ }
private handleTouchMove(e: TouchEvent) { /* 40 lines */ }
private handleTouchEnd(e: TouchEvent) { /* 50 lines */ }
private getTouchDistance(touches: TouchList) { /* ... */ }
private getTouchMidpoint(touches: TouchList) { /* ... */ }
// + state management for pinch, swipe, tap timing, etc.
```

### With Hammer.js

```typescript
import Hammer from 'hammerjs';

connectedCallback() {
  super.connectedCallback();
  this.setupGestures();
}

private setupGestures() {
  const container = this.shadowRoot!.querySelector('.photo-container')!;
  const hammer = new Hammer.Manager(container as HTMLElement);

  // Enable pinch gesture
  const pinch = new Hammer.Pinch();
  hammer.add(pinch);

  // Enable swipe gesture
  const swipe = new Hammer.Swipe({ direction: Hammer.DIRECTION_HORIZONTAL });
  hammer.add(swipe);

  // Enable tap gestures
  const doubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });
  hammer.add(doubleTap);

  // Pinch to zoom
  hammer.on('pinch', (e) => {
    this.imageScale = this.initialScale * e.scale;
    this.imageScale = Math.max(1, Math.min(4, this.imageScale));
  });

  hammer.on('pinchstart', (e) => {
    this.initialScale = this.imageScale;
  });

  // Swipe navigation
  hammer.on('swipeleft', () => {
    if (this.imageScale === 1) this.handlePrev();
  });

  hammer.on('swiperight', () => {
    if (this.imageScale === 1) this.handleNext();
  });

  // Double-tap to reset zoom
  hammer.on('doubletap', () => {
    this.resetZoom();
  });

  this.hammer = hammer;
}

disconnectedCallback() {
  super.disconnectedCallback();
  this.hammer?.destroy();
}
```

**Reduction**: ~200 lines → ~50 lines (75% reduction)

## Risks

1. **Bundle Size**: +7.3KB (acceptable, but worth noting)
2. **Breaking Changes**: Gesture feel might be different (need thorough testing)
3. **Dependency Risk**: Hammer.js development is slow (mitigated by maturity)
4. **Learning Curve**: Team needs to learn Hammer.js API (very small, well-documented)

## Dependencies

- None (this is a standalone enhancement)

## Success Metrics

- ✅ All existing gestures work identically
- ✅ No regressions in desktop experience
- ✅ Reduced code complexity (fewer bugs)
- ✅ Easier to add new gestures in future
- ✅ Better gesture recognition on edge cases

## Decision Needed

1. **Approve Option 2 (Hammer.js)** - Recommended
2. **Approve Option 3 (ZingTouch)** - If bundle size is critical
3. **Defer** - Keep current implementation, revisit later
4. **Reject** - Stay with custom implementation

## References

- Hammer.js: <https://hammerjs.github.io/>
- ZingTouch: <https://github.com/zingchart/zingtouch>
- Pointer Events API: <https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events>
- W3C Touch Events: <https://www.w3.org/TR/touch-events/>
