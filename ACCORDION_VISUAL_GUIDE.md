# Accordion Redesign - Visual Guide

## Step Card States

### Collapsed (Default/Locked)
```
┌─────────────────────────────────────────────────────────────┐
│ ⊕ 02  Get Accurate Repair Estimates          🔒  ▼         │  58px
└─────────────────────────────────────────────────────────────┘
   28px   15px bold title                    lock chevron
   badge                                      icons
   
Opacity: 0.45 (locked)
Border: 1px solid gray-200
```

### Active (Current Step)
```
┌═════════════════════════════════════════════════════════════┐
║ ⊕ 01  Enter Your Claim Details               In Progress ▼ ║  66px
║        Add your claim and policy details...                 ║
╚═════════════════════════════════════════════════════════════╝
   34px   White title (15px bold)              Teal    Chevron
   teal   White subtitle (13px, 70% opacity)   badge
   badge
   
Background: Navy gradient (#0f172a → #1e293b)
Border: 3px left teal, 1px all teal
Box-shadow: Teal glow
```

### Completed (Done)
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ 01  Enter Your Claim Details                          ▼  │  58px
└─────────────────────────────────────────────────────────────┘
   28px   Gray strikethrough title
   green
   badge
   
Opacity: 0.42 (hover: 0.7)
Border-left: 3px solid emerald
Title: line-through, gray-500
```

## Phase Dividers

```
─────────  PHASE 1 OF 5 — BEFORE YOU CALL YOUR INSURER  ─────────
           11px uppercase, 1.5px letter-spacing
           Color: Teal (#14b8a6)

─────────  PHASE 2 OF 5 — PROVE WHAT WAS DAMAGED  ─────────
           Color: Emerald (#10b981)

─────────  PHASE 3 OF 5 — FIND WHAT THEY GOT WRONG  ─────────
           Color: Orange (#f97316)

─────────  PHASE 4 OF 5 — DEMAND WHAT THEY MISSED  ─────────
           Color: Amber (#f59e0b)

─────────  PHASE 5 OF 5 — SETTLE AND GET PAID  ─────────
           Color: Red (#ef4444)
```

## Do This Now Banner

```
┌─────────────────────────────────────────────────────────────────┐
│  ●   YOUR NEXT ACTION RIGHT NOW                                 │
│ LIVE                                                             │
│      Enter your claim details and review the process guide      │
│      Start by understanding how insurance claims work           │
│                                                                  │
│                                           0/18    ┌──────────┐  │
│                                        Steps done │ Go to    │  │
│                                                   │ Step 1 → │  │
│                                                   └──────────┘  │
└─────────────────────────────────────────────────────────────────┘

Background: Navy (#0f172a)
Border-bottom: 3px solid teal
Pulsing dot: Animated teal ring
Instruction: 22px DM Serif Display, white
Sub: 13px, 55% opacity white
Counter: 28px serif, white
CTA: Teal button
```

## Amber Note Bar

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️  That $18,550 gap is real. These 18 steps show you how to   │
│     get it. Follow them in order. Every skipped step is money   │
│     you don't collect.                                          │
└─────────────────────────────────────────────────────────────────┘

Background: #fffbeb (light amber)
Border-top: 2px solid #f59e0b (amber)
Text: #92400e (dark amber)
Font: 13px, weight 500
```

## Complete Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOP NAVIGATION                            │
│                  Claim Command Pro                               │
├─────────────────────────────────────────────────────────────────┤
│                         PHASE BAR                                │
│  Phase 1  │  Phase 2  │  Phase 3  │  Phase 4  │  Phase 5       │
├──────┬──────────────────────────────────────────────────────────┤
│      │                  METRIC STRIP                             │
│      │  $18,200  │  $36,750  │  $18,550  │  Step 1 of 18       │
│      ├──────────────────────────────────────────────────────────┤
│      │                  AMBER NOTE BAR                           │
│      │  ⚠️ That $18,550 gap is real...                          │
│      ├──────────────────────────────────────────────────────────┤
│      │                  ROADMAP STRIP                            │
│ SIDE │  [01] [02] [03] [04] [05] ... [18]                       │
│ BAR  ├──────────────────────────────────────────────────────────┤
│      │              DO THIS NOW BANNER                           │
│      │  ● LIVE  YOUR NEXT ACTION RIGHT NOW                      │
│      │          Enter your claim details...                     │
│      ├──────────────────────────────────────────────────────────┤
│      │              CONTENT HEADER                               │
│      │  Phase 1 — Foundation                                    │
│      │  Set Up Your Claim                                       │
│      ├──────────────────────────────────────────────────────────┤
│      │              CLAIM JOURNAL                                │
│      │  📋 Claim Activity Log                                   │
│      ├──────────────────────────────────────────────────────────┤
│      │              STEP CARDS                                   │
│      │                                                           │
│      │  ─────  PHASE 1 OF 5 — BEFORE YOU CALL  ─────           │
│      │                                                           │
│      │  ╔═══════════════════════════════════════════╗           │
│      │  ║ ⊕ 01  Enter Your Claim Details      ▼   ║  Active    │
│      │  ║        Add your claim and policy...       ║           │
│      │  ╚═══════════════════════════════════════════╝           │
│      │  │  [Expanded content here]                  │           │
│      │  └───────────────────────────────────────────┘           │
│      │                                                           │
│      │  ┌───────────────────────────────────────────┐           │
│      │  │ ⊕ 02  See What Your Policy Covers  🔒 ▼  │  Locked    │
│      │  └───────────────────────────────────────────┘           │
│      │                                                           │
│      │  ┌───────────────────────────────────────────┐           │
│      │  │ ⊕ 03  Set Up Your Claim...         🔒 ▼  │  Locked    │
│      │  └───────────────────────────────────────────┘           │
│      │                                                           │
│      │  ─────  PHASE 2 OF 5 — PROVE WHAT WAS  ─────            │
│      │                                                           │
│      │  ┌───────────────────────────────────────────┐           │
│      │  │ ⊕ 04  Document All Damage          🔒 ▼  │  Locked    │
│      │  └───────────────────────────────────────────┘           │
│      │                                                           │
│      │  ... (steps 5-18 continue)                               │
│      │                                                           │
└──────┴──────────────────────────────────────────────────────────┘
```

## Interaction Flow

### Opening a Step

1. User clicks collapsed bar
2. All other non-active, non-done steps collapse
3. Clicked step expands with slideDown animation
4. Chevron rotates 180°
5. Content appears with fade-in

### Completing a Step

1. User clicks "Mark Complete" button
2. Current step:
   - Removes gradient header
   - Adds green left border
   - Shows ✓ in badge
   - Adds strikethrough to title
   - Fades to 42% opacity
   - Collapses
3. Next step:
   - Removes lock icon
   - Adds gradient header
   - Shows "In Progress" badge
   - Expands automatically
   - Scrolls into view (200ms delay)
4. Do This Now banner updates
5. Roadmap tile updates
6. Counter increments

### Hover States

**Locked Step:**
- Opacity: 0.45 → 0.65
- Background: transparent → gray-50

**Done Step:**
- Opacity: 0.42 → 0.7

**Collapsed Step (not locked):**
- Background: white → gray-50

**Active Step:**
- No hover effect (already prominent)

## Responsive Behavior

### Desktop (1024px+)
- Full layout as shown
- Sidebar visible
- All elements full width

### Tablet (768px-1023px)
- Sidebar collapsible
- Step cards full width
- Do This Now banner stacks vertically

### Mobile (<768px)
- Sidebar hidden/drawer
- Single column layout
- Smaller badges and text
- Touch-optimized tap targets

## Accessibility

- **Keyboard Navigation:** Tab through cards, Enter to expand
- **Screen Readers:** All text readable, state announced
- **Focus Indicators:** Visible focus rings on interactive elements
- **Color Contrast:** WCAG AA compliant
- **Touch Targets:** Minimum 44px height for mobile

## Animation Timing

- **slideDown:** 0.2s ease-out
- **pulse-ring:** 2s ease-out infinite
- **chevron rotate:** 0.2s ease
- **opacity transitions:** 0.2s ease
- **scroll delay:** 200ms before scroll to next step

## Z-Index Layers

1. Modal overlay: 9999
2. Claim summary panel: 1000
3. Do This Now banner: auto (stacking context)
4. Active step card: auto (box-shadow creates depth)
5. Base content: auto

---

**Use this guide for:**
- Visual QA testing
- Design reviews
- Developer handoff
- User documentation
- Training materials
