/**
 * Claim Analysis Engine
 * Core intelligence system for detecting missing claim value
 */

export interface LineItem {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
  category: string
}

export interface CoverageIssue {
  type: string
  description: string
  estimatedValue: number
  confidence: 'low' | 'medium' | 'high'
}

export interface EstimateIssue {
  type: string
  description: string
  difference: number
  lineItem?: string
}

export interface CategoryBreakdown {
  category: string
  paid: number
  actual: number
  missing: number
}

export interface CarrierPatterns {
  carrier: string
  risks: string[]
  avgUnderpayment: number
  laborSuppressionRate: number
  opOmissionRate: number
}

export interface ClaimAnalysisResult {
  gapAmount: number
  confidence: 'low' | 'medium' | 'high'
  coverageIssues: CoverageIssue[]
  estimateIssues: EstimateIssue[]
  breakdown: CategoryBreakdown[]
  carrierPatterns: CarrierPatterns
  missingScope: string[]
  totalPaid: number
  totalActual: number
}

// Market rate database (regional averages)
const MARKET_RATES: Record<string, number> = {
  // Roofing materials (per square)
  'shingle_architectural': 95,
  'shingle_3tab': 75,
  'underlayment_synthetic': 85,
  'underlayment_felt': 45,
  'ice_water_shield': 125,
  'drip_edge': 3.5,
  'flashing': 12,
  'ridge_cap': 8.5,
  'starter_strip': 4.2,
  'valley_metal': 15,
  
  // Labor rates (per square or per LF)
  'labor_tear_off': 65,
  'labor_install_shingles': 85,
  'labor_install_underlayment': 35,
  'labor_flashing': 45,
  
  // Interior (per SF)
  'drywall_half_inch': 2.8,
  'paint_interior': 3.5,
  'flooring_laminate': 6.5,
  'flooring_carpet': 5.2,
  
  // Exterior
  'siding_vinyl': 8.5,
  'siding_hardie': 12.5,
  'paint_exterior': 4.2,
}

// Required scope items by claim type
const REQUIRED_SCOPE: Record<string, string[]> = {
  'roof': [
    'drip edge',
    'flashing',
    'starter course',
    'ice and water shield',
    'underlayment',
    'ridge cap',
    'valley metal'
  ],
  'interior': [
    'primer',
    'paint (2 coats)',
    'texture matching',
    'trim work'
  ],
  'exterior': [
    'house wrap',
    'flashing',
    'caulking',
    'primer',
    'finish coat'
  ]
}

// Carrier behavior patterns (based on historical data)
const CARRIER_PATTERNS: Record<string, CarrierPatterns> = {
  'state farm': {
    carrier: 'State Farm',
    risks: ['labor suppression', 'O&P omission', 'scope reduction'],
    avgUnderpayment: 11200,
    laborSuppressionRate: 0.31,
    opOmissionRate: 0.42
  },
  'allstate': {
    carrier: 'Allstate',
    risks: ['material pricing', 'labor suppression', 'depreciation abuse'],
    avgUnderpayment: 9800,
    laborSuppressionRate: 0.28,
    opOmissionRate: 0.38
  },
  'farmers': {
    carrier: 'Farmers',
    risks: ['scope omission', 'O&P omission', 'code upgrade denial'],
    avgUnderpayment: 10500,
    laborSuppressionRate: 0.25,
    opOmissionRate: 0.35
  },
  'liberty mutual': {
    carrier: 'Liberty Mutual',
    risks: ['labor suppression', 'material pricing', 'scope reduction'],
    avgUnderpayment: 8900,
    laborSuppressionRate: 0.22,
    opOmissionRate: 0.30
  },
  'usaa': {
    carrier: 'USAA',
    risks: ['depreciation abuse', 'scope omission'],
    avgUnderpayment: 7200,
    laborSuppressionRate: 0.18,
    opOmissionRate: 0.25
  }
}

/**
 * Main analysis function
 */
