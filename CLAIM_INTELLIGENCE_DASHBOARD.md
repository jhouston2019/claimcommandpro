# Claim Intelligence Dashboard

## Overview

The Claim Intelligence Dashboard transforms the Claim Command Center into a comprehensive financial intelligence control panel, similar to modern SaaS analytics platforms like Vanta, Ramp, or Stripe Dashboard.

## Purpose

Help policyholders:
- ✅ Detect missing claim money
- ✅ Identify estimate errors
- ✅ Detect coverage gaps
- ✅ Identify settlement opportunities
- ✅ Understand insurance carrier behavior patterns
- ✅ Manage their claim intelligently

## Dashboard Features

### 1. Claim Overview Panel

**Location:** Top of dashboard

**Metrics Displayed:**
- **Claim Intelligence Score** (0-100)
  - Visual progress meter
  - Color-coded (green/yellow/orange/red)
  - Indicators showing detected issues
  
- **Potential Claim Gap**
  - Large financial display
  - Comparison: Insurance vs Contractor estimates
  - Visual bar chart comparison
  
- **Claim Risk Level**
  - Low / Moderate / High / Critical
  - Color-coded severity indicators
  - Contextual description
  
- **Settlement Opportunity Indicator**
  - Low / Medium / High / Very High
  - Potential settlement increase amount
  - Opportunity breakdown

### 2. Claim Gap Engine

**Purpose:** Detect missing claim value

**Displays:**
- Insurance Estimate
- Contractor Estimate
- Potential Missing Claim Value
- Visual bar comparison
- Gap percentage calculation

**Example:**
```
Insurance Estimate:  $18,200
Contractor Estimate: $36,750
Potential Claim Gap: $18,550 (51% underpayment)
```

### 3. Estimate Review Engine

**Purpose:** Analyze estimate scope and detect issues

**Features:**
- Missing repair items detection
- Pricing suppression alerts
- Labor rate analysis
- Material pricing comparison

**Example Alerts:**
- Missing: Flashing, Starter course, Interior paint, Drip edge
- Labor pricing 31% below regional average
- Material pricing suppression detected

### 4. Coverage Gap Detection

**Purpose:** Review policy coverage and identify opportunities

**Detects:**
- Ordinance & Law coverage
- Code upgrade coverage
- Additional living expense coverage
- Matching coverage
- Loss of use coverage

**Display Format:**
- Color-coded severity badges
- Estimated value per coverage type
- Actionable recommendations

### 5. Settlement Opportunity Scanner

**Purpose:** Identify opportunities to increase claim value

**Indicators:**
- Supplement opportunity detected
- Code upgrade coverage available
- Interior scope review recommended
- Depreciation recovery potential

**Shows:**
- Estimated settlement improvement potential
- Priority ranking
- Action steps

### 6. Carrier Behavior Intelligence

**Purpose:** Show patterns detected for insurance carrier

**Displays:**
- Carrier name
- Labor Suppression Rate (%)
- O&P Omission Rate (%)
- Average Claim Gap Detected
- Common Missing Scope Items

**Example:**
```
Carrier: State Farm
Labor Suppression Rate: 31%
O&P Omission Rate: 42%
Average Claim Gap: $11,800
Common Missing Scope: flashing, starter course, drip edge, interior paint
```

**Visualization:**
- Metric cards with statistics
- Common missing items as tags
- Historical pattern data

### 7. Claim Timeline Intelligence

**Purpose:** Track claim progress and next actions

**Milestones:**
- Claim Filed
- Estimate Received
- Review Completed
- Supplement Submitted
- Settlement Pending

**Features:**
- Visual progress tracker
- Status indicators (completed/pending/overdue)
- Date tracking
- Contextual descriptions

### 8. Alerts Panel

**Purpose:** Display active claim alerts

**Alert Types:**
- Missing scope detected
- Coverage review recommended
- Estimate pricing suppression detected
- Deadline approaching
- Action required

**Display:**
- Color-coded severity badges (info/warning/critical)
- Alert title and message
- Action buttons
- Dismissible alerts

### 9. Action Center

**Purpose:** Show recommended next steps

**Actions:**
- Run Estimate Review
- Generate Claim Letter
- Request Contractor Comparison
- Review Policy Coverage
- Submit Supplement
- Request Appraisal

**Each Action Shows:**
- Action title and description
- Estimated financial impact
- Priority level
- Direct action link
- Completion status

## Database Schema

### New Tables Created

#### 1. `carrier_patterns`
Stores aggregated carrier behavior patterns
```sql
- carrier_name
- issue_type (labor_suppression, missing_scope, etc.)
- frequency
- avg_claim_gap
- common_missing_items (JSONB)
- detection_count
```

#### 2. `claim_analysis`
Comprehensive claim intelligence analysis
```sql
- claim_intelligence_score (0-100)
- claim_risk_level (low/moderate/high/critical)
- settlement_opportunity
- insurance_estimate
- contractor_estimate
- claim_gap
- potential_settlement_increase
- missing_scope_items (JSONB)
- pricing_suppressions (JSONB)
- coverage_gaps (JSONB)
- carrier_behavior_flags (JSONB)
- labor_suppression_rate
```

#### 3. `coverage_flags`
Detected coverage gaps and opportunities
```sql
- coverage_type
- coverage_alert
- alert_severity
- estimated_value
- description
- recommendation
- is_resolved
```

#### 4. `claim_timeline`
Claim milestone tracking
```sql
- milestone_type
- milestone_date
- milestone_status
- description
```

