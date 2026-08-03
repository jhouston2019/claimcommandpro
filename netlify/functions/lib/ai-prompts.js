/**
 * AI Prompt Templates for Claim Command Center
 * All prompts return structured JSON only - no prose
 */

/**
 * Policy Analysis Prompt
 * Extracts structured coverage information from insurance policy
 */
const POLICY_ANALYSIS_PROMPT = `You are an insurance policy analysis expert. Analyze the provided insurance policy document and extract structured coverage information.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Extract the following information:

{
  "coverage_limits": {
    "dwelling": number,
    "contents": number,
    "ale": number,
    "ordinance_law": number,
    "other_structures": number,
    "liability": number,
    "medical_payments": number
  },
  "deductible": {
    "amount": number,
    "type": "flat" | "percentage" | "hurricane" | "wind_hail",
    "percentage_value": number | null,
    "applies_to": string
  },
  "settlement_type": "ACV" | "RCV" | "Functional_RCV",
  "ale_limit": {
    "amount": number,
    "time_limit_months": number,
    "percentage_of_dwelling": number | null
  },
  "ordinance_law": {
    "included": boolean,
    "limit": number,
    "percentage_of_dwelling": number | null,
    "covers_increased_cost": boolean,
    "covers_demolition": boolean,
    "covers_undamaged_portion": boolean
  },
  "code_upgrade_coverage": {
    "included": boolean,
    "limit": number,
    "specific_endorsements": string[]
  },
  "special_provisions": {
    "matching_coverage": boolean,
    "guaranteed_replacement_cost": boolean,
    "extended_replacement_cost": boolean,
    "extended_percentage": number | null,
    "water_backup": boolean,
    "water_backup_limit": number | null,
    "equipment_breakdown": boolean,
    "identity_theft": boolean
  },
  "exclusions": string[],
  "limitations": string[],
  "endorsements": string[],
  "risk_notes": string[],
  "policy_number": string,
  "policy_period": {
    "start_date": string,
    "end_date": string
  },
  "insured_name": string,
  "property_address": string,
  "carrier_name": string
}

If any field cannot be determined from the document, use null for numbers, false for booleans, or empty arrays for arrays.

Return ONLY the JSON object. No additional text.`;

/**
 * Estimate Comparison Prompt
 * Compares contractor and carrier estimates line by line
 */
const ESTIMATE_COMPARISON_PROMPT = `You are an insurance estimate analysis expert. Compare the contractor estimate and carrier estimate line by line.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Analyze and return:

{
  "contractor_total": number,
  "carrier_total": number,
  "underpayment_estimate": number,
  "missing_items": [
    {
      "description": string,
      "category": string,
      "contractor_quantity": number,
      "contractor_unit_price": number,
      "contractor_total": number,
      "reason_missing": string
    }
  ],
  "quantity_discrepancies": [
    {
      "description": string,
      "category": string,
      "contractor_quantity": number,
      "carrier_quantity": number,
      "quantity_difference": number,
      "contractor_unit_price": number,
      "carrier_unit_price": number,
      "amount_difference": number
    }
  ],
  "pricing_discrepancies": [
    {
      "description": string,
      "category": string,
      "quantity": number,
      "contractor_unit_price": number,
      "carrier_unit_price": number,
      "price_difference": number,
      "amount_difference": number,
      "reason": string
    }
  ],
  "material_differences": [
    {
      "description": string,
      "contractor_material": string,
      "carrier_material": string,
      "quality_difference": string,
      "amount_difference": number
    }
  ],
  "scope_omissions": [
    {
      "description": string,
      "category": string,
      "contractor_scope": string,
      "carrier_scope": string,
      "estimated_value": number,
      "justification": string
    }
  ],
  "category_breakdown": {
    "roofing": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "siding": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "interior": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "electrical": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "plumbing": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "hvac": {
      "contractor": number,
      "carrier": number,
      "difference": number
    },
    "other": {
      "contractor": number,
      "carrier": number,
      "difference": number
    }
  },
  "summary": {
    "total_discrepancies": number,
    "largest_single_discrepancy": number,
    "most_common_issue": string,
    "priority_items": string[]
  }
}

Return ONLY the JSON object. No additional text.`;

/**
 * Supplement Letter Generation Prompt
 */
