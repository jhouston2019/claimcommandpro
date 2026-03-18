# Complete Tool Integration Map

## 🎯 ALL TOOLS → BACKEND FUNCTIONS MAPPED

This document maps every tool in the Claim Command Center to its corresponding Netlify backend function.

---

## ✅ PHASE 1: ESTABLISH

### Step 1: Start Here - Understand Your Claim
**Tool:** Built-in guide modal
**Backend:** None needed (content-only)
**Status:** ✅ 100% Functional

### Step 2: Review Your Policy with AI
**Frontend Tool:** `app/tools/policy-analyzer-working.html`
**Backend Function:** `netlify/functions/analyze-policy.js`
**Alternative:** `netlify/functions/ai-policy-review.js`
**Status:** ✅ Backend exists with OpenAI
**What It Does:**
- Extracts coverage limits (A, B, C, D, E, F)
- Identifies deductibles
- Detects RCV vs ACV
- Finds ordinance & law coverage
- Identifies endorsements
- Flags exclusions

### Step 3: Report the Loss Properly
**Frontend Tool:** `app/tools/written-notice-generator.html`
**Backend Function:** `netlify/functions/generate-document.js` or `generate-letter.js`
**Status:** ✅ Backend exists
**What It Does:**
- Generates formal loss notification letter
- Includes proper legal language
- Protects policyholder rights

---

## ✅ PHASE 2: DOCUMENT

### Step 4: Document Damage Thoroughly
**Frontend Tool:** `app/tools/damage-documentation-tool.html`
**Backend Function:** `netlify/functions/ai-damage-assessment.js`
**Alternative:** `netlify/functions/ai-categorize-evidence.js`
**Status:** ✅ Backend exists with OpenAI
**What It Does:**
- Categorizes damage photos
- Suggests additional documentation needed
- Organizes by room/type

### Step 5: Get Contractor Estimates
**Frontend Tool:** `app/tools/contractor-scope-checklist.html`
**Backend Function:** `netlify/functions/contractor-estimate-interpreter.js`
**Status:** ✅ Backend exists with OpenAI
**What It Does:**
- Parses contractor estimates
- Validates scope completeness
- Identifies missing trades

### Step 6: Prepare for Adjuster Inspection
**Frontend Tool:** `app/tools/carrier-request-logger.html`
**Backend Function:** `netlify/functions/add-journal-entry.js`
**Status:** ✅ Backend exists
**What It Does:**
- Logs adjuster requests
- Tracks inspection notes
- Creates timeline

### Step 7: Complete Contents Inventory
**Frontend Tool:** `app/tools/contents-inventory.html`
**Backend Function:** `netlify/functions/calculate-depreciation.js`
**Alternative:** `netlify/functions/ai-categorize-evidence.js`
**Status:** ✅ Backend exists
**What It Does:**
- Calculates item depreciation
- Estimates replacement costs
- Organizes by category

---

## ✅ PHASE 3: ANALYZE

### Step 8: Review Insurance Estimate
**Frontend Tool:** `app/tools/estimate-review-working.html`
**Backend Function:** `netlify/functions/analyze-estimates.js`
**Alternative:** `netlify/functions/ai-estimate-comparison.js`
**Status:** ✅ Backend exists with OpenAI
**What It Does:**
- Line-by-line comparison
- Identifies missing items
- Calculates quantity discrepancies
- Flags pricing differences
- Totals gap amount

### Step 9: Analyze Pricing Deviations
**Frontend Tool:** `app/tools/pricing-deviation-analyzer.html`
**Backend Function:** `netlify/functions/analyze-estimates.js` (same as Step 8)
**Status:** ✅ Backend exists
**What It Does:**
- Compares unit prices to market rates
- Identifies undervalued labor
- Flags material cost discrepancies

