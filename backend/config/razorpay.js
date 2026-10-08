/* ==========================================================================
   RAZORPAY CONFIGURATION — the only place Razorpay credentials are read.

   Put your keys in backend/.env (never in the frontend, never on GitHub):

     RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
     RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

   Test keys come from the Razorpay Dashboard in "Test mode"
   (Settings -> API Keys -> Generate Test Key).
   Switching to live payments later only means replacing these two values.
   ========================================================================== */

const Razorpay = require("razorpay");

// Friendly message shown to guests when the keys are not configured yet
const NOT_CONFIGURED_MESSAGE =
  "Online payment is temporarily unavailable. Please contact the resort for assistance.";

const PLACEHOLDERS = ["", "your_razorpay_key_id", "your_razorpay_key_secret"];

function getKeys() {
  return {
    keyId: (process.env.RAZORPAY_KEY_ID || "").trim(),
    keySecret: (process.env.RAZORPAY_KEY_SECRET || "").trim(),
  };
}

// true only when both real keys are present
function isRazorpayConfigured() {
  const { keyId, keySecret } = getKeys();
  return !PLACEHOLDERS.includes(keyId) && !PLACEHOLDERS.includes(keySecret);
}

// Public key id — safe to send to the browser
function getPublicKeyId() {
  return getKeys().keyId;
}

// Secret key — backend only, used for signature verification
function getKeySecret() {
  return getKeys().keySecret;
}

// Razorpay client. Throws a friendly error when the keys are missing.
function getRazorpay() {
  if (!isRazorpayConfigured()) {
    console.error(
      "[razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing in backend/.env"
    );
    const err = new Error(NOT_CONFIGURED_MESSAGE);
    err.code = "RAZORPAY_NOT_CONFIGURED";
    throw err;
  }
  const { keyId, keySecret } = getKeys();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

module.exports = {
  getRazorpay,
  isRazorpayConfigured,
  getPublicKeyId,
  getKeySecret,
  NOT_CONFIGURED_MESSAGE,
};