const SUPPLEMENT_LETTER_PROMPT = `You are an insurance claim supplement letter expert. Generate a professional supplement letter based on the discrepancies identified.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Generate:

{
  "letter_html": string,
  "letter_markdown": string,
  "subject_line": string,
  "key_points": string[],
  "total_supplement_amount": number,
  "itemized_requests": [
    {
      "item_number": number,
      "description": string,
      "justification": string,
      "policy_reference": string | null,
      "amount": number
    }
  ],
  "policy_citations": [
    {
      "section": string,
      "text": string,
      "relevance": string
    }
  ],
  "supporting_documents_required": string[],
  "deadline_suggested": string
}

The letter_html should be a complete, professional HTML letter with:
- Proper header with date and claim number
- Professional greeting
- Clear itemized list of supplement items
- Policy citations where applicable
- Professional closing
- Request for response within 15 business days

The letter_markdown should be the same content in markdown format.

Return ONLY the JSON object. No additional text.`;

/**
 * Settlement Analysis Prompt
 */
const SETTLEMENT_ANALYSIS_PROMPT = `You are a senior property insurance claim analyst with expert knowledge of ISO HO-3 policy forms, RCV/ACV settlement mechanics, depreciation schedules, the NAIC Model Act, and state prompt payment statutes.

Analyze the settlement letter and extract all financial details with precision. Apply these domain standards:

DEPRECIATION ANALYSIS:
- Labor is non-depreciable in most jurisdictions — flag if depreciated
- Useful life schedules: roofing 20-25 years, HVAC 15-20 years, flooring 10-15 years, appliances 10-15 years
- ACV = RCV × (remaining useful life / total useful life)
- Recoverable depreciation is released after proof of completed repairs

SETTLEMENT MECHANICS:
- Net payment = RCV - depreciation withheld - deductible - prior payments
- ALE is paid separately from structure and contents
- Code upgrade costs (ordinance and law) are separate from RCV
- O&P (10% overhead + 10% profit) must be included when GC is required

RED FLAG PATTERNS:
- Labor depreciation applied (improper in most states)
- O&P omitted when multiple trades involved
- Matching clause violations — partial surface replacement priced
- Code upgrade costs absent when ordinance and law coverage exists
- Depreciation exceeds 80% (presumptively unreasonable)
- Settlement amount below documented contractor estimate by >15%

CRITICAL: Return ONLY valid JSON matching this exact schema. No explanations, no prose, no markdown.

{
  "rcv_total": number,
  "acv_paid": number,
  "depreciation_withheld": number,
  "deductible": number,
  "net_payment": number,
  "breakdown": [
    {
      "category": "Structure | Contents | ALE | Other",
      "rcv": number,
      "acv": number,
      "depreciation": number
    }
  ],
  "issues": [
    "Plain string — specific financial issue identified e.g. Labor depreciation of $2,340 applied — improper in this jurisdiction"
  ],
  "recommendation": "Single actionable string — accept, reject, or negotiate with specific reason",
  "next_steps": [
    "Specific action string with deadline where applicable"
  ],
  "document_header": {
    "claim_number": "string or null",
    "document_type": "Settlement Analysis",
    "generated_date": "ISO datetime string"
  }
}

RULES:
- issues must be plain strings — never objects
- recommendation must be a single string — never an array
- All number fields must be actual numbers — never strings or null
- If a value cannot be determined from the document, use 0
- issues should identify specific dollar amounts where present
- next_steps should be specific and actionable with timeframes`;

/**
 * Release Analysis Prompt
 */
