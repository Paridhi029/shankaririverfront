/* ==========================================================================
   Contact / enquiry form. Enquiries are saved in MongoDB.
   ========================================================================== */

async function handleEnquiry(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById("contactMessage");

  const body = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    message: form.message.value.trim(),
  };

  if (body.name.length < 2) return showMessage(msg, "Please enter your name", "error");
  if (!/^\S+@\S+\.\S+$/.test(body.email)) return showMessage(msg, "Please enter a valid email", "error");
  if (body.message.length < 5) return showMessage(msg, "Please enter your message", "error");

  try {
    const data = await apiPost("/api/enquiries", body);
    showMessage(msg, data.message, "success");
    form.reset();
  } catch (err) {
    showMessage(msg, err.message, "error");
  }
}

// Load admin-editable contact details (falls back to config.js values)
async function loadContactContent() {
  try {
    const content = await apiGet("/api/content");
    const map = {
      contentPhone: content.contactPhone,
      contentEmail: content.contactEmail,
      contentAddress: content.contactAddress,
    };
    Object.keys(map).forEach((id) => {
      const el = document.getElementById(id);
      if (el && map[id]) el.textContent = map[id];
    });
  } catch (err) {
    // backend offline: config.js values stay visible
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (form) form.addEventListener("submit", handleEnquiry);
  loadContactContent();
});