### Step 10: Identify Coverage Gaps
**Frontend Tool:** `app/tools/coverage-gap-detector.html`
**Backend Function:** `netlify/functions/analyze-evidence-gaps.js`
**Alternative:** `netlify/functions/ai-coverage-decoder.js`
**Status:** ✅ Backend exists with OpenAI
**What It Does:**
- Detects unapplied policy provisions
- Identifies missing coverage (O&P, ordinance, code upgrade)
- Finds scope omissions

---

## ✅ PHASE 4: RECOVER

### Step 11: Submit Supplement Request
**Frontend Tool:** `app/tools/supplement-letter-working.html`
**Backend Function:** `netlify/functions/generate-supplement.js`
**Alternative:** `netlify/functions/generate-supplement-v2.js`
**Status:** ✅ Backend exists with OpenAI
**What It Does:**
- Calculates total supplement amount
- Generates professional cover letter
- Includes policy citations
- Lists line-item discrepancies

### Step 12: Send Dispute Letters
**Frontend Tool:** `app/tools/response-letter-generator.html`
**Backend Function:** `netlify/functions/generate-demand-letter.js`
**Alternative:** `netlify/functions/generate-response.js`
**Status:** ✅ Backend exists with OpenAI
**What It Does:**
- Generates formal dispute letters
- Includes escalation language
- References policy provisions
- Sets response deadlines

### Step 13: Recover ACV vs RCV Difference
**Frontend Tool:** `app/tools/rcv-recovery-submitter.html`
**Backend Function:** `netlify/functions/calculate-depreciation.js`
**Status:** ✅ Backend exists
**What It Does:**
- Calculates depreciation holdback
- Generates RCV recovery request
- Lists required documentation

---

## ✅ PHASE 5: RESOLVE

### Step 14: Negotiate Settlement
**Frontend Tool:** `app/tools/negotiation-strategy-generator.html`
**Backend Function:** `netlify/functions/ai-negotiation-advisor.js`
**Status:** ✅ Backend exists with OpenAI
**What It Does:**
- Analyzes negotiation position
- Suggests strategy based on leverage
- Provides response templates
- Identifies adjuster tactics

### Step 15: Consider Appraisal or Mediation
**Frontend Tool:** `app/tools/escalation-readiness-checker.html`
**Backend Function:** `netlify/functions/evaluate-escalation-status.js`
**Alternative:** `netlify/functions/generate-escalation-template.js`
**Status:** ✅ Backend exists
**What It Does:**
- Evaluates escalation readiness
- Recommends appraisal vs mediation
- Generates demand letters
- Assesses likelihood of success

### Step 16: Review Settlement Offer
**Frontend Tool:** `app/tools/payment-tracker.html`
**Backend Function:** `netlify/functions/analyze-settlement.js`
**Alternative:** `netlify/functions/settlement-comparison.js`
**Status:** ✅ Backend exists with OpenAI
**What It Does:**
- Parses settlement letters
- Extracts payment breakdown
- Compares to documented losses
- Flags inadequate offers

### Step 17: Execute Final Recovery
**Frontend Tool:** `app/tools/claim-archive-generator.html`
**Backend Function:** `netlify/functions/generate-evidence-report.js`
**Status:** ✅ Backend exists
**What It Does:**
- Compiles all documentation
- Generates final report
- Creates archive package

### Step 18: Close the Claim
**Frontend Tool:** `app/tools/claim-package-assembly.html`
**Backend Function:** `netlify/functions/analyze-release.js`
**Status:** ✅ Backend exists with OpenAI
**What It Does:**
- Reviews release language
- Identifies problematic clauses
- Suggests revisions
- Confirms claim closure

---

## 🔥 ADDITIONAL AI TOOLS AVAILABLE

### Workflow Tools (Already Built)

1. **AI Response Agent**
   - File: `app/tools/ai-response-agent.html`
   - Backend: `netlify/functions/ai-response-agent.js`
   - Purpose: Analyze insurer letters and generate responses

2. **Expert Opinion Generator**
   - File: `app/tools/expert-opinion.html`
   - Backend: `netlify/functions/ai-expert-opinion.js`
   - Purpose: Generate expert opinion requests