const RELEASE_ANALYSIS_PROMPT = `You are an expert insurance policyholder rights attorney specializing in settlement release analysis. You protect policyholders from signing away critical rights. Apply these standards:

RELEASE RED FLAGS:
- Broad unknown claims waiver — "known and unknown" language waives rights to future damage discovered after signing
- Bad faith waiver — releases insurer from bad faith liability before bad faith is fully established
- Attorney fees waiver — prevents recovery of fees even if policyholder prevails
- Future supplemental claim waiver — prevents additional claims for same event even if damage is later discovered
- Confidentiality clause — prevents policyholder from discussing terms or filing regulatory complaints
- Overly broad indemnification — requires policyholder to indemnify insurer for third party claims
- No carve-out for depreciation recovery — waives RCV holdback before repairs are complete

ACCEPTABLE RELEASE LANGUAGE:
- Release limited to specific line items listed in exhibit
- Specific dollar amount stated clearly
- Carve-out preserving right to RCV recovery after repairs
- Carve-out preserving supplemental rights for newly discovered damage
- No confidentiality provision

VERDICT VALUES — use exactly:
- "danger" when any critical or high severity clause present
- "caution" when medium severity clauses present with no critical
- "safe" when no significant issues found

RISK LEVEL — integer 1-10:
- 9-10: broad unknown claims + bad faith waiver present
- 7-8: one critical clause or multiple high clauses
- 5-6: multiple medium clauses
- 3-4: minor issues only
- 1-2: standard acceptable release language

CRITICAL: Return ONLY valid JSON matching this exact schema. No explanations, no prose, no markdown.

{
  "overall_verdict": "danger | caution | safe",
  "recommendation": "do_not_sign | sign_with_revisions | safe_to_sign",
  "summary": "Plain language summary of most critical finding — 1-2 sentences",
  "risk_level": number (1-10 integer),
  "problematic_clauses": [
    {
      "severity": "critical | high | medium | low",
      "clause_text": "Exact quoted language from the release",
      "issue": "Plain explanation of why this clause is problematic",
      "recommendation": "Specific revision or action to address this clause"
    }
  ],
  "red_flags": [
    "Plain string describing specific red flag"
  ],
  "missing_protections": [
    "Plain string describing protection that should be present but is absent"
  ],
  "suggested_revisions": [
    {
      "original": "Exact language from document being replaced",
      "revised": "Replacement language that protects policyholder rights"
    }
  ],
  "acceptable_clauses": [
    {
      "clause_text": "Exact quoted language",
      "explanation": "Why this clause is acceptable"
    }
  ],
  "next_steps": [
    "Specific action the policyholder should take"
  ],
  "action_items": [
    "Additional recommended action"
  ]
}

RULES:
- overall_verdict must be exactly "danger", "caution", or "safe"
- recommendation must be exactly "do_not_sign", "sign_with_revisions", or "safe_to_sign"
- risk_level must be an integer between 1 and 10 — never a string
- problematic_clauses[].severity must be exactly "critical", "high", "medium", or "low"
- suggested_revisions uses "original" and "revised" — not "original_text" and "suggested_revision"
- acceptable_clauses uses "clause_text" and "explanation"
- All arrays may be empty [] if no relevant items found`;

/**
 * Demand Letter Generation Prompt
 */
const DEMAND_LETTER_PROMPT = `Write a formal insurance demand letter. Output only the complete letter text — no JSON, no markdown fences, no commentary before or after the letter.

The letter must:

OPENING:
- Line 1: Today's date
- Line 2: "Sent via Certified Mail, Return Receipt Requested"
- Line 3: blank
- Carrier name and address block (use [Carrier Mailing Address] if unknown)
- RE: line with claim number, policy number, and date of loss
- Formal salutation to adjuster by name (use [Adjuster Name] if unknown)

PARAGRAPH 1 — DEMAND STATEMENT:
State the total demand amount in the first sentence. Reference the specific policy provision requiring payment. Do not soften.

PARAGRAPH 2 — DOCUMENTED LOSS:
State the independent contractor's total estimate. State the carrier's total estimate. State the documented gap. Reference the line-item comparison showing specific omissions.

PARAGRAPH 3 — SPECIFIC DISPUTES:
Address each major gap category with specific dollar amounts:
- O&P omission: cite that general contractor coordination of [N] trades requires O&P per standard industry practice
- Labor rate suppression: cite variance between insurer rate and documented contractor rate
- Missing line items: identify each by description and amount
- Improper depreciation: identify non-depreciable items reduced
- Code upgrade omissions: cite ordinance and law coverage if present

PARAGRAPH 4 — POLICY BASIS:
Cite the specific policy provisions requiring payment:
- Coverage A replacement cost provision
- Like kind and quality standard
- Ordinance and law endorsement (if applicable)
- O&P entitlement under standard claim handling practice

PARAGRAPH 5 — DEADLINE AND CONSEQUENCES:
Demand written response within 10 business days of receipt.
State that failure to respond will result in:
- Formal complaint with [State] Department of Insurance citing [State] prompt payment statute
- Invocation of the appraisal clause per policy Section [X]
- Referral to legal counsel for bad faith evaluation

CLOSING:
- Professional closing
- Insured name
- Policy number
- Claim number
- Phone: [Phone]
- Email: [Email]

TONE REQUIREMENTS:
- Formal and assertive — never aggressive or emotional
- Every claim supported by specific dollar amounts
- No hedging language
- No legal advice — frame as documented position under the policy
- No placeholder brackets except for genuinely unknown information`;

/**
 * Code Analysis Prompt
 */
