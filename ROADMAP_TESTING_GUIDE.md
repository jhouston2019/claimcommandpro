# Roadmap Steps - Testing Guide

## Quick Test Steps

### Test 1: Basic Navigation
1. Open `claim-command-center.html` in a browser
2. Click on roadmap tile **"02 - Review Your Policy"**
3. **Expected:** Page scrolls to Step 2, card expands, tile highlights with teal border
4. Click on roadmap tile **"08 - Review Estimate"**
5. **Expected:** Page scrolls to Step 8, previous card collapses, new card expands

### Test 2: Sidebar Navigation
1. In the left sidebar, click **"Step 05 - Get Contractor Estimates"**
2. **Expected:** Both the sidebar item AND roadmap tile highlight
3. Card expands and scrolls into view

### Test 3: Step Completion
1. Navigate to Step 1
2. Click the **"Mark Complete"** button at the bottom of the step card
3. **Expected:**
   - Step 1 roadmap tile turns green with reduced opacity
   - Step 2 automatically becomes active (teal border on roadmap)
   - Step 2 card expands
   - Journal entry added

### Test 4: Phase Navigation
1. Click on a phase group in the sidebar (e.g., "Document Your Damage")
2. Phase expands showing steps 4-7
3. Click **"Step 06 - Prepare for Adjuster"**
4. **Expected:** Roadmap tile 06 highlights, card expands

### Test 5: Cross-Navigation Sync
1. Click roadmap tile **"10 - Coverage Gaps"**
2. **Expected:** Sidebar step 10 also highlights
3. Click sidebar step **"14 - Negotiate Settlement"**
4. **Expected:** Roadmap tile 14 also highlights

## Visual Indicators to Verify

### Active Step (Current)
- **Roadmap tile:** Teal border with glow effect
- **Step card:** Teal border, expanded, visible
- **Sidebar item:** Highlighted/active state

### Completed Step
- **Roadmap tile:** Green background, green border, opacity 0.7
- **Step card:** Collapsed, opacity 0.7, green checkmark
- **Sidebar item:** "Done" state

### Pending Step
- **Roadmap tile:** Default gray background, no border
- **Step card:** Collapsed
- **Sidebar item:** Default state

## Browser Console Tests

Open browser console and run:

```javascript
// Test navigation to step 5
goToStep(5);

// Test completing step 1
completeStep(1);

// Check current step
console.log(currentStep);

// Check completed steps
console.log(completedSteps);
```

## Expected Behavior Summary

| Action | Roadmap Tile | Step Card | Sidebar Item |
|--------|-------------|-----------|--------------|
| Click roadmap tile | Highlights (teal) | Expands | Highlights |
| Click sidebar item | Highlights (teal) | Expands | Highlights |
| Complete step | Turns green | Collapses + checkmark | Marks done |
| Navigate away | Unhighlights | Collapses | Unhighlights |

## Common Issues to Check

### ❌ Clicking roadmap tile does nothing
- **Fixed:** Added `onclick` handlers to all 18 tiles

### ❌ Multiple steps appear active
- **Fixed:** `goToStep()` now removes all active states first

### ❌ Completed steps don't show on roadmap
- **Fixed:** `completeStep()` now updates roadmap tiles

### ❌ Sidebar and roadmap out of sync
- **Fixed:** Both update together in `goToStep()`

## Performance Notes

- Smooth scrolling uses `scrollIntoView({ behavior: 'smooth' })`
- CSS transitions are 0.2s for responsive feel
- No page reload required - all JavaScript-based

## Accessibility

- All roadmap tiles have `cursor: pointer` on hover
- Keyboard navigation: Tab through tiles, Enter to activate
- Screen readers: Step numbers and titles are readable

## Mobile Responsiveness

- Roadmap tiles scroll horizontally on mobile
- Touch events work same as click events
- Active states visible on all screen sizes

---

**All tests should pass.** If any issues occur, check browser console for errors.
