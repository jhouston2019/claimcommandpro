/**
 * Letter Generation Engine
 * Automatically generates recovery letters from analysis results
 */

import { ClaimAnalysisResult } from './claimAnalysisEngine'

export interface LetterData {
  claimNumber?: string
  adjusterName?: string
  carrierName: string
  policyholderName?: string
  propertyAddress?: string
  dateOfLoss?: string
}

export interface GeneratedLetter {
  subject: string
  body: string
  attachmentRecommendations: string[]
}

/**
 * Generate recovery letter from analysis
 */
export function generateRecoveryLetter(
  analysis: ClaimAnalysisResult,
  letterData: LetterData
): GeneratedLetter {
  
  const {
    claimNumber = '[CLAIM NUMBER]',
    adjusterName = '[ADJUSTER NAME]',
    carrierName,
    policyholderName = '[YOUR NAME]',
    propertyAddress = '[PROPERTY ADDRESS]',
    dateOfLoss = '[DATE OF LOSS]'
  } = letterData
  
  const { gapAmount, coverageIssues, estimateIssues, missingScope } = analysis
  
  // Build letter sections
  const coverageSection = buildCoverageSection(coverageIssues)
  const estimateSection = buildEstimateSection(estimateIssues, missingScope)
  const documentationSection = buildDocumentationSection(analysis)
  
  const subject = `Request for Claim Review and Supplement - Claim #${claimNumber}`
  
  const body = `${adjusterName}
${carrierName}

RE: Claim #${claimNumber}
Property: ${propertyAddress}
Date of Loss: ${dateOfLoss}

Dear ${adjusterName},

I am writing to formally request a comprehensive review and supplement of the estimate provided for the above-referenced claim. After careful analysis of the estimate, I have identified significant discrepancies and omissions that do not reflect the full scope and cost required to properly restore the property to its pre-loss condition.

SUMMARY OF DISCREPANCIES

The current estimate does not account for necessary repairs, applicable coverage provisions, and market-rate pricing. The total estimated difference is approximately $${gapAmount.toLocaleString()}.

${coverageSection}

${estimateSection}

${documentationSection}

REQUEST FOR ACTION

I respectfully request the following:

1. A comprehensive re-inspection of the property by a qualified adjuster
2. Revision of the estimate to include all missing scope items
3. Application of all applicable coverage provisions under the policy
4. Adjustment of pricing to reflect current market rates
5. Issuance of a supplemental payment to cover the identified discrepancies

POLICY RIGHTS

Please be advised that I am aware of my rights under the insurance policy, including:

• The right to a full and fair settlement
• The right to dispute inadequate estimates
• The right to hire independent contractors and experts
• The right to appraisal if we cannot reach an agreement

I believe this claim can be resolved amicably through a thorough review of the estimate and application of the policy provisions. I am prepared to provide additional documentation, contractor estimates, or expert opinions as needed to support this request.

I request a written response within 15 business days outlining your plan to address these discrepancies. If you require additional information or wish to schedule a re-inspection, please contact me at your earliest convenience.

Thank you for your prompt attention to this matter.

Sincerely,

${policyholderName}

---

ENCLOSURES:
• Detailed scope discrepancy list
• Market rate comparison documentation
• Contractor estimate (if available)
• Photographic evidence
• Policy coverage provisions reference`

  const attachmentRecommendations = [
    'Copy of insurance policy (declarations page)',
    'Original estimate from insurance carrier',
    'Independent contractor estimate',
    'Photographs of all damage',
    'Market rate documentation for materials and labor',
    'Code requirement documentation (if applicable)',
    'Previous correspondence with adjuster',
    'Proof of Loss statement (if filed)'
  ]
  
  return {
    subject,
    body,
    attachmentRecommendations
  }
}

/**
 * Build coverage issues section
 */
