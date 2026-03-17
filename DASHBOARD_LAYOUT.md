# Claim Intelligence Dashboard - Layout Structure

## Visual Layout Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                          HEADER (Blue Gradient)                      │
│  Claim Intelligence Dashboard                    [Back to Dashboard] │
│  Real-time claim analysis and carrier behavior intelligence          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CLAIM OVERVIEW PANEL (4 Cards)                    │
├──────────────────┬──────────────────┬──────────────────┬────────────┤
│ Intelligence     │ Potential Claim  │ Claim Risk       │ Settlement │
│ Score            │ Gap              │ Level            │ Opportunity│
│                  │                  │                  │            │
│    72 / 100      │   $18,550        │   MODERATE       │   HIGH     │
│ ━━━━━━━━━━━━━━━  │                  │                  │            │
│ [Progress Bar]   │ Insurance: $18K  │ ⚠️ Action        │ Potential: │
│                  │ Contractor: $37K │   Required       │ +$12,800   │
│ • Missing scope  │                  │                  │            │
│ • Coverage gaps  │                  │                  │            │
└──────────────────┴──────────────────┴──────────────────┴────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      CLAIM GAP ENGINE                                │
├──────────────────┬──────────────────┬──────────────────────────────┤
│ Insurance        │ Contractor       │ Potential Gap                │
│ Estimate         │ Estimate         │                              │
│ $18,200          │ $36,750          │ $18,550                      │
└──────────────────┴──────────────────┴──────────────────────────────┘
│                                                                      │
│ Insurance Estimate  ████████████░░░░░░░░░░░░░░░░░░░░░ 49%          │
│ Contractor Estimate ████████████████████████████████ 100%           │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────┬────────────────────────────────────┐
│   ESTIMATE REVIEW ENGINE       │   COVERAGE GAP DETECTION           │
├────────────────────────────────┼────────────────────────────────────┤
│ Missing Repair Items (7)       │ Coverage Opportunities (3)         │
│                                │                                    │
│ ⚠️ Roof flashing               │ ⚠️ Ordinance & Law                 │
│ ⚠️ Starter course shingles     │    Coverage may apply              │
│ ⚠️ Drip edge                   │    Estimated: +$5,000              │
│ ⚠️ Ridge vent                  │                                    │
│ ⚠️ Roof decking (8 sheets)     │ ℹ️  Code Upgrade                   │
│ ⚠️ Attic insulation            │    Coverage available              │
│ ⚠️ Interior paint              │    Estimated: +$3,500              │
│                                │                                    │
│ Pricing Suppression:           │ ℹ️  Additional Living Expense      │
│ 🔴 Labor 31% below average     │    Coverage detected               │
│ 🔴 Material pricing suppressed │                                    │
└────────────────────────────────┴────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              CARRIER BEHAVIOR INTELLIGENCE (Blue Gradient)           │
│              Carrier: State Farm                                     │
├──────────────────┬──────────────────┬──────────────────────────────┤
│ Labor            │ O&P Omission     │ Avg Claim Gap                │
│ Suppression      │ Rate             │ Detected                     │
│ 31%              │ 42%              │ $11,800                      │
│ 156 cases        │ 98 cases         │ 156 claims                   │
└──────────────────┴──────────────────┴──────────────────────────────┘
│                                                                      │
│ Common Missing Scope Items:                                         │
│ [flashing] [starter course] [drip edge] [interior paint]            │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────┬────────────────────────────────────┐
│   CLAIM TIMELINE               │   ACTIVE ALERTS                    │
├────────────────────────────────┼────────────────────────────────────┤
│ ✅ Claim Filed                 │ ⚠️  Missing Scope Detected         │
│    Mar 1, 2026                 │     7 missing items identified     │
│                                │     [Take Action →]                │
│ ✅ Estimate Received           │                                    │
│    Mar 15, 2026                │ 🔴 Pricing Suppression Detected    │
│                                │     Labor rates 31% below average  │
│ ✅ Review Completed            │     [Take Action →]                │
│    Today                       │                                    │
│                                │ ℹ️  Coverage Review Recommended    │
│ ⏳ Supplement Submitted        │     O&L coverage may add $5,000    │
│    Due: Mar 24, 2026 (8 days) │     [Learn More →]                 │
│                                │                                    │
│ ⏳ Settlement Pending          │                                    │
│    Due: Apr 23, 2026 (38 days)│                                    │
└────────────────────────────────┴────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ACTION CENTER (Recommended Next Steps)            │
├────────────────────────────────┬────────────────────────────────────┤
│ ⚡ Run Estimate Review         │ ⚡ Generate Claim Letter           │
│    Comprehensive line-by-line  │    Create professional supplement  │
│    analysis of carrier estimate│    request with documented gaps    │
│    Impact: +$11,100            │    Impact: +$12,800                │
│    [Start Action →]            │    [Start Action →]                │
├────────────────────────────────┼────────────────────────────────────┤
│ ⚡ Request Contractor Compare  │ ⚡ Review Policy Coverage          │
│    Get independent contractor  │    Analyze policy for O&L, code    │
│    estimate for validation     │    upgrade, and other coverage     │
│    Impact: +$9,275             │    Impact: +$8,500                 │
│    [Start Action →]            │    [Start Action →]                │
└────────────────────────────────┴────────────────────────────────────┘
```

## Layout Specifications

### Grid System
- **Container:** max-w-7xl (80rem / 1280px)
- **Padding:** px-4 sm:px-6 lg:px-8
- **Gap:** gap-6 (1.5rem) between sections

### Responsive Breakpoints

#### Mobile (< 768px)
```
┌─────────────┐
│ Score       │
├─────────────┤
│ Gap         │
├─────────────┤
│ Risk        │
├─────────────┤
│ Opportunity │
├─────────────┤
│ Gap Engine  │
├─────────────┤
│ Review      │
├─────────────┤
│ Coverage    │
├─────────────┤
│ Carrier     │
├─────────────┤
│ Timeline    │
├─────────────┤
│ Alerts      │
├─────────────┤
│ Actions     │
└─────────────┘
```

#### Tablet (768px - 1023px)
```
┌──────────┬──────────┐
│ Score    │ Gap      │
├──────────┼──────────┤
│ Risk     │ Opport.  │
├──────────┴──────────┤
│ Gap Engine          │
├──────────┬──────────┤
│ Review   │ Coverage │
├──────────┴──────────┤
│ Carrier Intelligence│
├──────────┬──────────┤
│ Timeline │ Alerts   │
├──────────┴──────────┤
│ Actions (2x2 grid)  │
└─────────────────────┘
```

#### Desktop (≥ 1024px)
```
┌─────┬─────┬─────┬─────┐
│Score│ Gap │Risk │Oppr.│
├─────┴─────┴─────┴─────┤
│ Gap Engine            │
├───────────┬───────────┤
│ Review    │ Coverage  │
├───────────┴───────────┤
│ Carrier Intelligence  │
├───────────┬───────────┤
│ Timeline  │ Alerts    │
├───────────┴───────────┤
│ Actions (2x2 grid)    │
└───────────────────────┘
```

## Color Coding System

### Severity Levels
```
🔴 Critical  - Red (#ef4444)    - Immediate action required
⚠️  Warning  - Orange (#f97316) - High priority attention
⚠️  Moderate - Yellow (#f59e0b) - Monitor and review
ℹ️  Info     - Blue (#3b82f6)   - Informational
✅ Success   - Green (#10b981)  - Completed/Good
```

### Risk Levels
```
Critical  → Red background, red text
High      → Orange background, orange text
Moderate  → Yellow background, yellow text
Low       → Green background, green text
```

### Score Colors
```
80-100 → Green   (Excellent)
60-79  → Yellow  (Good)
40-59  → Orange  (Fair)
0-39   → Red     (Poor)
```

## Component Hierarchy

```
DashboardPage
├── Header (Gradient Blue)
│   ├── Title
│   ├── Subtitle
│   └── Back Button
│
├── Overview Panel (Grid 4 columns)
│   ├── Intelligence Score Card
│   ├── Claim Gap Card
│   ├── Risk Level Card
│   └── Settlement Opportunity Card
│
├── Claim Gap Engine (Full width)
│   ├── Metric Cards (3 columns)
│   └── Visual Comparison Bars
│
├── Analysis Row (Grid 2 columns)
│   ├── Estimate Review Engine
│   │   ├── Missing Items List
│   │   └── Pricing Alerts
│   └── Coverage Gap Detection
│       └── Coverage Flags List
│
├── Carrier Intelligence (Full width, gradient)
│   ├── Metrics Row (3 columns)
│   └── Common Missing Items Tags
│
├── Details Row (Grid 2 columns)
│   ├── Claim Timeline
│   │   └── Milestone List
│   └── Active Alerts
│       └── Alert Cards
│
└── Action Center (Full width)
    └── Action Cards (Grid 2 columns)
```

## Card Anatomy

### Standard Metric Card
```
┌─────────────────────────────┐
│ TITLE              [Icon]   │  ← Header (gray-600, uppercase)
│                             │
│ 72                          │  ← Value (5xl, bold, colored)
│                             │
│ Subtitle text here          │  ← Subtitle (sm, gray-600)
│ • Indicator 1               │  ← Indicators (xs, gray-600)
│ • Indicator 2               │
└─────────────────────────────┘
```

### Alert Card
```
┌─────────────────────────────┐
│ [!] Title                [×]│  ← Icon, Title, Dismiss
│     Message text here       │  ← Message
│     [Take Action →]         │  ← Action Button
└─────────────────────────────┘
```

### Action Card
```
┌─────────────────────────────┐
│ Action Title      +$12,800  │  ← Title, Impact
│                             │
│ Description text explaining │  ← Description
│ what this action does       │
│                             │
│ [Start Action →]            │  ← Action Button
└─────────────────────────────┘
```

## Spacing System

### Padding
- Cards: `p-6` (1.5rem)
- Sections: `py-8` (2rem)
- Container: `px-4 sm:px-6 lg:px-8`

### Gaps
- Grid gaps: `gap-6` (1.5rem)
- Card content: `space-y-3` (0.75rem)
- Inline elements: `gap-2` (0.5rem)

### Margins
- Section bottom: `mb-8` (2rem)
- Card bottom: `mb-6` (1.5rem)
- Element bottom: `mb-4` (1rem)

## Typography Scale

```
Display:  text-5xl (3rem)    - Main metric values
Heading:  text-3xl (1.875rem) - Section headers
          text-2xl (1.5rem)   - Card headers
          text-xl (1.25rem)   - Subsection headers
Body:     text-base (1rem)    - Standard text
          text-sm (0.875rem)  - Secondary text
          text-xs (0.75rem)   - Labels, captions
```

## Icon Usage

### Icons by Section
- Intelligence Score: `Activity`
- Claim Gap: `DollarSign`
- Risk Level: `AlertTriangle`
- Settlement: `Target`
- Gap Engine: `BarChart3`
- Estimate Review: `FileText`
- Coverage: `Shield`
- Carrier Intel: `Shield`
- Timeline: `Clock`
- Alerts: `AlertCircle`
- Actions: `Zap`

### Icon Sizes
- Large cards: `w-6 h-6` (1.5rem)
- Standard cards: `w-5 h-5` (1.25rem)
- Inline icons: `w-4 h-4` (1rem)

## Animation & Transitions

### Hover Effects
```css
hover:shadow-xl       /* Cards */
hover:text-blue-800   /* Links */
transition-shadow     /* Smooth shadow */
transition-colors     /* Smooth color */
```

### Loading States
```css
animate-spin          /* Loading spinner */
animate-pulse         /* Skeleton loading */
```

## Accessibility

### Color Contrast
- Text on white: ≥ 4.5:1 ratio
- Text on colored backgrounds: ≥ 7:1 ratio
- Interactive elements: Clear focus states

### Semantic HTML
- `<h1>` for page title
- `<h2>` for section headers
- `<h3>` for card headers
- Proper heading hierarchy

### ARIA Labels
- Icon buttons have `aria-label`
- Status indicators have `role="status"`
- Interactive cards are keyboard accessible

---

This layout provides a comprehensive, scannable view of claim intelligence while maintaining visual hierarchy and responsive design principles.
