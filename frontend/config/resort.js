/* ==========================================================================
   RESORT / POLICY CONFIGURATION — single source of truth.
   These values are used by the booking pages and the policy pages, so the
   resort team can update rules without editing any page content.
   ========================================================================== */

const RESORT_CONFIG = {
  // Booking rules
  BOOKING_WINDOW_MONTHS: 3, // guests may book up to this many months ahead
  TAX_RATE_PERCENT: 12, // shown when the backend is not reachable
  CHECK_IN_TIME: "12:00 PM",
  CHECK_OUT_TIME: "10:00 AM",
  MAX_GUESTS_PER_ROOM: 3, // 2 adults + 1 child

  // Property rules (edit these instead of editing the Terms page text)
  SMOKING_POLICY: "Smoking is not permitted inside the rooms.",
  ALCOHOL_POLICY:
    "Alcohol consumption, where permitted, must follow applicable state regulations and resort instructions.",
  PET_POLICY: "Pets are allowed only with prior written approval from the resort.",
  ID_PROOF_POLICY:
    "Every adult guest must present a valid government-issued photo identity document at check-in.",

  // Cancellation rules — placeholders the resort can finalise later
  CANCELLATION_NOTICE_HOURS: 48, // notice the resort prefers before check-in
  CANCELLATION_CHARGE_NOTE:
    "Applicable cancellation charges and refund eligibility depend on the booking type, rate plan, cancellation date and any special package conditions communicated at the time of booking.",
  REFUND_PROCESSING_NOTE:
    "Approved refunds are returned through the original payment method. The time taken depends on the payment gateway, bank, card issuer or UPI provider.",

  // Legal
  JURISDICTION: "Madhya Pradesh, India (to be finalised by resort management)",
  POLICY_LAST_UPDATED: "September 2026",
};
