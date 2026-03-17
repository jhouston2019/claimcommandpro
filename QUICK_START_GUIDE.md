# Claim Intelligence Dashboard - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Run Database Migration

```bash
# Navigate to your Supabase project
cd supabase

# Run the migration
supabase db push

# Or manually apply the migration
psql -d your_database -f migrations/20260316_claim_intelligence_dashboard.sql
```

**What this does:**
- Creates 6 new tables for intelligence features
- Sets up Row Level Security policies
- Creates helper functions
- Seeds sample carrier pattern data

### Step 2: Verify Installation

Navigate to your application:
```
http://localhost:3000/dashboard
```

You should see:
- ✅ "Claim Intelligence Dashboard" card (blue gradient)
- ✅ "Industry Intelligence Network" card

### Step 3: Test with Demo Data

Create a test claim first, then seed intelligence data:

```bash
# Using curl
curl -X POST http://localhost:3000/api/demo/seed-intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "claimId": "your-claim-uuid",
    "userId": "your-user-uuid"
  }'

# Or using fetch in browser console
fetch('/api/demo/seed-intelligence', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    claimId: 'your-claim-uuid',
    userId: 'your-user-uuid'
  })
}).then(r => r.json()).then(console.log)
```

### Step 4: View the Dashboard

Navigate to:
```
http://localhost:3000/dashboard/command-center
```

You should see:
- ✅ Intelligence Score: 72/100
- ✅ Claim Gap: $18,550
- ✅ 7 Missing Scope Items
- ✅ 3 Coverage Flags
- ✅ 3 Active Alerts
- ✅ 4 Recommended Actions
- ✅ Carrier Behavior Intelligence
- ✅ Claim Timeline

## 📊 Dashboard Features Overview

### Top Metrics (4 Cards)
1. **Claim Intelligence Score** - Overall claim health (0-100)
2. **Potential Claim Gap** - Money potentially missing
3. **Claim Risk Level** - Low/Moderate/High/Critical
4. **Settlement Opportunity** - Likelihood of recovery

### Main Sections
1. **Claim Gap Engine** - Visual comparison of estimates
2. **Estimate Review** - Missing items and pricing issues
3. **Coverage Analysis** - Policy coverage opportunities
4. **Carrier Intelligence** - Behavior patterns for your carrier
5. **Claim Timeline** - Progress tracking
6. **Active Alerts** - Important notifications
7. **Action Center** - Recommended next steps

## 🔧 Integration with Existing Tools

The dashboard automatically integrates with:
- ✅ Underpayment Detector
- ✅ Estimate Analyzer
- ✅ Documentation Builder
- ✅ Policy Analysis
- ✅ Strategy Advisor

Action buttons link directly to these tools.

## 💡 Using with Real Claims

### Automatic Intelligence Generation

When a user analyzes a claim, generate intelligence data:

```typescript
import { generateClaimIntelligence } from '@/lib/generateClaimIntelligence'

// After claim analysis is complete
await generateClaimIntelligence({
  claimId: claim.id,
  userId: user.id,
  carrierName: claim.carrier_name,
  insuranceEstimate: 18200,
  contractorEstimate: 36750,
  claimType: 'Roof Hail Damage'
})
```

### Manual Intelligence Creation

Insert directly into database:

```sql
-- Create claim analysis
INSERT INTO claim_analysis (
  claim_id,
  user_id,
  claim_intelligence_score,
  claim_risk_level,
  settlement_opportunity,
  insurance_estimate,
  contractor_estimate,
  claim_gap
) VALUES (
  'claim-uuid',
  'user-uuid',
  72,
  'moderate',
  'high',
  18200,
  36750,
  18550
);
```

## 🎨 Customization

### Change Colors

Edit the dashboard component:
```typescript
// File: next-app/src/app/dashboard/command-center/page.tsx

// Find color classes like:
'text-blue-600'  // Change to your brand color
'bg-blue-50'     // Change background
'border-blue-200' // Change borders
```

### Modify Scoring Algorithm

Edit the database function:
```sql
-- File: supabase/migrations/20260316_claim_intelligence_dashboard.sql

CREATE OR REPLACE FUNCTION calculate_claim_intelligence_score(p_claim_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 100;
    -- Modify scoring logic here
BEGIN
    -- Your custom scoring rules
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;
```

### Add New Alert Types

