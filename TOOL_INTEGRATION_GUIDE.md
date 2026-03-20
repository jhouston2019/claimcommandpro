# Tool Integration Guide

## Overview

This guide explains how to integrate AI tools with the Claim Command Center to display results and track activity automatically.

## PostMessage API

All tools should send their results back to the command center using the `postMessage` API when the user completes an action.

### Basic Integration

Add this code to your tool file (e.g., `policy-analyzer-working.html`):

```javascript
// Send results back to parent window (Claim Command Center)
function sendResultsToCommandCenter(stepNum, toolName, results) {
  if (window.opener) {
    window.opener.postMessage({
      type: 'TOOL_RESULT',
      stepNum: stepNum,
      toolName: toolName,
      results: results
    }, '*'); // In production, replace '*' with your actual domain
  }
}

// Example usage after analysis completes:
const analysisResults = {
  summary: 'Your policy provides $250,000 in dwelling coverage with a $2,500 deductible.',
  details: {
    'Dwelling Coverage': '$250,000',
    'Personal Property': '$125,000',
    'Deductible': '$2,500',
    'ACV or RCV': 'Replacement Cost Value (RCV)'
  },
  recommendations: [
    'Your policy includes Law & Ordinance coverage up to 25% of dwelling limit',
    'You have Additional Living Expenses coverage for up to 24 months',
    'Consider documenting all personal property for maximum recovery'
  ]
};

sendResultsToCommandCenter(2, 'Policy Analyzer', analysisResults);
```

### Results Object Structure

The `results` object can be structured in three ways:

#### 1. Simple String
```javascript
results = "Analysis complete. Your policy covers this type of damage.";
```

#### 2. Structured Object (Recommended)
```javascript
results = {
  summary: "Brief overview of what was done",
  details: {
    'Key 1': 'Value 1',
    'Key 2': 'Value 2'
  },
  recommendations: [
    'Recommendation 1',
    'Recommendation 2'
  ]
};
```

#### 3. Array of Items
```javascript
results = {
  summary: "Found 12 coverage gaps",
  details: [
    'Missing overhead & profit calculation',
    'Depreciation applied incorrectly to roof',
    'Code upgrade costs not included'
  ]
};
```

## Tool-Specific Integration Examples

### Step 2: Policy Analyzer
```javascript
// After policy analysis completes
const policyResults = {
  summary: `Analyzed ${pageCount} pages. Coverage confirmed for ${lossType}.`,
  details: {
    'Dwelling Coverage': formatCurrency(dwellingLimit),
    'Deductible': formatCurrency(deductible),
    'Policy Type': policyType,
    'Additional Coverages': additionalCoverages.join(', ')
  },
  recommendations: extractedRecommendations
};

sendResultsToCommandCenter(2, 'Policy Analyzer', policyResults);
```

### Step 8: Estimate Review
```javascript
// After estimate review completes
const reviewResults = {
  summary: `Reviewed ${lineItemCount} line items. Found ${gapCount} potential gaps.`,
  details: {
    'Total Estimate': formatCurrency(estimateTotal),
    'Identified Gaps': formatCurrency(gapTotal),
    'Potential Recovery': formatCurrency(recoveryAmount)
  },
  recommendations: identifiedGaps.map(gap => gap.description)
};

sendResultsToCommandCenter(8, 'Estimate Review Tool', reviewResults);
```

### Step 11: Supplement Letter Generator
```javascript
// After letter is generated
const letterResults = {
  summary: `Generated supplement letter with ${itemCount} items totaling ${formatCurrency(supplementAmount)}.`,
  details: {
    'Supplement Amount': formatCurrency(supplementAmount),
    'Line Items': itemCount,
    'Letter Length': `${wordCount} words`,
    'Tone': selectedTone
  },
  recommendations: [
    'Review the letter carefully before sending',
    'Include all supporting documentation',
    'Send via certified mail for proof of delivery'
  ]
};

sendResultsToCommandCenter(11, 'Supplement Letter Generator', letterResults);
```

## Activity Tracking

The command center automatically tracks:
- ✅ Tool opens (when user clicks "Open [Tool Name] →")
- ✅ Tool results received (when tool sends postMessage)
- ✅ Step navigation (goToStep, sidebar clicks)
- ✅ Step expand/collapse
- ✅ Phase expand/collapse
- ✅ Nav pill clicks (Claim Snapshot, Financial Summary, Activity Log, etc.)

All tracked activities appear in the Activity Log panel.

## Results Display

When a tool sends results:
1. The results container for that step becomes visible
2. Results are formatted based on the structure provided
3. A green "✓ [Title] Complete" banner appears
4. User can close the results with the × button
5. Results persist until manually cleared or step is reset

## Implementation Checklist

For each tool file:

- [ ] Add `sendResultsToCommandCenter()` function
- [ ] Identify the completion point (when user clicks "Generate", "Analyze", "Submit", etc.)
- [ ] Structure results object with summary, details, and recommendations
- [ ] Call `sendResultsToCommandCenter(stepNum, toolName, results)` at completion
- [ ] Test by opening tool from command center and completing an action
- [ ] Verify results appear in the step card
- [ ] Verify activity is logged in Activity Log

## Security Notes

In production:
1. Replace `'*'` origin in `postMessage` with your actual domain
2. Validate `event.origin` in the message listener
3. Sanitize any user-generated content before displaying

## Testing

To test integration:
1. Open command center
2. Click "Open [Tool Name] →" for any step
3. Complete the tool action (generate, analyze, submit, etc.)
4. Return to command center
5. Verify results appear in green box below the tool link
6. Open Activity Log and verify both "Opened [Tool]" and "Received results from [Tool]" entries

## Example: Full Tool Integration

See `app/tools/policy-analyzer-working.html` for a complete working example.