export function analyzeClaim(
  lineItems: LineItem[],
  carrier: string,
  claimType: string,
  propertyInfo?: {
    squareFootage?: number
    stories?: number
    age?: number
  }
): ClaimAnalysisResult {
  
  const coverageIssues: CoverageIssue[] = []
  const estimateIssues: EstimateIssue[] = []
  const breakdown: CategoryBreakdown[] = []
  const missingScope: string[] = []
  
  let totalPaid = 0
  let totalActual = 0
  
  // 1. UNDERPRICING DETECTION
  const pricingGaps = detectUnderpricing(lineItems)
  estimateIssues.push(...pricingGaps.issues)
  totalPaid += pricingGaps.paid
  totalActual += pricingGaps.actual
  
  // 2. MISSING SCOPE DETECTION
  const scopeGaps = detectMissingScope(lineItems, claimType)
  missingScope.push(...scopeGaps.missing)
  estimateIssues.push(...scopeGaps.issues)
  totalActual += scopeGaps.estimatedValue
  
  // 3. COVERAGE DETECTION
  const coverageGaps = detectCoverageIssues(lineItems, propertyInfo)
  coverageIssues.push(...coverageGaps.issues)
  totalActual += coverageGaps.estimatedValue
  
  // 4. CATEGORY BREAKDOWN
  breakdown.push(...calculateBreakdown(lineItems, totalActual - totalPaid))
  
  // 5. CARRIER PATTERNS
  const carrierPattern = getCarrierPattern(carrier)
  
  // 6. CALCULATE TOTAL GAP
  const gapAmount = Math.round(totalActual - totalPaid)
  
  // 7. CONFIDENCE CALCULATION
  const confidence = calculateConfidence(coverageIssues, estimateIssues, missingScope)
  
  return {
    gapAmount,
    confidence,
    coverageIssues,
    estimateIssues,
    breakdown,
    carrierPatterns: carrierPattern,
    missingScope,
    totalPaid,
    totalActual
  }
}

/**
 * Detect underpriced line items
 */
function detectUnderpricing(lineItems: LineItem[]): {
  issues: EstimateIssue[]
  paid: number
  actual: number
} {
  const issues: EstimateIssue[] = []
  let paid = 0
  let actual = 0
  
  for (const item of lineItems) {
    paid += item.total
    
    // Normalize description for matching
    const normalized = item.description.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
    
    // Try to match against market rates
    let marketRate = 0
    let rateKey = ''
    
    for (const [key, rate] of Object.entries(MARKET_RATES)) {
      const keyWords = key.split('_')
      if (keyWords.every(word => normalized.includes(word))) {
        marketRate = rate
        rateKey = key
        break
      }
    }
    
    if (marketRate > 0) {
      const marketTotal = marketRate * item.quantity
      actual += marketTotal
      
      // If item is underpriced by more than 15%
      if (item.unitPrice < marketRate * 0.85) {
        const difference = Math.round(marketTotal - item.total)
        issues.push({
          type: 'Underpriced Materials',
          description: `${item.description} priced at $${item.unitPrice.toFixed(2)} vs market rate $${marketRate.toFixed(2)}`,
          difference,
          lineItem: item.description
        })
      }
    } else {
      // If no market rate found, assume estimate is correct
      actual += item.total
    }
  }
  
  return { issues, paid, actual }
}

/**
 * Detect missing scope items
 */