Update the database schema:
```sql
ALTER TABLE claim_alerts 
DROP CONSTRAINT claim_alerts_alert_type_check;

ALTER TABLE claim_alerts 
ADD CONSTRAINT claim_alerts_alert_type_check 
CHECK (alert_type IN (
  'missing_scope',
  'pricing_suppression',
  'coverage_gap',
  'deadline_approaching',
  'settlement_opportunity',
  'carrier_tactic_detected',
  'action_required',
  'your_new_type'  -- Add here
));
```

## 🐛 Troubleshooting

### Dashboard Shows "No Claim Data"
**Solution:** Create a claim first or seed demo data

```bash
POST /api/demo/seed-intelligence
{
  "claimId": "valid-claim-uuid",
  "userId": "valid-user-uuid"
}
```

### Intelligence Score Not Calculating
**Solution:** Verify the database function exists

```sql
SELECT calculate_claim_intelligence_score('your-claim-uuid');
```

### Carrier Patterns Not Showing
**Solution:** Check if carrier patterns were seeded

```sql
SELECT * FROM carrier_patterns WHERE carrier_name = 'State Farm';
```

If empty, run the migration again or manually insert:
```sql
INSERT INTO carrier_patterns (carrier_name, issue_type, frequency, avg_claim_gap)
VALUES ('State Farm', 'labor_suppression', 156, 11800);
```

### RLS Policy Errors
**Solution:** Verify user is authenticated

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  router.push('/login')
}
```

## 📱 Mobile Responsiveness

The dashboard is fully responsive:
- **Mobile** (< 768px): Single column layout
- **Tablet** (≥ 768px): 2 column layout
- **Desktop** (≥ 1024px): 3-4 column layout

Test on different devices:
```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Click device toolbar icon
3. Select device (iPhone, iPad, etc.)
4. Navigate to dashboard
```

## 🔐 Security Checklist

- ✅ RLS policies enabled on all tables
- ✅ User data isolated by user_id
- ✅ Carrier patterns publicly readable (anonymized)
- ✅ Service role for system operations only
- ✅ No personal data in carrier patterns

## 📈 Performance Tips

### Optimize Queries
```typescript
// Load data in parallel
const [analysis, patterns, flags] = await Promise.all([
  supabase.from('claim_analysis').select('*').eq('claim_id', id).single(),
  supabase.from('carrier_patterns').select('*').eq('carrier_name', name),
  supabase.from('coverage_flags').select('*').eq('claim_id', id)
])
```

### Cache Carrier Patterns
```typescript
// Carrier patterns change infrequently
const patterns = await redis.get(`carrier:${carrierName}`)
if (!patterns) {
  const fresh = await supabase.from('carrier_patterns').select('*')
  await redis.set(`carrier:${carrierName}`, JSON.stringify(fresh), 'EX', 86400)
}
```

### Limit Result Sets
```typescript
// Only fetch what you need
.limit(5)
.order('created_at', { ascending: false })
```

## 🎯 Next Steps

### Immediate Actions
1. ✅ Run database migration
2. ✅ Test with demo data
3. ✅ View dashboard
4. ✅ Verify all sections load

### Production Deployment
1. ✅ Run migration on production database
2. ✅ Deploy Next.js application
3. ✅ Test with real user data
4. ✅ Monitor performance
5. ✅ Gather user feedback

### Future Enhancements
- [ ] Add email alerts for critical issues
- [ ] Generate PDF reports
- [ ] Add historical trend charts
- [ ] Implement real-time updates
- [ ] Create mobile app version

## 📚 Additional Resources

- **Full Documentation:** `CLAIM_INTELLIGENCE_DASHBOARD.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Database Schema:** `supabase/migrations/20260316_claim_intelligence_dashboard.sql`
- **Main Component:** `next-app/src/app/dashboard/command-center/page.tsx`

## 💬 Support

If you encounter issues:
1. Check database migration logs
2. Verify RLS policies are active
3. Ensure user is authenticated
4. Test with demo data seeder
5. Review browser console for errors

## ✅ Success Checklist

- [ ] Database migration completed
- [ ] Demo data seeded successfully
- [ ] Dashboard loads without errors
- [ ] All 4 overview metrics display
- [ ] Claim gap engine shows comparison
- [ ] Carrier intelligence displays patterns
- [ ] Alerts panel shows active alerts
- [ ] Action center shows recommendations
- [ ] Timeline displays milestones
- [ ] Mobile layout works correctly
- [ ] Links to tools work properly

---

**You're all set!** 🎉

The Claim Intelligence Dashboard is now ready to help policyholders detect missing claim money, identify estimate errors, and maximize their settlements.
