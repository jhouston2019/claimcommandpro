/**
 * Claim Command Pro - 18-Step Claim Process
 * Defines all step titles and descriptions used throughout the application
 */

export interface ClaimStep {
  number: number
  title: string
  description: string
  phase: 'setup' | 'document' | 'analyze' | 'recover' | 'resolve'
}

export const CLAIM_STEPS: ClaimStep[] = [
  {
    number: 1,
    title: 'Enter Your Claim Details',
    description: 'Add your claim and policy details so we can analyze your estimate and identify what may be missing.',
    phase: 'setup'
  },
  {
    number: 2,
    title: 'See What Your Policy Covers',
    description: 'Understand exactly what your policy includes — including coverage your insurer may not point out.',
    phase: 'setup'
  },
  {
    number: 3,
    title: 'Set Up Your Claim the Right Way',
    description: 'Make sure your claim is structured correctly from the start.',
    phase: 'setup'
  },
  {
    number: 4,
    title: 'Document All Damage',
    description: 'Capture everything — missed damage means missed money.',
    phase: 'document'
  },
  {
    number: 5,
    title: 'Get Accurate Repair Estimates',
    description: 'Use real-world pricing so your claim reflects actual repair costs.',
    phase: 'document'
  },
  {
    number: 6,
    title: 'Prepare for the Adjuster Inspection',
    description: 'Make sure nothing is overlooked or minimized.',
    phase: 'document'
  },
  {
    number: 7,
    title: 'List Everything You Lost',
    description: 'Account for all contents and items.',
    phase: 'document'
  },
  {
    number: 8,
    title: 'Review Your Insurance Estimate',
    description: 'See exactly what your insurer included — and what they didn\'t.',
    phase: 'analyze'
  },
  {
    number: 9,
    title: 'Find Underpaid Items',
    description: 'Identify where pricing is below market.',
    phase: 'analyze'
  },
  {
    number: 10,
    title: 'Find Missing Coverage',
    description: 'Uncover policy benefits that were not applied.',
    phase: 'analyze'
  },
  {
    number: 11,
    title: 'Request Additional Payment',
    description: 'Submit a supplement for missed or underpaid items.',
    phase: 'recover'
  },
  {
    number: 12,
    title: 'Send Claim Letters',
    description: 'Use clear communication your insurer will respond to.',
    phase: 'recover'
  },
  {
    number: 13,
    title: 'Recover Depreciation',
    description: 'Claim withheld funds from your initial payment.',
    phase: 'recover'
  },
  {
    number: 14,
    title: 'Negotiate Your Settlement',
    description: 'Push your claim to the correct value.',
    phase: 'resolve'
  },
  {
    number: 15,
    title: 'Escalate If Needed',
    description: 'Use appraisal or mediation if required.',
    phase: 'resolve'
  },
  {
    number: 16,
    title: 'Finalize Your Claim',
    description: 'Make sure nothing is left unclaimed.',
    phase: 'resolve'
  },
  {
    number: 17,
    title: 'Confirm All Payments',
    description: 'Verify every dollar owed has been paid.',
    phase: 'resolve'
  },
  {
    number: 18,
    title: 'Close Your Claim',
    description: 'Finish your claim knowing it was handled correctly.',
    phase: 'resolve'
  }
]

export const PHASE_NAMES = {
  setup: 'Set Up Your Claim',
  document: 'Document Your Damage',
  analyze: 'Find What\'s Missing',
  recover: 'Request the Money',
  resolve: 'Finish & Get Paid'
}

export const getStepsByPhase = (phase: keyof typeof PHASE_NAMES) => {
  return CLAIM_STEPS.filter(step => step.phase === phase)
}

export const getStepByNumber = (stepNumber: number) => {
  return CLAIM_STEPS.find(step => step.number === stepNumber)
}

export const getStepTitle = (stepNumber: number) => {
  return CLAIM_STEPS.find(step => step.number === stepNumber)?.title || `Step ${stepNumber}`
}

export const getStepDescription = (stepNumber: number) => {
  return CLAIM_STEPS.find(step => step.number === stepNumber)?.description || ''
}
