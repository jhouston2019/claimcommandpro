# Roadmap Steps Architecture

## Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAIM COMMAND CENTER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         ROADMAP STRIP (Top Navigation Bar)                │  │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ... ┌────┐ ┌────┐ ┌────┐  │  │
│  │  │ 01 │ │ 02 │ │ 03 │ │ 04 │     │ 16 │ │ 17 │ │ 18 │  │  │
│  │  └────┘ └────┘ └────┘ └────┘     └────┘ └────┘ └────┘  │  │
│  │    ↓      ↓      ↓      ↓           ↓      ↓      ↓     │  │
│  │  onclick handlers call goToStep(num)                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                       │
│  ┌────────────────────────┼────────────────────────────────┐    │
│  │ SIDEBAR               │                    MAIN CONTENT │    │
│  │                       │                                  │    │
│  │ Phase Groups          │         ┌──────────────────┐    │    │
│  │  ├─ Step 01 ──────────┼────────→│   STEP CARD 1    │    │    │
│  │  ├─ Step 02           │         │   (expanded)     │    │    │
│  │  └─ Step 03           │         └──────────────────┘    │    │
│  │                       │                                  │    │
│  │  ├─ Step 04           │         ┌──────────────────┐    │    │
│  │  ├─ Step 05           │         │   STEP CARD 2    │    │    │
│  │  ├─ Step 06           │         │   (collapsed)    │    │    │
│  │  └─ Step 07           │         └──────────────────┘    │    │
│  │                       │                                  │    │
│  │  ... (more steps)     │         ... (more cards)         │    │
│  │                       │                                  │    │
│  └───────────────────────┴──────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Navigation Flow

```
User Action (Click)
      ↓
┌─────────────────────────────────────┐
│  Event Source:                      │
│  • Roadmap Tile (onclick)           │
│  • Sidebar Step Item (onclick)      │
│  • "Mark Complete" Button           │
│  • "Continue to Next Step" Button   │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  goToStep(num)                      │
│  ├─ Collapse all step cards         │
│  ├─ Remove all active states        │
│  ├─ Expand target card              │
│  ├─ Add active state to target      │
│  ├─ Update roadmap tiles            │
│  ├─ Update sidebar items            │
│  └─ Scroll to target card           │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Visual Updates:                    │
│  • Roadmap tile: teal border        │
│  • Step card: expanded + teal       │
│  • Sidebar item: highlighted        │
│  • Smooth scroll animation          │
└─────────────────────────────────────┘
```

### Completion Flow

```
User Clicks "Mark Complete"
      ↓
┌─────────────────────────────────────┐
│  completeStep(num)                  │
│  ├─ Mark card as complete           │
│  ├─ Add green checkmark             │
│  ├─ Update roadmap tile (green)     │
│  ├─ Update sidebar item (done)      │
│  ├─ Add journal entry               │
│  ├─ Update phase counters           │
│  ├─ Activate next step              │
│  ├─ Update roadmap for next step    │
│  └─ Save state to localStorage      │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Visual Updates:                    │
│  • Current tile: green + opacity    │
│  • Next tile: teal border (active)  │
│  • Current card: collapsed          │
│  • Next card: expanded              │
│  • Counter: increments              │
└─────────────────────────────────────┘
```

## State Management

### Step States

```javascript
// Three possible states for each step:

1. PENDING (default)
   - Roadmap: gray background, no border
   - Card: collapsed
   - Sidebar: default style

2. ACTIVE (current step)
   - Roadmap: teal border + glow
   - Card: expanded, teal border
   - Sidebar: highlighted
   - CSS: .active class

3. COMPLETED (finished)
   - Roadmap: green background, green border, opacity 0.7
   - Card: collapsed, green checkmark
   - Sidebar: "done" state
   - CSS: .completed class
```

### Global Variables

```javascript
let currentStep = 1;              // Current active step number
let completedSteps = [];          // Array of completed step numbers
let claimData = { ... };          // Claim information
```

## DOM Structure

### Roadmap Tile

```html
<div class="roadmap-tile phase-establish active" onclick="goToStep(1)">
  <div class="tile-number">01</div>
  <div class="tile-label">Claim Process Guide</div>
</div>
```

**Classes:**
- `roadmap-tile` - Base styling
- `phase-establish` / `phase-document` / etc. - Color coding by phase
- `active` - Current step (teal border)
- `completed` - Finished step (green styling)

