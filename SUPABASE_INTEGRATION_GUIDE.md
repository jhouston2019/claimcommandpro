# Supabase Integration Guide - Claim Command Center

## Overview

The Claim Command Center now dynamically loads user claim data from Supabase instead of using hardcoded demo values. This guide explains how to set up and configure the integration.

## What Changed

### Before (Hardcoded Demo Data)
- Claim Number: `CLM-2024-0847`
- Days: `Day 85`
- Insurance Estimate: `$18,200`
- Your Estimate: `$36,750`
- Claim Gap: `$18,550`

### After (Dynamic from Supabase)
All values are loaded from your Supabase database based on the authenticated user's claim data.

## Setup Steps

### 1. Configure Supabase Credentials

Create a `.env` file in the project root (copy from `.env.example`):

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Get these values from: https://app.supabase.com/project/_/settings/api

### 2. Set Up Database Tables

Run the migration file to create the required tables:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL file in Supabase SQL Editor
# File: supabase/migrations/20260212_claim_command_center_schema.sql
```

Required tables:
- `claims` - Main claim records
- `claim_financial_summary` - Financial data (estimates, gaps, payments)
- `claim_policy_coverage` - Policy details
- `claim_steps` - Step completion tracking

### 3. Configure Frontend

For local development, set the Supabase config in your HTML or via environment:

**Option A: Direct in HTML** (not recommended for production)
```html
<script>
  window.SUPABASE_URL = 'https://your-project.supabase.co';
  window.SUPABASE_ANON_KEY = 'your-anon-key';
</script>
```

**Option B: Via Netlify Function** (recommended)
The app will fetch config from `/.netlify/functions/get-supabase-config` automatically.

### 4. URL Parameter

Pass the claim ID when loading the page:

```
claim-command-center.html?claim_id=123e4567-e89b-12d3-a456-426614174000
```

Or the app will use the last claim ID from localStorage.

## Data Flow

```
Page Load
  ↓
Check URL for ?claim_id=xxx
  ↓
Load Supabase Client (app/assets/js/supabase-client.js)
  ↓
Fetch Claim Data (app/assets/js/claim-command-center-data.js)
  ├─ claims table → claim number, days, status
  ├─ claim_financial_summary → estimates, gap
  ├─ claim_policy_coverage → policy details
  └─ claim_steps → completion status
  ↓
Populate UI with Real Data
  ├─ Nav bar (claim #, days)
  ├─ Metric strip (estimates, gap)
  ├─ Step cards (completion states)
  └─ Summary panel
```

## Database Schema Reference

### claims table
```sql
- id (UUID)
- user_id (UUID)
- claim_number (TEXT) → "CLM-2024-0847"
- loss_date (DATE) → calculates "Day 85"
- status (TEXT) → "active", "pending", "closed"
- insurer_name (TEXT)
- adjuster_name (TEXT)
- adjuster_phone (TEXT)
- adjuster_email (TEXT)
```

### claim_financial_summary table
```sql
- claim_id (UUID)
- carrier_total (NUMERIC) → Insurance estimate
- contractor_total (NUMERIC) → Your estimate
- underpayment_estimate (NUMERIC) → Claim gap
- acv_paid, rcv_total, deductible_applied
- supplement_total, final_settlement_amount
```

### claim_steps table
```sql
- claim_id (UUID)
- step_number (INTEGER 1-18)
- status (TEXT) → 'not_started', 'in_progress', 'completed', 'skipped'
- started_at, completed_at (TIMESTAMPTZ)
```

## Tool Path Resolution

Tool links are now dynamically resolved based on the deployment environment:

### How It Works
```javascript
// Original path in HTML
<a href="app/tools/policy-analyzer-working.html">

// Resolved at runtime based on current location
// Local: /app/tools/policy-analyzer-working.html
// Netlify: https://yoursite.com/app/tools/policy-analyzer-working.html
```

The `resolveToolPath()` function automatically handles:
- Relative paths (`app/tools/...`)
- Absolute paths (`/app/tools/...`)
- Full URLs (`https://...`)

## Demo Mode Fallback

If no claim ID is provided or Supabase is not configured, the app falls back to demo data:
- Claim Number: `CLM-2024-0847`
- Days: `Day 85`
- Insurance Estimate: `$18,200`
- Your Estimate: `$36,750`
- Claim Gap: `$18,550`

## Testing

### 1. Test with Demo Data (No Supabase)
```
# Just open the file - will use hardcoded values
claim-command-center.html
```

### 2. Test with Supabase
```
# With claim ID parameter
claim-command-center.html?claim_id=your-claim-uuid

# Check browser console for:
# - "Loading claim data for: [claim-id]"
# - "Claim data loaded successfully"
# - Any errors
```

### 3. Verify Data Population
Open browser DevTools and check:
```javascript
// Should show loaded claim data
console.log(window.claimData);

// Should show current user session
window.supabase.auth.getSession();
```

## Troubleshooting

### Issue: Still seeing demo data
**Solution:** 
1. Check browser console for errors
2. Verify claim ID is in URL or localStorage
3. Confirm Supabase credentials are set
4. Check user is authenticated

### Issue: Tool links don't work
**Solution:**
1. Check browser console for path resolution
2. Verify tool files exist at resolved paths
3. Update `resolveToolPath()` logic if needed

### Issue: "Not authenticated" error
**Solution:**
1. User must be logged in via Supabase Auth
2. Check session: `supabase.auth.getSession()`
3. Redirect to login page if needed

## Next Steps

1. **Add Authentication Flow**
   - Create login page
   - Add auth check on page load
   - Redirect unauthenticated users

2. **Create Claim Selection**
   - If user has multiple claims, show selector
   - Store selected claim ID in localStorage

3. **Real-time Updates**
   - Subscribe to Supabase realtime changes
   - Update UI when data changes in database

4. **Error Handling**
   - Show user-friendly messages for connection errors
   - Graceful degradation to demo mode

## Files Modified

- `claim-command-center.html` - Added script imports and tool path resolver
- `app/assets/js/claim-command-center-data.js` - New data loading module
- `app/assets/js/supabase-client.js` - Existing Supabase client (already present)

## Security Notes

- Never commit `.env` file with real credentials
- Use Row Level Security (RLS) policies (already configured in schema)
- Anon key is safe for frontend use
- Service role key should ONLY be used in Netlify functions (server-side)