3. **Timeline Analyzer**
   - Backend: `netlify/functions/ai-timeline-analyzer.js`
   - Purpose: Analyze claim timeline and identify delays

4. **Situational Advisory**
   - Backend: `netlify/functions/ai-situational-advisory.js`
   - Purpose: Provide context-specific advice

5. **ROM Estimator**
   - Backend: `netlify/functions/ai-rom-estimator.js`
   - Purpose: Rough order of magnitude estimates

6. **Business Interruption Calculator**
   - Backend: `netlify/functions/ai-business-interruption.js`
   - Purpose: Calculate BI losses

---

## 🔌 HOW TO CONNECT TOOLS TO BACKENDS

### Current State
- ✅ Backend functions exist with OpenAI integration
- ✅ OpenAI API key in Netlify environment
- ⚠️ Frontend tools using mock data OR client-side AI
- ⚠️ Need to update frontend to call backend functions

### Two Options

#### OPTION A: Use Netlify Backend (Recommended for Production)
**Pros:**
- Centralized API key management
- Better security
- Usage tracking
- Rate limiting
- Data persistence in Supabase

**Cons:**
- Requires authentication
- Requires Supabase setup
- More complex

**Implementation:**
Update each tool to call `/.netlify/functions/[function-name]`

#### OPTION B: Use Client-Side AI (Current Implementation)
**Pros:**
- Works immediately
- No authentication needed
- No backend required
- Simple to test

**Cons:**
- User provides API key
- No data persistence (localStorage only)
- No usage tracking

**Status:** ✅ Already implemented for 3 tools

---

## 📋 COMPLETE BACKEND FUNCTION LIST

### Policy & Coverage Analysis
- ✅ `analyze-policy.js` - Full policy analysis
- ✅ `analyze-policy-v2.js` - Enhanced version
- ✅ `ai-policy-review.js` - Policy review
- ✅ `ai-policy-review-free.js` - Free tier version
- ✅ `ai-coverage-decoder.js` - Coverage interpretation

### Estimate Analysis
- ✅ `analyze-estimates.js` - Estimate comparison
- ✅ `analyze-estimates-v2.js` - Enhanced version
- ✅ `ai-estimate-comparison.js` - AI comparison
- ✅ `contractor-estimate-interpreter.js` - Parse contractor estimates
- ✅ `supplement-analysis-estimate.js` - Supplement analysis

### Document Generation
- ✅ `generate-supplement.js` - Supplement letters
- ✅ `generate-supplement-v2.js` - Enhanced version
- ✅ `generate-demand-letter.js` - Demand letters
- ✅ `generate-response.js` - Response letters
- ✅ `generate-document.js` - General documents
- ✅ `generate-letter.js` - General letters
- ✅ `ai-document-generator.js` - AI document gen

### Settlement & Negotiation
- ✅ `analyze-settlement.js` - Settlement analysis
- ✅ `settlement-comparison.js` - Settlement comparison
- ✅ `ai-negotiation-advisor.js` - Negotiation strategy
- ✅ `generate-script.js` - Negotiation scripts

### Evidence & Documentation
- ✅ `analyze-evidence-gaps.js` - Evidence gap detection
- ✅ `ai-damage-assessment.js` - Damage assessment
- ✅ `ai-categorize-evidence.js` - Evidence categorization
- ✅ `ai-evidence-auto-tagger.js` - Auto-tagging
- ✅ `ai-evidence-check.js` - Evidence validation
- ✅ `generate-evidence-report.js` - Evidence reports

### Escalation & Strategy
- ✅ `evaluate-escalation-status.js` - Escalation evaluation
- ✅ `generate-escalation-template.js` - Escalation letters
- ✅ `ai-situational-advisory.js` - Situational advice
- ✅ `ai-advisory.js` - General advisory