function buildCoverageSection(coverageIssues: any[]): string {
  if (coverageIssues.length === 0) {
    return ''
  }
  
  let section = `COVERAGE PROVISIONS NOT APPLIED\n\n`
  section += `The estimate fails to apply the following coverage provisions that are applicable under the policy:\n\n`
  
  for (const issue of coverageIssues) {
    section += `• ${issue.type}: ${issue.description}\n`
    section += `  Estimated Value: $${issue.estimatedValue.toLocaleString()}\n\n`
  }
  
  return section
}

/**
 * Build estimate issues section
 */
function buildEstimateSection(estimateIssues: any[], missingScope: string[]): string {
  let section = `ESTIMATE DISCREPANCIES\n\n`
  
  // Missing scope items
  if (missingScope.length > 0) {
    section += `Missing Scope Items:\n\n`
    section += `The following necessary items are not included in the estimate:\n\n`
    
    for (const item of missingScope) {
      section += `• ${item}\n`
    }
    section += `\n`
  }
  
  // Pricing issues
  const pricingIssues = estimateIssues.filter(i => i.type === 'Underpriced Materials')
  if (pricingIssues.length > 0) {
    section += `Pricing Discrepancies:\n\n`
    section += `The following line items are priced below current market rates:\n\n`
    
    for (const issue of pricingIssues) {
      section += `• ${issue.description}\n`
      section += `  Difference: $${issue.difference.toLocaleString()}\n\n`
    }
  }
  
  // Other estimate issues
  const otherIssues = estimateIssues.filter(i => i.type === 'Missing Scope')
  if (otherIssues.length > 0) {
    section += `Additional Scope Omissions:\n\n`
    
    for (const issue of otherIssues) {
      section += `• ${issue.description}\n`
      section += `  Estimated Cost: $${issue.difference.toLocaleString()}\n\n`
    }
  }
  
  return section
}

/**
 * Build documentation section
 */
function buildDocumentationSection(analysis: ClaimAnalysisResult): string {
  let section = `SUPPORTING DOCUMENTATION\n\n`
  
  section += `I have obtained independent contractor estimates and market rate documentation that support the above discrepancies. `
  section += `The analysis shows:\n\n`
  
  section += `• Total Estimate Amount: $${analysis.totalPaid.toLocaleString()}\n`
  section += `• Actual Repair Cost: $${analysis.totalActual.toLocaleString()}\n`
  section += `• Identified Gap: $${analysis.gapAmount.toLocaleString()}\n`
  section += `• Coverage Issues Identified: ${analysis.coverageIssues.length}\n`
  section += `• Estimate Discrepancies: ${analysis.estimateIssues.length}\n`
  section += `• Confidence Level: ${analysis.confidence.toUpperCase()}\n\n`
  
  // Carrier pattern note
  if (analysis.carrierPatterns) {
    section += `CARRIER PATTERN ANALYSIS\n\n`
    section += `Based on historical claim data, ${analysis.carrierPatterns.carrier} has demonstrated patterns of:\n\n`
    
    for (const risk of analysis.carrierPatterns.risks) {
      section += `• ${risk}\n`
    }
    
    section += `\nAverage underpayment pattern: $${analysis.carrierPatterns.avgUnderpayment.toLocaleString()}\n\n`
    section += `This analysis is consistent with these documented patterns.\n\n`
  }
  
  return section
}

/**
 * Generate supplement request letter
 */
export function generateSupplementLetter(
  analysis: ClaimAnalysisResult,
  letterData: LetterData,
  supplementReason: string
): GeneratedLetter {
  
  const {
    claimNumber = '[CLAIM NUMBER]',
    adjusterName = '[ADJUSTER NAME]',
    carrierName,
    policyholderName = '[YOUR NAME]'
  } = letterData
  
  const subject = `Supplement Request - Claim #${claimNumber}`
  
  const body = `${adjusterName}
${carrierName}

RE: Supplement Request - Claim #${claimNumber}

Dear ${adjusterName},

I am writing to request a supplement to the original estimate for the above-referenced claim.

REASON FOR SUPPLEMENT

${supplementReason}

During the repair process, additional damage and necessary repairs have been identified that were not included in the original estimate. The total estimated cost for these additional items is approximately $${analysis.gapAmount.toLocaleString()}.

ADDITIONAL ITEMS REQUIRED

${buildEstimateSection(analysis.estimateIssues, analysis.missingScope)}

I request that you schedule a re-inspection at your earliest convenience to review these additional items and issue a supplemental payment.

Please contact me to arrange the inspection.

Sincerely,

${policyholderName}`

  return {
    subject,
    body,
    attachmentRecommendations: [
      'Photographs of additional damage',
      'Contractor documentation',
      'Original estimate for reference'
    ]
  }
}

