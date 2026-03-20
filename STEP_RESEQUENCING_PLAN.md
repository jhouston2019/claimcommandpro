# Step Resequencing & Title Upgrade Plan

## Current Issues
1. Duplicate step-8 IDs (ALE and Estimate Review both have id="step-8")
2. Duplicate step-18 IDs  
3. Missing step-16 and step-19
4. Wrong sequence: Estimate Review happens BEFORE contractor estimates (illogical)
5. Weak titles that don't convey outcomes
6. No AI tool badges

## Target Sequence (19 Steps)

### PHASE 1 — SET UP YOUR CLAIM (Steps 1-3)
- Step 1: Understand the Claim Process
- Step 2: Review & Understand Your Policy [AI Policy Analyzer]
- Step 3: Report the Loss the Right Way

### PHASE 2 — DOCUMENT YOUR DAMAGE (Steps 4-8)
- Step 4: Document All Damage
- Step 5: Get Accurate Contractor Estimates [Contractor Scope Validation AI]
- Step 6: Prepare for the Adjuster Inspection
- Step 7: Build Your Contents Inventory [AI Contents Valuation Engine]
- Step 8: Track & Recover Living Expenses [AI ALE Tracking System]

### PHASE 3 — FIND WHAT'S MISSING (Steps 9-11)
- Step 9: Analyze Your Insurance Estimate [AI Estimate Review Engine] ← MOVED HERE
- Step 10: Identify Pricing Gaps & Underpayment
- Step 11: Identify Missing Coverage & Benefits

### PHASE 4 — REQUEST THE MONEY (Steps 12-14)
- Step 12: Submit Your Supplement Request
- Step 13: Send Claim Dispute Letters  
- Step 14: Recover Depreciation (RCV)

### PHASE 5 — FINISH & GET PAID (Steps 15-19)
- Step 15: Negotiate Your Settlement
- Step 16: Escalate (Appraisal / Mediation)
- Step 17: Review Final Offer
- Step 18: Execute Final Recovery
- Step 19: Close Your Claim

## AI Tool Badges

Steps with AI badges:
- Step 2: "AI Policy Analyzer"
- Step 5: "Contractor Scope Validation AI"
- Step 7: "AI Contents Valuation Engine"
- Step 8: "AI ALE Tracking System"
- Step 9: "AI Estimate Review Engine"
- Step 10: "AI Pricing Deviation Analyzer"
- Step 11: "AI Coverage Gap Detector"
- Step 12: "AI Supplement Letter Generator"
- Step 13: "AI Demand Letter Generator"
- Step 14: "AI Negotiation Strategy Tool"
- Step 15: "AI Negotiation Strategy Tool"
- Step 16: "AI Escalation Evaluator"
- Step 17: "AI Settlement Review Tool"
- Step 19: "AI Release Reviewer"

## Badge HTML Structure

```html
<div class="card-text">
  <div class="card-title">Analyze Your Insurance Estimate</div>
  <div class="card-subtitle">AI ESTIMATE REVIEW ENGINE</div>
  <div class="ai-badge">AI Estimate Review Engine</div>
</div>
```

## AI Microcopy (for AI tool steps only)

Add after section-label:
```html
<div class="ai-powered-note">Powered by AI analysis calibrated to real claim data</div>
```

## Implementation Strategy

1. Fix duplicate IDs first
2. Update all titles
3. Add AI badges to card headers
4. Add AI microcopy to step bodies
5. Update phase divider labels
6. Update sidebar
7. Update JavaScript references

## Files to Modify
- claim-command-center.html (main file)
- Update all step IDs, numbers, titles, badges
- Update sidebar step list
- Update JavaScript step arrays and logic
