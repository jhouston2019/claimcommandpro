# 18-Step Claim Process - Complete Update Summary

## Objective
Rewrite all 18 steps to be clear, literal, and action-based across the entire application.

## Files Updated

### 1. claim-command-center.html (Primary Application)
**Location:** Root directory - Main claim management application

#### A. Step Card Headers (18 cards)
Updated all step card titles and subtitles to be action-oriented:

| Step | Old Title | New Title | New Subtitle |
|------|-----------|-----------|--------------|
| 1 | Claim Process Guide | Enter Your Claim Details | Add your claim and policy details so we can analyze your estimate and identify what may be missing. |
| 2 | Review Your Policy | See What Your Policy Covers | Understand exactly what your policy includes — including coverage your insurer may not point out. |
| 3 | Report the Loss | Set Up Your Claim the Right Way | Make sure your claim is structured correctly from the start. |
| 4 | Document Damage | Document All Damage | Capture everything — missed damage means missed money. |
| 5 | Get Contractor Estimates | Get Accurate Repair Estimates | Use real-world pricing so your claim reflects actual repair costs. |
| 6 | Prepare for Adjuster | Prepare for the Adjuster Inspection | Make sure nothing is overlooked or minimized. |
| 7 | Contents Inventory | List Everything You Lost | Account for all contents and items. |
| 8 | Review Insurance Estimate | Review Your Insurance Estimate | See exactly what your insurer included — and what they didn't. |
| 9 | Analyze Pricing | Find Underpaid Items | Identify where pricing is below market. |
| 10 | Identify Coverage Gaps | Find Missing Coverage | Uncover policy benefits that were not applied. |
| 11 | Submit Supplement | Request Additional Payment | Submit a supplement for missed or underpaid items. |
| 12 | Send Dispute Letters | Send Claim Letters | Use clear communication your insurer will respond to. |
| 13 | Recover ACV/RCV | Recover Depreciation | Claim withheld funds from your initial payment. |
| 14 | Negotiate Settlement | Negotiate Your Settlement | Push your claim to the correct value. |
| 15 | Appraisal/Mediation | Escalate If Needed | Use appraisal or mediation if required. |
| 16 | Review Settlement Offer | Finalize Your Claim | Make sure nothing is left unclaimed. |
| 17 | Execute Final Recovery | Confirm All Payments | Verify every dollar owed has been paid. |
| 18 | Close the Claim | Close Your Claim | Finish your claim knowing it was handled correctly. |

#### B. JavaScript stepTitles Object (Lines ~3618-3636)
Updated for next step navigation popup messages.

#### C. Journal Entry Step Titles (Lines ~3915-3934)
Updated for activity log entries when steps are completed.

#### D. Guide Modal Step Descriptions (Lines ~2065-2161)
Updated the detailed step descriptions shown in the process guide modal.

#### E. Popup Guidance Messages (Lines ~3790-3835)
Updated the guidance popup messages for key steps (2, 3, 4, 5, 8, 11, 14).

---

### 2. index.html (Static Landing Page)
**Location:** Root directory - Public-facing landing page

#### Dashboard Mockup Steps (Lines ~3161-3163)
Updated the visible steps shown in the dashboard visual:
- Step 8: "Review Estimate" → "Review Your Insurance Estimate"
- Step 9: "Identify Gaps" → "Find Underpaid Items"
- Step 10: "Document Findings" → "Find Missing Coverage"

---

### 3. next-app/src/lib/claimSteps.ts (NEW FILE)
**Location:** Next.js application - Constants/utilities

Created comprehensive constants file defining all 18 steps with:
- Step number
- Title
- Description
- Phase assignment (setup, document, analyze, recover, resolve)

Includes helper functions:
- `getStepsByPhase()` - Filter steps by phase
- `getStepByNumber()` - Get specific step
- `getStepTitle()` - Get step title by number
- `getStepDescription()` - Get step description by number

Also defines `PHASE_NAMES` constant mapping phase IDs to display names.

---

### 4. next-app/src/components/landing/StepByStepProcess.tsx
**Location:** Next.js landing page component

Updated the 4 condensed steps shown on the landing page:

| Step | Old Title | New Title | New Description |
|------|-----------|-----------|-----------------|
| 1 | Enter Your Claim Details & Start Your Analysis | Enter Your Claim Details | Add your claim and policy details so we can analyze your estimate and identify what may be missing. |
| 2 | Identify Claim Gap | We Analyze Your Policy and Estimate | Our system reviews your policy coverage and compares your estimate against real-world pricing. |
| 3 | Generate Proof Packet | We Identify Missing Money | See exactly what's missing, underpaid, or incorrect — with specific dollar amounts. |
| 4 | Submit and Correct the Claim | You Recover What You're Owed | Get ready-to-send claim letters and step-by-step guidance to request the money. |

Also updated actionLine for Step 1 to: "Takes about 10 minutes. This is how you find out if your claim is underpaid."

---

## Key Changes Summary

### Naming Pattern
**Old approach:** Technical/process-oriented language
- "Review the Claim Process Guide"
- "Analyze Pricing"
- "Execute Final Recovery"

**New approach:** Action-oriented + clear outcome
- "Enter Your Claim Details"
- "Find Underpaid Items"
- "Confirm All Payments"

### Description Pattern
**Old approach:** Detailed explanations with context
- "Upload your policy and let our AI extract your coverage limits, deductibles, settlement type (RCV vs ACV), and special provisions."

**New approach:** Clear, concise action + benefit
- "Understand exactly what your policy includes — including coverage your insurer may not point out."

### Benefits
1. **Immediate clarity** - Users know exactly what to do
2. **Reduced friction** - Less intimidating language
3. **Action-focused** - Every step is a clear verb
4. **Outcome-oriented** - Users understand the result
5. **Consistent** - Same pattern across all 18 steps

---

## Phase Structure (Unchanged)

The 18 steps remain organized into 5 phases:

1. **Set Up Your Claim** (Steps 1-3)
2. **Document Your Damage** (Steps 4-7)
3. **Find What's Missing** (Steps 8-10)
4. **Request the Money** (Steps 11-13)
5. **Finish & Get Paid** (Steps 14-18)

---

## Technical Implementation Notes

### claim-command-center.html
- All step references updated in 5 distinct locations
- Maintains backward compatibility with existing JavaScript logic
- Step numbers unchanged (1-18)
- No structural changes to HTML/CSS

### index.html
- Only visible mockup steps updated (8, 9, 10)
- Phase names already updated in previous commit
- No layout changes

### Next.js Application
- New constants file provides single source of truth
- Can be imported by any component/page that needs step data
- TypeScript interfaces ensure type safety
- Helper functions enable easy step lookup

### Database Schema
- No changes required
- Existing `claim_steps` table supports steps 1-18
- Step numbers remain unchanged
- Only UI labels updated

---

## Verification Checklist

✅ All 18 step card headers updated in claim-command-center.html  
✅ All 18 step descriptions updated in guide modal  
✅ All 18 step titles updated in stepTitles navigation object  
✅ All 18 step titles updated in journal entry object  
✅ Key step guidance messages updated in popup  
✅ Visible mockup steps updated in index.html  
✅ Landing page step process updated in Next.js  
✅ Constants file created for Next.js app  
✅ All changes committed and pushed to GitHub  

---

## Git Commit
**Commit:** 42701096  
**Message:** "Rewrite all 18 claim steps with clear, action-oriented language"  
**Files Changed:** 4 files, 258 insertions(+), 112 deletions(-)  
**Status:** Pushed to origin/main  

---

## Next Steps (If Needed)

If additional components need to reference the 18 steps:
1. Import from `next-app/src/lib/claimSteps.ts`
2. Use `CLAIM_STEPS` array or helper functions
3. Maintain consistent naming across all new features

Example usage:
```typescript
import { CLAIM_STEPS, getStepTitle, PHASE_NAMES } from '@/lib/claimSteps'

// Get step 8 title
const title = getStepTitle(8) // "Review Your Insurance Estimate"

// Get all steps in analyze phase
const analyzeSteps = CLAIM_STEPS.filter(s => s.phase === 'analyze')
```