function detectMissingScope(lineItems: LineItem[], claimType: string): {
  missing: string[]
  issues: EstimateIssue[]
  estimatedValue: number
} {
  const missing: string[] = []
  const issues: EstimateIssue[] = []
  let estimatedValue = 0
  
  const normalizedType = claimType.toLowerCase()
  let requiredItems: string[] = []
  
  // Determine required scope based on claim type
  if (normalizedType.includes('roof') || normalizedType.includes('hail')) {
    requiredItems = REQUIRED_SCOPE['roof']
  } else if (normalizedType.includes('interior') || normalizedType.includes('water')) {
    requiredItems = REQUIRED_SCOPE['interior']
  } else if (normalizedType.includes('siding') || normalizedType.includes('exterior')) {
    requiredItems = REQUIRED_SCOPE['exterior']
  }
  
  // Check each required item
  for (const requiredItem of requiredItems) {
    const found = lineItems.some(item => 
      item.description.toLowerCase().includes(requiredItem.toLowerCase())
    )
    
    if (!found) {
      missing.push(requiredItem)
      
      // Estimate value based on typical costs
      let estimatedCost = 0
      if (requiredItem.includes('drip edge')) estimatedCost = 800
      else if (requiredItem.includes('flashing')) estimatedCost = 1200
      else if (requiredItem.includes('starter')) estimatedCost = 650
      else if (requiredItem.includes('ice')) estimatedCost = 1500
      else if (requiredItem.includes('underlayment')) estimatedCost = 2200
      else if (requiredItem.includes('ridge')) estimatedCost = 900
      else if (requiredItem.includes('valley')) estimatedCost = 750
      else estimatedCost = 500
      
      estimatedValue += estimatedCost
      
      issues.push({
        type: 'Missing Scope',
        description: `${requiredItem} not included in estimate`,
        difference: estimatedCost,
        lineItem: requiredItem
      })
    }
  }
  
  return { missing, issues, estimatedValue }
}

/**
 * Detect coverage issues
 */
function detectCoverageIssues(
  lineItems: LineItem[],
  propertyInfo?: { squareFootage?: number; stories?: number; age?: number }
): {
  issues: CoverageIssue[]
  estimatedValue: number
} {
  const issues: CoverageIssue[] = []
  let estimatedValue = 0
  
  // Calculate total job size
  const totalJobCost = lineItems.reduce((sum, item) => sum + item.total, 0)
  
  // 1. O&P DETECTION
  // If job > $5000 and no O&P found
  const hasOP = lineItems.some(item => 
    item.description.toLowerCase().includes('overhead') ||
    item.description.toLowerCase().includes('profit') ||
    item.description.toLowerCase().includes('o&p')
  )
  
  if (!hasOP && totalJobCost > 5000) {
    const opValue = Math.round(totalJobCost * 0.20) // 20% O&P
    estimatedValue += opValue
    issues.push({
      type: 'O&P Missing',
      description: 'Overhead & Profit not applied to estimate',
      estimatedValue: opValue,
      confidence: 'high'
    })
  }
  
  // 2. ORDINANCE & LAW
  // If property age > 20 years
  if (propertyInfo?.age && propertyInfo.age > 20) {
    const olValue = Math.round(totalJobCost * 0.15) // 15% for code upgrades
    estimatedValue += olValue
    issues.push({
      type: 'Ordinance & Law',
      description: 'Code upgrade coverage not applied (property age > 20 years)',
      estimatedValue: olValue,
      confidence: 'medium'
    })
  }
  
  // 3. CODE UPGRADE
  const hasCodeUpgrade = lineItems.some(item =>
    item.description.toLowerCase().includes('code') ||
    item.description.toLowerCase().includes('upgrade')
  )
  
  if (!hasCodeUpgrade && totalJobCost > 10000) {
    const codeValue = 2500
    estimatedValue += codeValue
    issues.push({
      type: 'Code Upgrade',
      description: 'Code upgrade requirements not addressed',
      estimatedValue: codeValue,
      confidence: 'medium'
    })
  }
  
  // 4. ADDITIONAL LIVING EXPENSES (ALE)
  // If significant interior damage
  const hasInteriorDamage = lineItems.some(item =>
    item.category.toLowerCase().includes('interior') ||
    item.description.toLowerCase().includes('drywall') ||
    item.description.toLowerCase().includes('paint')
  )
  
  if (hasInteriorDamage && totalJobCost > 15000) {
    const aleValue = 3000
    estimatedValue += aleValue
    issues.push({
      type: 'Additional Living Expenses',
      description: 'ALE coverage may apply for temporary housing during repairs',
      estimatedValue: aleValue,
      confidence: 'low'
    })
  }
  
  return { issues, estimatedValue }
}