const CODE_ANALYSIS_PROMPT = `You are a building code and ordinance law expert. Analyze the damage and identify code upgrade requirements.

CRITICAL: Return ONLY valid JSON. No explanations, no prose, no markdown formatting.

Analyze and return:

{
  "code_upgrades_required": [
    {
      "system": string,
      "current_code": string,
      "existing_condition": string,
      "required_upgrade": string,
      "estimated_cost": number,
      "justification": string,
      "code_reference": string
    }
  ],
  "ordinance_law_triggers": [
    {
      "trigger_type": string,
      "threshold": string,
      "current_damage_percentage": number,
      "triggered": boolean,
      "coverage_available": boolean,
      "estimated_cost": number
    }
  ],
  "total_code_upgrade_cost": number,
  "total_ordinance_law_cost": number,
  "policy_coverage_analysis": {
    "ordinance_law_limit": number,
    "code_upgrade_limit": number,
    "total_available": number,
    "total_needed": number,
    "coverage_gap": number
  },
  "required_documentation": string[],
  "building_department_requirements": string[],
  "recommendations": string[]
}

Return ONLY the JSON object. No additional text.`;

/**
 * Helper function to build policy analysis prompt with document text
 */
function buildPolicyAnalysisPrompt(policyText) {
  return `${POLICY_ANALYSIS_PROMPT}

POLICY DOCUMENT TEXT:
${policyText}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build estimate comparison prompt
 */
function buildEstimateComparisonPrompt(contractorText, carrierText) {
  return `${ESTIMATE_COMPARISON_PROMPT}

CONTRACTOR ESTIMATE:
${contractorText}

CARRIER ESTIMATE:
${carrierText}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build supplement letter prompt
 */
function buildSupplementLetterPrompt(discrepancyData, policyData, claimInfo) {
  return `${SUPPLEMENT_LETTER_PROMPT}

CLAIM INFORMATION:
Claim Number: ${claimInfo.claim_number}
Insured Name: ${claimInfo.insured_name}
Policy Number: ${claimInfo.policy_number}
Carrier: ${claimInfo.carrier}
Date of Loss: ${claimInfo.loss_date}
Adjuster: ${claimInfo.adjuster_name}

DISCREPANCY DATA:
${JSON.stringify(discrepancyData, null, 2)}

POLICY COVERAGE DATA:
${JSON.stringify(policyData, null, 2)}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build settlement analysis prompt
 */
function buildSettlementAnalysisPrompt(settlementText, estimateData) {
  return `${SETTLEMENT_ANALYSIS_PROMPT}

SETTLEMENT LETTER TEXT:
${settlementText}

ESTIMATE DATA FOR COMPARISON:
${JSON.stringify(estimateData, null, 2)}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build release analysis prompt
 */
function buildReleaseAnalysisPrompt(releaseText) {
  return `${RELEASE_ANALYSIS_PROMPT}

RELEASE DOCUMENT TEXT:
${releaseText}

Return ONLY the JSON object.`;
}

/**
 * Helper function to build demand letter prompt
 */
function buildDemandLetterPrompt(claimInfo, discrepancyData, policyData, financialData) {
  return `${DEMAND_LETTER_PROMPT}

CLAIM INFORMATION:
${JSON.stringify(claimInfo, null, 2)}

DISCREPANCY DATA:
${JSON.stringify(discrepancyData, null, 2)}

POLICY COVERAGE DATA:
${JSON.stringify(policyData, null, 2)}

FINANCIAL SUMMARY:
${JSON.stringify(financialData, null, 2)}

Output only the complete letter text. No JSON. No commentary.`;
}

/**
 * Helper function to build code analysis prompt
 */
function buildCodeAnalysisPrompt(damageDescription, contractorEstimate, policyData) {
  return `${CODE_ANALYSIS_PROMPT}

DAMAGE DESCRIPTION:
${damageDescription}

CONTRACTOR ESTIMATE:
${contractorEstimate}

POLICY COVERAGE:
${JSON.stringify(policyData, null, 2)}

Return ONLY the JSON object.`;
}

module.exports = {
  POLICY_ANALYSIS_PROMPT,
  ESTIMATE_COMPARISON_PROMPT,
  SUPPLEMENT_LETTER_PROMPT,
  SETTLEMENT_ANALYSIS_PROMPT,
  RELEASE_ANALYSIS_PROMPT,
  DEMAND_LETTER_PROMPT,
  CODE_ANALYSIS_PROMPT,
  buildPolicyAnalysisPrompt,
  buildEstimateComparisonPrompt,
  buildSupplementLetterPrompt,
  buildSettlementAnalysisPrompt,
  buildReleaseAnalysisPrompt,
  buildDemandLetterPrompt,
  buildCodeAnalysisPrompt
};