#### 5. `claim_alerts`
Active alerts and notifications
```sql
- alert_type
- alert_title
- alert_message
- alert_severity
- action_required
- action_url
- is_read
- is_dismissed
```

#### 6. `recommended_actions`
AI-generated recommended actions
```sql
- action_type
- action_title
- action_description
- estimated_impact
- priority (1-5)
- action_url
- is_completed
```

## Design System

### Colors

**Primary Palette:**
- Primary: Deep Blue (#1e3a8a, #3b82f6)
- Alert: Orange (#f97316)
- Success: Green (#10b981)
- Critical: Red (#ef4444)
- Warning: Yellow (#f59e0b)

**Risk Level Colors:**
- Low: Green (#10b981)
- Moderate: Yellow (#f59e0b)
- High: Orange (#f97316)
- Critical: Red (#ef4444)

### Components

**Card Style:**
- Rounded corners (rounded-xl)
- Shadow elevation (shadow-lg)
- Border accent (border-2)
- White background
- Padding: 6 (1.5rem)

**Typography:**
- Headers: Bold, 2xl-3xl
- Metrics: Bold, 3xl-5xl
- Body: Regular, sm-base
- Labels: Semibold, xs-sm uppercase

**Layout:**
- Responsive grid system
- Max width: 7xl (80rem)
- Spacing: Consistent 8-unit grid
- Mobile-first approach

## API Endpoints

### Intelligence Data
- `GET /api/intelligence/benchmarks` - Industry benchmarks
- `GET /api/intelligence/carrier-patterns` - Carrier behavior data
- `GET /api/intelligence/regional-pricing` - Regional pricing data
- `GET /api/intelligence/tactics` - Common carrier tactics
- `GET /api/intelligence/missing-scope` - Common missing items

### Demo/Testing
- `POST /api/demo/seed-intelligence` - Seed sample intelligence data

## Usage

### Accessing the Dashboard

```typescript
// Navigate to the dashboard
router.push('/dashboard/command-center')

// Or via link
<Link href="/dashboard/command-center">
  Open Claim Intelligence Dashboard
</Link>
```

### Generating Intelligence Data

```typescript
import { generateClaimIntelligence } from '@/lib/generateClaimIntelligence'

await generateClaimIntelligence({
  claimId: 'uuid',
  userId: 'uuid',
  carrierName: 'State Farm',
  insuranceEstimate: 18200,
  contractorEstimate: 36750,
  claimType: 'Roof Hail Damage'
})
```

### Seeding Demo Data

```bash
# Via API
curl -X POST http://localhost:3000/api/demo/seed-intelligence \
  -H "Content-Type: application/json" \
  -d '{"claimId": "uuid", "userId": "uuid"}'
```

## Migration

### Database Setup

```bash
# Run the migration
psql -d your_database -f supabase/migrations/20260316_claim_intelligence_dashboard.sql
```

### Seed Carrier Patterns

The migration includes sample carrier pattern data for:
- State Farm
- Allstate
- USAA
- Farmers
- Liberty Mutual
- Progressive

## Key Functions

### `calculate_claim_intelligence_score(claim_id)`
Calculates intelligence score based on:
- Missing scope items (-5 points each)
- Coverage gaps (-8 points each)
- Critical alerts (-10 points each)
- Returns: 0-100 score

### `update_carrier_pattern(carrier_name, issue_type, ...)`
Updates carrier behavior statistics:
- Increments frequency counter
- Recalculates average claim gap
- Updates severity score
- Tracks common missing items

## Performance Considerations

### Indexes Created
- All foreign keys indexed
- Composite indexes for common queries
- JSONB GIN indexes for array searches
- Date indexes for timeline queries

### Caching Strategy
- Carrier patterns cached (low change frequency)
- Real-time claim analysis (no cache)
- Intelligence aggregates refreshed daily

## Security

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own claim data
- Carrier patterns are public (anonymized)
- Service role for system operations

### Data Privacy
- No personal information in carrier patterns
- Anonymized aggregated data only
- User-specific data isolated by user_id

## Testing

### Sample Data
Use the demo seeder to populate test data:
```typescript
POST /api/demo/seed-intelligence
{
  "claimId": "test-claim-uuid",
  "userId": "test-user-uuid"
}
```

### Expected Results
- Intelligence Score: 72/100
- Claim Gap: $18,550
- Risk Level: Moderate
- Settlement Opportunity: High
- 7 missing scope items
- 3 coverage flags
- 3 active alerts
- 4 recommended actions

## Future Enhancements

### Planned Features
- [ ] Real-time carrier pattern updates
- [ ] Machine learning claim gap prediction
- [ ] Automated supplement generation
- [ ] Settlement negotiation simulator
- [ ] Mobile app integration
- [ ] Email alert notifications
- [ ] PDF report generation
- [ ] Carrier comparison tool

### Analytics Improvements
- [ ] Historical trend analysis
- [ ] Predictive settlement timeline
- [ ] Success rate tracking
- [ ] Regional benchmarking
- [ ] Claim complexity scoring

## Support

For questions or issues:
1. Check database migration logs
2. Verify RLS policies are active
3. Ensure user authentication is working
4. Test with demo data seeder
5. Review browser console for errors

## Version History

- **v1.0.0** (2026-03-16) - Initial release
  - Claim Intelligence Dashboard
  - 6 new database tables
  - Carrier behavior intelligence
  - Real-time gap detection
  - Settlement opportunity scanner
  - Action recommendation engine