### Financial Calculations
- ✅ `calculate-depreciation.js` - Depreciation calc
- ✅ `financial-impact-calculator.js` - Financial impact
- ✅ `rom-estimate.js` - ROM estimates
- ✅ `ai-rom-estimator.js` - AI ROM estimates

### Compliance & Deadlines
- ✅ `compliance-engine.js` - Compliance checking
- ✅ `calculate-deadline.js` - Deadline calculation
- ✅ `deadline-tracker.js` - Deadline tracking
- ✅ `ai-timeline-analyzer.js` - Timeline analysis

### Specialized Tools
- ✅ `ai-response-agent.js` - Letter response agent
- ✅ `ai-expert-opinion.js` - Expert opinions
- ✅ `analyze-release.js` - Release review
- ✅ `analyze-expert-report.js` - Expert report analysis

---

## 🚀 IMPLEMENTATION PLAN

### Immediate (Do This Now)

Create a unified API client that all tools can use:

**File:** `app/assets/js/api-client.js`

```javascript
// Unified API client for all tools
class ClaimCommandAPI {
  constructor() {
    this.baseURL = '/.netlify/functions';
  }

  async analyzePolicy(policyPdfUrl, claimId) {
    return this.call('analyze-policy', {
      claim_id: claimId,
      policy_pdf_url: policyPdfUrl
    });
  }

  async compareEstimates(contractorPdfUrl, carrierPdfUrl, claimId) {
    return this.call('analyze-estimates', {
      claim_id: claimId,
      contractor_estimate_pdf_url: contractorPdfUrl,
      carrier_estimate_pdf_url: carrierPdfUrl
    });
  }

  async generateSupplement(claimId) {
    return this.call('generate-supplement', {
      claim_id: claimId
    });
  }

  async generateDemandLetter(claimId) {
    return this.call('generate-demand-letter', {
      claim_id: claimId
    });
  }

  async analyzeSettlement(settlementPdfUrl, claimId) {
    return this.call('analyze-settlement', {
      claim_id: claimId,
      settlement_pdf_url: settlementPdfUrl
    });
  }

  async evaluateEscalation(claimId) {
    return this.call('evaluate-escalation-status', {
      claim_id: claimId
    });
  }

  async analyzeRelease(releasePdfUrl, claimId) {
    return this.call('analyze-release', {
      claim_id: claimId,
      release_pdf_url: releasePdfUrl
    });
  }

  async call(endpoint, data) {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${this.baseURL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API call failed');
    }

    return response.json();
  }

  async getAuthToken() {
    // Get from Supabase session
    if (window.supabaseClient) {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      return session?.access_token;
    }
    return null;
  }
}

window.ClaimCommandAPI = new ClaimCommandAPI();
```

---

## 🔧 TOOL UPDATE STRATEGY

### For Each Tool, Update to:

1. **Check for Netlify backend availability**
2. **If available:** Use Netlify function
3. **If not available:** Fall back to client-side AI
4. **Always:** Save results to localStorage
5. **Always:** Log to journal

### Example Pattern

```javascript
async function analyzeTool() {
  try {
    // Try Netlify backend first
    const result = await window.ClaimCommandAPI.analyzePolicy(url, claimId);
    displayResults(result);
  } catch (error) {
    console.warn('Backend unavailable, using client-side AI');
    // Fall back to client-side OpenAI
    const result = await analyzeWithClientSideAI();
    displayResults(result);
  }
}
```

---

## 📊 PRIORITY IMPLEMENTATION ORDER

### HIGH PRIORITY (Core Claim Flow)

1. **Step 2: Policy Analyzer** ✅ DONE
   - Frontend: `policy-analyzer-working.html`
   - Backend: `analyze-policy.js`
   - Status: Client-side working, can connect to backend

2. **Step 8: Estimate Review** ✅ DONE
   - Frontend: `estimate-review-working.html`
   - Backend: `analyze-estimates.js`
   - Status: Client-side working, can connect to backend