### Step Card

```html
<div class="step-card active-card" id="step-1">
  <div class="step-card-header" onclick="toggleStep('step-1')">
    <div class="card-number">01</div>
    <div class="card-title">Claim Process Guide</div>
    <div class="card-status in-progress">In Progress</div>
  </div>
  <div class="step-body">
    <!-- Step content -->
  </div>
  <div class="step-footer">
    <button onclick="completeStep(1)">Mark Complete</button>
  </div>
</div>
```

**Classes:**
- `step-card` - Base styling
- `active-card` - Current step (teal border, expanded)
- `collapsed` - Hidden/minimized state

### Sidebar Step Item

```html
<div class="step-item active" onclick="goToStep(1)">
  <div class="step-number">01</div>
  <div class="step-title">Claim Process Guide</div>
</div>
```

**Classes:**
- `step-item` - Base styling
- `active` - Current step
- `done` - Completed step

## CSS Selectors

```css
/* Active step highlighting */
.roadmap-tile.active {
  border-color: var(--teal);
  box-shadow: 0 0 0 2px var(--teal-dim);
}

/* Completed step styling */
.roadmap-tile.completed {
  background: rgba(16,185,129,0.1);
  border-color: var(--emerald);
}

/* Active card */
.step-card.active-card {
  border-color: var(--teal);
  box-shadow: 0 0 0 3px var(--teal-dim);
}

/* Collapsed card */
.step-card.collapsed .step-body,
.step-card.collapsed .step-footer {
  display: none;
}
```

## JavaScript Functions

### Core Functions

```javascript
// Navigate to a specific step
goToStep(num)
  → Updates all UI elements to show step 'num' as active
  → Collapses other steps
  → Scrolls to target step

// Mark step as complete and move to next
completeStep(num)
  → Marks step 'num' as done
  → Updates visual states
  → Activates next step
  → Saves to localStorage

// Toggle step card expansion
toggleStep(id)
  → Expands/collapses a step card
  → Doesn't change active state

// Toggle phase group in sidebar
togglePhase(phaseGroup)
  → Expands/collapses phase group
  → Shows/hides child steps
```

### Helper Functions

```javascript
updatePhaseCounts()     // Updates "X/Y complete" counters
updatePhaseBar()        // Updates progress bar
saveState()             // Saves to localStorage
loadState()             // Loads from localStorage
addJournalEntry()       // Adds activity to journal
showNextStepBanner()    // Shows completion banner
```

## Event Handlers

### Click Events

```javascript
// Roadmap tiles (18 total)
onclick="goToStep(1)" through onclick="goToStep(18)"

// Sidebar items (18 total)
onclick="goToStep(1)" through onclick="goToStep(18)"
  with event.stopPropagation() for nested items

// Step card headers (18 total)
onclick="toggleStep('step-1')" through onclick="toggleStep('step-18')"

// Complete buttons (18 total)
onclick="completeStep(1)" through onclick="completeStep(18)"

// Phase groups (5 total)
onclick="togglePhase(this)"
```

## Synchronization

All navigation methods stay in sync:

```
Roadmap Tile Click → goToStep(num) → Updates:
                                      ├─ Roadmap tiles
                                      ├─ Step cards
                                      └─ Sidebar items

Sidebar Item Click → goToStep(num) → Updates:
                                      ├─ Roadmap tiles
                                      ├─ Step cards
                                      └─ Sidebar items

Complete Button → completeStep(num) → Updates:
                                       ├─ Roadmap tiles
                                       ├─ Step cards
                                       ├─ Sidebar items
                                       ├─ Counters
                                       ├─ Journal
                                       └─ Next step activation
```

## Performance Considerations

- **Smooth Scrolling:** Uses native `scrollIntoView()` with `behavior: 'smooth'`
- **CSS Transitions:** 0.2s for responsive feel
- **DOM Queries:** Cached within functions, not global
- **State Persistence:** localStorage for claim data and progress
- **No Page Reloads:** Pure JavaScript navigation

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Smooth scrolling supported in all modern browsers
- CSS Grid and Flexbox for layout
- No external dependencies (vanilla JavaScript)

---

**Architecture Status:** ✅ Complete and Functional
**Last Updated:** March 19, 2026