/**
 * Calculate category breakdown
 */
function calculateBreakdown(lineItems: LineItem[], totalGap: number): CategoryBreakdown[] {
  const categories = new Map<string, { paid: number; actual: number }>()
  
  // Group by category
  for (const item of lineItems) {
    const cat = item.category || 'Other'
    const existing = categories.get(cat) || { paid: 0, actual: 0 }
    existing.paid += item.total
    existing.actual += item.total // Will adjust with gaps
    categories.set(cat, existing)
  }
  
  // Distribute gap proportionally
  const totalPaid = Array.from(categories.values()).reduce((sum, cat) => sum + cat.paid, 0)
  
  const breakdown: CategoryBreakdown[] = []
  for (const [category, values] of categories.entries()) {
    const proportion = values.paid / totalPaid
    const categoryGap = Math.round(totalGap * proportion)
    
    breakdown.push({
      category,
      paid: Math.round(values.paid),
      actual: Math.round(values.paid + categoryGap),
      missing: categoryGap
    })
  }
  
  return breakdown
}

/**
 * Get carrier pattern
 */
function getCarrierPattern(carrier: string): CarrierPatterns {
  const normalized = carrier.toLowerCase().trim()
  
  return CARRIER_PATTERNS[normalized] || {
    carrier,
    risks: ['scope omission', 'pricing suppression'],
    avgUnderpayment: 9500,
    laborSuppressionRate: 0.25,
    opOmissionRate: 0.35
  }
}

/**
 * Calculate confidence level
 */
function calculateConfidence(
  coverageIssues: CoverageIssue[],
  estimateIssues: EstimateIssue[],
  missingScope: string[]
): 'low' | 'medium' | 'high' {
  const totalIssues = coverageIssues.length + estimateIssues.length + missingScope.length
  
  // High confidence: 5+ issues
  if (totalIssues >= 5) return 'high'
  
  // Medium confidence: 2-4 issues
  if (totalIssues >= 2) return 'medium'
  
  // Low confidence: 0-1 issues
  return 'low'
}

/**
 * Parse estimate from text/CSV
 */
export function parseEstimate(text: string): LineItem[] {
  const lines = text.split('\n').filter(line => line.trim())
  const items: LineItem[] = []
  
  for (const line of lines) {
    // Try CSV format: description,quantity,unit,unitPrice,total,category
    const parts = line.split(',').map(p => p.trim())
    
    if (parts.length >= 5) {
      items.push({
        description: parts[0],
        quantity: parseFloat(parts[1]) || 0,
        unit: parts[2] || 'EA',
        unitPrice: parseFloat(parts[3]) || 0,
        total: parseFloat(parts[4]) || 0,
        category: parts[5] || 'General'
      })
    }
  }
  
  return items
}

/**
 * Generate sample estimate for demo
 */
export function generateSampleEstimate(claimType: string = 'roof'): LineItem[] {
  if (claimType.toLowerCase().includes('roof')) {
    return [
      { description: 'Architectural Shingles', quantity: 25, unit: 'SQ', unitPrice: 75, total: 1875, category: 'Roofing' },
      { description: 'Synthetic Underlayment', quantity: 25, unit: 'SQ', unitPrice: 65, total: 1625, category: 'Roofing' },
      { description: 'Ice and Water Shield', quantity: 8, unit: 'SQ', unitPrice: 95, total: 760, category: 'Roofing' },
      { description: 'Ridge Cap Shingles', quantity: 40, unit: 'LF', unitPrice: 6.5, total: 260, category: 'Roofing' },
      { description: 'Tear Off Existing Roof', quantity: 25, unit: 'SQ', unitPrice: 50, total: 1250, category: 'Labor' },
      { description: 'Install New Shingles', quantity: 25, unit: 'SQ', unitPrice: 65, total: 1625, category: 'Labor' },
      { description: 'Dumpster and Disposal', quantity: 1, unit: 'EA', unitPrice: 450, total: 450, category: 'Other' }
    ]
  }
  
  return []
}