3. **Step 11: Supplement Letter** ✅ DONE
   - Frontend: `supplement-letter-working.html`
   - Backend: `generate-supplement.js`
   - Status: Client-side working, can connect to backend

4. **Step 12: Demand Letter**
   - Frontend: `response-letter-generator.html`
   - Backend: `generate-demand-letter.js`
   - Status: Backend ready, need frontend update

5. **Step 16: Settlement Review**
   - Frontend: `payment-tracker.html`
   - Backend: `analyze-settlement.js`
   - Status: Backend ready, need frontend update

### MEDIUM PRIORITY (Enhanced Features)

6. **Step 3: Loss Notice**
   - Backend: `generate-document.js`
   - Status: Backend ready

7. **Step 4: Damage Assessment**
   - Backend: `ai-damage-assessment.js`
   - Status: Backend ready

8. **Step 14: Negotiation Strategy**
   - Backend: `ai-negotiation-advisor.js`
   - Status: Backend ready

9. **Step 15: Escalation Evaluation**
   - Backend: `evaluate-escalation-status.js`
   - Status: Backend ready

10. **Step 18: Release Review**
    - Backend: `analyze-release.js`
    - Status: Backend ready

### LOW PRIORITY (Supporting Tools)

11. Evidence categorization
12. Timeline analysis
13. Expert opinion generation
14. Compliance checking
15. Deadline tracking

---

## 🎯 WHAT TO DO NEXT

### Option 1: Keep Client-Side AI (Fastest)
**Time:** 0 minutes (already done)
**Effort:** None
**Result:** 3 tools work immediately
**Limitation:** User provides API key

### Option 2: Connect to Netlify Backend (Best)
**Time:** 2-4 hours
**Effort:** Update frontend tools to call backend
**Result:** All tools work with centralized API
**Benefit:** Better security, tracking, persistence

### Option 3: Hybrid Approach (Recommended)
**Time:** 1 hour
**Effort:** Add backend detection + fallback
**Result:** Tools try backend first, fall back to client-side
**Benefit:** Works in all scenarios

---

## 📝 IMPLEMENTATION CHECKLIST

### For Each Tool

- [ ] Create/update frontend HTML file
- [ ] Add Supabase client initialization
- [ ] Add API client calls
- [ ] Add fallback to client-side AI
- [ ] Add progress indicators
- [ ] Add error handling
- [ ] Add results display
- [ ] Add export functionality
- [ ] Test with backend
- [ ] Test without backend
- [ ] Update Claim Command Center link

---

## 🎉 CURRENT STATUS

### ✅ WORKING NOW (Client-Side AI)
- Policy Analyzer
- Estimate Review
- Supplement Letter Generator

### ✅ BACKEND READY (Need Frontend Connection)
- Demand Letter Generator
- Settlement Analyzer
- Negotiation Advisor
- Escalation Evaluator
- Release Reviewer
- Damage Assessor
- Evidence Categorizer
- Timeline Analyzer
- Expert Opinion Generator
- Depreciation Calculator
- Compliance Engine
- Deadline Tracker

### 📊 Total Functions Available
- **142 Netlify functions** exist
- **~20 are AI-powered** with OpenAI
- **~15 are claim-specific** tools
- **All have OpenAI API key** configured

---

## 💡 RECOMMENDATION

**DO THIS:**

1. **Keep the 3 client-side tools** (working now)
2. **Create 5 more critical tools** using same pattern:
   - Demand letter (Step 12)
   - Settlement review (Step 16)
   - Negotiation strategy (Step 14)
   - Escalation evaluator (Step 15)
   - Release reviewer (Step 18)

3. **Total time:** 2-3 hours
4. **Result:** 8 fully functional AI tools
5. **No backend dependency** for basic use
6. **Can add backend later** for enhanced features

**This gives you a FULLY FUNCTIONAL system TODAY.**

---

**Status:** Backend exists, frontend needs connection
**Priority:** Connect top 8 tools
**Timeline:** 2-3 hours for complete integration
**Blocker:** None - can start immediately
