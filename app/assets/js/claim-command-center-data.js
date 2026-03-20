/**
 * Claim Command Center - Data Integration Layer
 * Loads user claim data from Supabase and populates the UI
 */

async function loadClaimData(claimId) {
  try {
    const supabase = window.supabase || await window.getSupabaseClient();
    
    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      console.error('Not authenticated:', authError);
      return null;
    }

    const userId = session.user.id;

    // Load claim basic info
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .eq('user_id', userId)
      .single();

    if (claimError) {
      console.error('Error loading claim:', claimError);
      return null;
    }

    // Load financial summary
    const { data: financial, error: financialError } = await supabase
      .from('claim_financial_summary')
      .select('*')
      .eq('claim_id', claimId)
      .single();

    if (financialError && financialError.code !== 'PGRST116') {
      console.error('Error loading financial data:', financialError);
    }

    // Load policy coverage
    const { data: policy, error: policyError } = await supabase
      .from('claim_policy_coverage')
      .select('*')
      .eq('claim_id', claimId)
      .single();

    if (policyError && policyError.code !== 'PGRST116') {
      console.error('Error loading policy data:', policyError);
    }

    // Load step completion status
    const { data: steps, error: stepsError } = await supabase
      .from('claim_steps')
      .select('*')
      .eq('claim_id', claimId)
      .order('step_number', { ascending: true });

    if (stepsError) {
      console.error('Error loading steps:', stepsError);
    }

    // Calculate days since loss
    const daysSinceLoss = claim.loss_date 
      ? Math.floor((new Date() - new Date(claim.loss_date)) / (1000 * 60 * 60 * 24))
      : 0;

    // Calculate current step
    const completedSteps = steps?.filter(s => s.status === 'completed').length || 0;
    const currentStepNum = completedSteps + 1;

    return {
      claimNumber: claim.claim_number || 'CLM-PENDING',
      daysSinceLoss,
      status: claim.status || 'active',
      insurerName: claim.insurer_name || 'Insurance Company',
      adjusterName: claim.adjuster_name || 'Not Assigned',
      adjusterPhone: claim.adjuster_phone || '',
      adjusterEmail: claim.adjuster_email || '',
      
      // Financial data
      insuranceEstimate: financial?.carrier_total || 0,
      yourEstimate: financial?.contractor_total || 0,
      claimGap: financial?.underpayment_estimate || 0,
      
      // Policy data
      dwellingCoverage: policy?.dwelling_limit || null,
      deductible: policy?.deductible_amount || null,
      settlementType: policy?.settlement_type || null,
      
      // Step progress
      completedSteps: steps?.filter(s => s.status === 'completed').map(s => s.step_number) || [],
      currentStep: currentStepNum,
      steps: steps || []
    };
  } catch (error) {
    console.error('Error loading claim data:', error);
    return null;
  }
}

function formatCurrency(amount) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function populateUI(claimData) {
  if (!claimData) {
    console.warn('No claim data available, using demo values');
    return;
  }

  // Update nav claim info
  const navClaimNums = document.querySelectorAll('.nav-claim-num');
  if (navClaimNums[0]) navClaimNums[0].textContent = `Claim #${claimData.claimNumber}`;
  if (navClaimNums[1]) navClaimNums[1].textContent = `Day ${claimData.daysSinceLoss} • ${claimData.status.charAt(0).toUpperCase() + claimData.status.slice(1)}`;

  // Update metric strip
  const metricBlocks = document.querySelectorAll('.metric-block');
  if (metricBlocks[0]) {
    const value = metricBlocks[0].querySelector('.metric-value');
    if (value) value.textContent = formatCurrency(claimData.insuranceEstimate);
  }
  if (metricBlocks[1]) {
    const value = metricBlocks[1].querySelector('.metric-value');
    if (value) value.textContent = formatCurrency(claimData.yourEstimate);
  }
  if (metricBlocks[2]) {
    const value = metricBlocks[2].querySelector('.metric-value');
    if (value) value.textContent = formatCurrency(claimData.claimGap);
  }
  if (metricBlocks[3]) {
    const value = metricBlocks[3].querySelector('.metric-value');
    if (value) value.textContent = `Step ${claimData.currentStep} of 18`;
  }

  // Update claim summary panel
  const insuranceEstimateEl = document.getElementById('insuranceEstimate');
  if (insuranceEstimateEl) insuranceEstimateEl.textContent = formatCurrency(claimData.insuranceEstimate);
  
  const yourEstimateEl = document.getElementById('yourEstimate');
  if (yourEstimateEl) yourEstimateEl.textContent = formatCurrency(claimData.yourEstimate);
  
  const claimGapEl = document.getElementById('claimGap');
  if (claimGapEl) claimGapEl.textContent = formatCurrency(claimData.claimGap);

  // Update modal claim number
  const modalClaimNum = document.querySelector('.modal-claim-num');
  if (modalClaimNum) modalClaimNum.textContent = claimData.claimNumber;

  // Update global claimData object
  if (window.claimData) {
    window.claimData.insuranceEstimate = claimData.insuranceEstimate;
    window.claimData.yourEstimate = claimData.yourEstimate;
    window.claimData.claimGap = claimData.claimGap;
    window.claimData.dwellingCoverage = claimData.dwellingCoverage;
    window.claimData.deductible = claimData.deductible;
    window.claimData.settlementType = claimData.settlementType;
  }

  // Update step completion states
  if (claimData.completedSteps.length > 0) {
    window.completedSteps = claimData.completedSteps;
    window.currentStep = claimData.currentStep;
    
    // Apply visual states to step cards
    claimData.completedSteps.forEach(stepNum => {
      const card = document.getElementById(`step-${stepNum}`);
      if (card) {
        card.classList.add('step-done', 'collapsed');
        card.classList.remove('active-card', 'step-locked');
      }
    });

    // Set current step as active
    const currentCard = document.getElementById(`step-${claimData.currentStep}`);
    if (currentCard) {
      currentCard.classList.add('active-card');
      currentCard.classList.remove('step-locked', 'step-done');
    }

    // Update Do This Now banner
    if (window.updateDoThisNow) {
      window.updateDoThisNow(claimData.currentStep);
    }
  }
}

async function initializeClaimCommandCenter() {
  // Get claim ID from URL parameter or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const claimId = urlParams.get('claim_id') || localStorage.getItem('current_claim_id');

  if (!claimId) {
    console.warn('No claim ID provided, using demo data');
    return;
  }

  // Load and populate data
  const claimData = await loadClaimData(claimId);
  if (claimData) {
    populateUI(claimData);
    
    // Store claim ID for future use
    localStorage.setItem('current_claim_id', claimId);
  }
}

// Export functions
window.loadClaimData = loadClaimData;
window.populateUI = populateUI;
window.initializeClaimCommandCenter = initializeClaimCommandCenter;

// Auto-initialize if not in demo mode
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeClaimCommandCenter);
} else {
  initializeClaimCommandCenter();
}