/**
 * Generate dispute letter
 */
export function generateDisputeLetter(
  analysis: ClaimAnalysisResult,
  letterData: LetterData,
  specificDisputes: string[]
): GeneratedLetter {
  
  const {
    claimNumber = '[CLAIM NUMBER]',
    adjusterName = '[ADJUSTER NAME]',
    carrierName,
    policyholderName = '[YOUR NAME]'
  } = letterData
  
  const subject = `Formal Dispute - Claim #${claimNumber}`
  
  const body = `${adjusterName}
${carrierName}

RE: Formal Dispute of Estimate - Claim #${claimNumber}

Dear ${adjusterName},

I am writing to formally dispute the estimate provided for the above-referenced claim. The estimate is inadequate and does not reflect the true cost of repairs necessary to restore the property.

DISPUTED ITEMS

${specificDisputes.map(d => `• ${d}`).join('\n')}

TOTAL DISPUTED AMOUNT: $${analysis.gapAmount.toLocaleString()}

${buildCoverageSection(analysis.coverageIssues)}

${buildEstimateSection(analysis.estimateIssues, analysis.missingScope)}

I request an immediate review and revision of this estimate. If we cannot reach an agreement, I am prepared to invoke the appraisal clause in the policy.

Please respond within 10 business days.

Sincerely,

${policyholderName}`

  return {
    subject,
    body,
    attachmentRecommendations: [
      'Independent contractor estimate',
      'Market rate documentation',
      'Policy provisions reference',
      'Photographic evidence'
    ]
  }
}

/**
 * Generate appraisal demand letter
 */
export function generateAppraisalLetter(
  analysis: ClaimAnalysisResult,
  letterData: LetterData
): GeneratedLetter {
  
  const {
    claimNumber = '[CLAIM NUMBER]',
    carrierName,
    policyholderName = '[YOUR NAME]'
  } = letterData
  
  const subject = `Demand for Appraisal - Claim #${claimNumber}`
  
  const body = `${carrierName}
Claims Department

RE: Demand for Appraisal - Claim #${claimNumber}

To Whom It May Concern,

This letter serves as formal notice of my demand for appraisal under the policy provisions.

After multiple attempts to resolve the valuation dispute regarding this claim, we have been unable to reach an agreement on the amount of loss. The difference between your estimate and the actual cost of repairs is $${analysis.gapAmount.toLocaleString()}.

Pursuant to the appraisal clause in the insurance policy, I hereby demand that this dispute be resolved through the appraisal process.

I have selected [APPRAISER NAME] as my appraiser. Please provide the name and contact information for your appraiser within 20 days of receipt of this letter.

The appraisers will then select a competent and impartial umpire. If they cannot agree on an umpire within 15 days, either party may request that a judge select an umpire.

Please acknowledge receipt of this demand and provide your appraiser information promptly.

Sincerely,

${policyholderName}

CC: State Insurance Commissioner`

  return {
    subject,
    body,
    attachmentRecommendations: [
      'Copy of insurance policy (appraisal clause)',
      'All previous correspondence',
      'Independent contractor estimate',
      'Documentation of valuation dispute'
    ]
  }
}

/**
 * Format letter for download
 */
export function formatLetterForDownload(letter: GeneratedLetter, date: Date = new Date()): string {
  const dateStr = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  return `${dateStr}

${letter.body}

---

RECOMMENDED ATTACHMENTS:

${letter.attachmentRecommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}`
}
