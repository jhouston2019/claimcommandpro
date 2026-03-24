/**
 * Stripe Checkout Integration
 */

window.launchClaimCheckout = async function() {
  const btn = document.getElementById('checkout-complete');

  // Visual loading state on the button itself
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Preparing checkout...';
  }

  try {
    // Attempt to get the logged-in user — optional, not required
    let user = null;
    try {
      if (window.CNAuth) {
        user = await window.CNAuth.currentUser();
      }
    } catch (e) {
      // Auth unavailable — fall through to guest checkout
    }

    let response;

    if (user && user.id && user.email) {
      // Authenticated checkout
      response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, email: user.email })
      });
    } else {
      // Guest checkout — Stripe will collect email on its page
      response = await fetch('/.netlify/functions/create-checkout-session-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'checkout_page' })
      });
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${response.status}`);
    }

    const { url } = await response.json();

    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL returned from server');
    }

  } catch (error) {
    console.error('CNError (Stripe Checkout):', error);

    // Restore button
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🔒 Proceed to Secure Checkout';
    }

    // Show visible error — works even if CNToast is not loaded
    if (window.CNToast) {
      window.CNToast.error('Could not start checkout. Please try again.');
    } else {
      alert('Could not start checkout. Please try again.\n\n' + error.message);
    }
  }
};
